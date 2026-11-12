# back.topdisc.ru — Bitrix-бэкенд на отдельном VPS

Бэк TopDisk переезжает с хостинга Timeweb (`cw325546.tw1.ru`) на свой VPS
с Ubuntu 26.04, IP `217.114.5.10` (2026-11-11). На VPS всё сразу названо под будущий домен
`back.topdisc.ru`:

| Что | Где |
|---|---|
| сайт (DOCUMENT_ROOT) | `/var/www/back.topdisc.ru` |
| nginx | `/etc/nginx/sites-available/back.topdisc.ru` |
| php-fpm | пул `back.topdisc.ru`, сокет `/run/php/back.topdisc.ru.sock` |
| сертификат | `/etc/ssl/back.topdisc.ru/` (самоподписанный, CN/SAN = back.topdisc.ru + IP) |
| логи | `/var/log/nginx/back.topdisc.ru.*.log`, `/var/log/php/back.topdisc.ru.error.log` |
| БД | `topdisk` / пользователь `topdisk`, пароль — `/root/back.topdisc.ru-db.txt` |

Пока DNS `back.topdisc.ru` на VPS не указывает, сервер работает по IP. Браузеры
к нему напрямую не ходят: фронт `topdisc.ru` проксирует к бэку API, картинки
(`/upload/`), `/local/` и `/bitrix/` (включая админку). Поэтому админка
открывается как `https://topdisc.ru/bitrix/admin/`, с нормальным сертификатом.

## 1. Подготовить VPS

Скопировать эту папку на VPS (через `git clone` репозитория или scp), затем:

```bash
sudo bash setup.sh
```

Скрипт ставит nginx, MySQL, PHP-FPM, Redis (нужен `api_metods.php`) с настройками под Bitrix, создаёт папки,
сертификат, базу и пользователя, открывает порты 22/80/443.

Если `apt` пишет «Temporary failure resolving», не работает DNS. Лечится так же,
как на сервере фронта: прописать DNS 8.8.8.8, 1.1.1.1 и 77.88.8.8 в systemd-resolved.

## 2. Перенести сайт с cw325546.tw1.ru

Перенос делается штатным резервным копированием Bitrix.

1. На старом бэке: `cw325546.tw1.ru/bitrix/admin/` → Настройки → Инструменты →
   Резервное копирование → Создать резервную копию (полную, с базой и `/upload/`).
   Скопировать ссылку на архив.
2. На VPS:
   ```bash
   cd /var/www/back.topdisc.ru
   curl -fLO https://www.1c-bitrix.ru/download/scripts/restore.php
   chown www-data:www-data restore.php
   ```
3. В браузере открыть `https://217.114.5.10/restore.php` (предупреждение о сертификате
   ожидаемо, его можно пропустить). Выбрать «Скачать резервную копию с другого
   сайта» и вставить ссылку на архив. Параметры БД взять из
   `/root/back.topdisc.ru-db.txt`.
4. Когда восстановление закончится, `restore.php` и архив удалить, иначе их
   скачает кто угодно. Также удалить архив на старом бэке.

## 3. Настроить Bitrix под back.topdisc.ru

В админке (`https://217.114.5.10/bitrix/admin/`):

- Настройки → Настройки продукта → Сайты → `s1`: «Доменное имя» и «URL сервера»
  = `back.topdisc.ru`.
- Настройки → Настройки продукта → Настройки модулей → Главный модуль →
  «URL сайта» = `back.topdisc.ru`.
- Ссылки на картинки в текстах, оставшиеся от импорта на временном хосте,
  превратить в относительные (выполнить на VPS):
  ```bash
  mysql topdisk -e "
  UPDATE b_iblock_element SET
    DETAIL_TEXT  = REPLACE(DETAIL_TEXT,  'https://cw325546.tw1.ru/', '/'),
    PREVIEW_TEXT = REPLACE(PREVIEW_TEXT, 'https://cw325546.tw1.ru/', '/')
  WHERE DETAIL_TEXT LIKE '%cw325546%' OR PREVIEW_TEXT LIKE '%cw325546%';"
  ```
- Настройки → Производительность → Проверка системы: нужна зелёная проверка
  PHP и MySQL. Если PHP из Ubuntu 26.04 окажется новее версии, которую
  поддерживает ядро Bitrix, проверка об этом сообщит.

Вебхук REST (`3/ky7kc0zinte6jb7e`), ID инфоблоков и настройки sotbit.restapi
переезжают вместе с базой, их менять не нужно.

Проверить бэк с VPS:

```bash
curl -sk -H 'Host: back.topdisc.ru' https://127.0.0.1/rest/3/ky7kc0zinte6jb7e/app_mobile.menu.json | head -c 300
```

## 4. Переключить фронт (сервер topdisc.ru)

Конфиг nginx — `nginx-backvps.conf` из корня репозитория, он заменяет
`nginx-newback.conf`.

```bash
cd /var/www/topdisk-new && git pull
cp nginx-backvps.conf /etc/nginx/sites-available/topdisk-new
mkdir -p /var/cache/nginx/td_static && chown www-data /var/cache/nginx/td_static
nginx -t && systemctl reload nginx
```

В `.env.newback` на сервере фронта:

```
VITE_BACKEND_ORIGIN=https://topdisc.ru
VITE_REST_WEBHOOK=3/ky7kc0zinte6jb7e
VITE_CATALOG_IBLOCK_ID=12
VITE_PREMIUM_IBLOCK_ID=14
VITE_BITRIX_REST_URL=http://127.0.0.1:8081/rest/3/ky7kc0zinte6jb7e
VITE_FILTER_API_URL=http://127.0.0.1:8081/mobile/v1
```

В systemd-юните фронта (`systemctl edit topdisk-new`) добавить к остальным
`Environment=` строки:

```
Environment=VITE_BACKEND_ORIGIN=https://topdisc.ru
Environment=BITRIX_SERVER_ORIGIN=http://127.0.0.1:8081
```

Затем пересобрать и перезапустить:

```bash
npm run build:newback && systemctl restart topdisk-new
rm -rf /var/cache/nginx/td_api   # кэш API от nginx-newback.conf больше не используется
```

## 5. Закрыть бэк

Когда фронт работает, порт 443 на VPS бэка оставить только для фронта. Админка
продолжит открываться через `https://topdisc.ru/bitrix/admin/`.

```bash
ufw delete allow 443/tcp
ufw allow from 201.24.52.252 to any port 443 proto tcp
ufw status
```

Порт 80 можно оставить открытым: позже через него Let's Encrypt будет
проверять домен.

## 6. Потом: включить домен back.topdisc.ru

**Сделано 2026-11-12**: DNS указывает на VPS, сертификат Let's Encrypt
выпущен (certbot 4.0, автопродление — `certbot.timer`, после продления nginx
перечитывает конфиг хуком `/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh`).
Шаги ниже — для повторной установки.

1. В DNS добавить A-запись `back.topdisc.ru` с IP VPS.
2. На VPS:
   `certbot certonly --webroot -w /var/www/letsencrypt -d back.topdisc.ru`.
3. В `/etc/nginx/sites-available/back.topdisc.ru` заменить пути
   `ssl_certificate*` на `/etc/letsencrypt/live/back.topdisc.ru/...` и выполнить
   `nginx -t && systemctl reload nginx`.
4. Фронт может работать по-прежнему. Если нужно отдавать картинки напрямую с
   бэка, убрать `VITE_BACKEND_ORIGIN` (по умолчанию он и так
   `https://back.topdisc.ru`), открыть 443 на VPS для всех и пересобрать фронт.
