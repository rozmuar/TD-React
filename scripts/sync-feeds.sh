#!/usr/bin/env bash
# Забирает фиды и sitemap с бэкенда (back.topdisc.ru) и кладёт в корень
# фронтенда, чтобы они отдавались с https://topdisc.ru/<файл>.
#
# Запуск по cron, например каждые 15 минут:
#   */15 * * * * /var/www/topdisk/scripts/sync-feeds.sh >> /var/log/topdisk-feeds.log 2>&1
#
# Node (server.js) раздаёт dist/client через express.static, поэтому файлы
# в этой папке сразу доступны по URL без перезапуска. Но `npm run build`
# очищает dist/client — после сборки запустите скрипт вручную (или дождитесь cron).
#
# Переменные окружения (необязательно):
#   TARGET_DIR  куда класть файлы   (по умолчанию /var/www/topdisk/dist/client)
#   BACKEND     откуда забирать     (по умолчанию https://back.topdisc.ru)
#   FRONT_HOST  домен для sitemap   (по умолчанию https://topdisc.ru)
#   PARALLEL    потоков для sitemap-частей (по умолчанию 8)

set -u

TARGET_DIR="${TARGET_DIR:-/var/www/topdisk/dist/client}"
BACKEND="${BACKEND:-https://back.topdisc.ru}"
FRONT_HOST="${FRONT_HOST:-https://topdisc.ru}"

FEEDS=(
  feed__new_yandex.xml
  feed_cat.csv
  feed_cat.xml
  feed_search.xml
  feed_vk.xml
)

# Не запускаем второй экземпляр, если предыдущий ещё качает большие файлы
exec 9>"/tmp/topdisk-sync-feeds.lock"
flock -n 9 || { echo "$(date '+%F %T') уже выполняется, выходим"; exit 0; }

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$TARGET_DIR" || { echo "Не удалось создать $TARGET_DIR"; exit 1; }

# fetch <имя файла> <sitemap: 0|1>
# Качаем во временный файл, проверяем код и что файл не пустой, и только
# потом атомарно подменяем — при сбое бэкенда остаётся прошлая версия.
# Если локальный файл уже есть, шлём If-Modified-Since (curl -z): бэкенд
# отвечает 304 без тела, и неизменившиеся sitemap (их может быть много)
# не перекачиваются.
fetch() {
  local name="$1" is_sitemap="$2"
  local tmp="$TMP_DIR/$name"
  local dest="$TARGET_DIR/$name"
  local cond=()
  [ -s "$dest" ] && cond=(-z "$dest")

  local code
  code="$(curl -sS -L --max-time 300 --retry 2 ${cond[@]+"${cond[@]}"} -o "$tmp" -w '%{http_code}' "$BACKEND/$name")" || {
    echo "$(date '+%F %T') ОШИБКА curl: $name"
    return 1
  }

  if [ "$code" = "304" ]; then
    return 0
  fi

  if [ "$code" != "200" ] || [ ! -s "$tmp" ]; then
    echo "$(date '+%F %T') ПРОПУСК $name: HTTP $code или пустой файл"
    return 1
  fi

  # В sitemap ссылки должны вести на публичный домен, а не на бэкенд
  if [ "$is_sitemap" = "1" ]; then
    sed -i "s#https\?://back\.topdisc\.ru#${FRONT_HOST}#g; s#https\?://topdisc\.ru#${FRONT_HOST}#g" "$tmp"
  fi

  chmod 644 "$tmp"
  mv -f "$tmp" "$dest" || { echo "$(date '+%F %T') ОШИБКА записи $name"; return 1; }
  echo "$(date '+%F %T') OK $name ($(stat -c %s "$dest") байт)"
}
export -f fetch
export TARGET_DIR BACKEND FRONT_HOST TMP_DIR

for f in "${FEEDS[@]}"; do
  fetch "$f" 0
done

# robots.txt — тоже с бэкенда (Host/Sitemap внутри должны вести на публичный
# домен, поэтому обрабатываем как sitemap)
fetch "robots.txt" 1

# sitemap.xml — индекс (всегда перекачиваем без If-Modified-Since, чтобы
# точно видеть актуальный список частей); из него берём sitemap-*.xml
rm -f "$TARGET_DIR/.sitemap.index.prev"
[ -f "$TARGET_DIR/sitemap.xml" ] && mv "$TARGET_DIR/sitemap.xml" "$TARGET_DIR/.sitemap.index.prev"
if fetch "sitemap.xml" 1; then
  rm -f "$TARGET_DIR/.sitemap.index.prev"
else
  # не удалось скачать — возвращаем прошлый индекс, ничего не удаляем
  [ -f "$TARGET_DIR/.sitemap.index.prev" ] && mv "$TARGET_DIR/.sitemap.index.prev" "$TARGET_DIR/sitemap.xml"
  exit 1
fi

PARTS_FILE="$TMP_DIR/parts.txt"
grep -oE '<loc>[^<]+</loc>' "$TARGET_DIR/sitemap.xml"   | sed -E 's#</?loc>##g'   | sed -E 's#.*/##'   | grep -E '^sitemap-.+\.xml$'   | sort -u > "$PARTS_FILE"

echo "$(date '+%F %T') sitemap-частей в индексе: $(wc -l < "$PARTS_FILE")"

# Параллельная загрузка частей (PARALLEL потоков)
PARALLEL="${PARALLEL:-8}"
xargs -a "$PARTS_FILE" -P "$PARALLEL" -I{} bash -c 'fetch "$1" 1' _ {}

# Удаляем sitemap-*.xml, которых больше нет в индексе (иначе копятся устаревшие)
# Защита: чистим только если в индексе есть хотя бы одна часть.
if [ -s "$PARTS_FILE" ]; then
  for old in "$TARGET_DIR"/sitemap-*.xml; do
    [ -e "$old" ] || continue
    grep -qxF "$(basename "$old")" "$PARTS_FILE" || { rm -f "$old"; echo "$(date '+%F %T') удалён устаревший $(basename "$old")"; }
  done
fi
