#!/usr/bin/env bash
# Подготовка чистого VPS (Ubuntu 26.04) под Bitrix-бэкенд TopDisk.
# Всё называется под будущий домен back.topdisc.ru, доступ пока по IP.
#
#   sudo bash setup.sh
#
# Повторный запуск безопасен: существующие сертификат, пароль БД и т.п. не
# пересоздаются. Сам Bitrix этот скрипт НЕ ставит — сайт переносится с
# cw325546.tw1.ru резервной копией (см. README.md в этой папке).
set -euo pipefail

DOMAIN=back.topdisc.ru
FRONT_IP=201.24.52.252          # сервер фронта topdisc.ru
SITE_DIR=/var/www/$DOMAIN
DB_NAME=topdisk
DB_USER=topdisk
CREDS=/root/$DOMAIN-db.txt
HERE="$(cd "$(dirname "$0")" && pwd)"

[ "$(id -u)" = 0 ] || { echo "Запускать от root (sudo bash setup.sh)"; exit 1; }

IP="$(ip -4 route get 1.1.1.1 | awk '{for(i=1;i<NF;i++) if($i=="src") print $(i+1)}')"
echo "== IP сервера: $IP"

echo "== Пакеты"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y nginx mysql-server openssl curl unzip cron ufw \
  php-fpm php-cli php-mysql php-gd php-mbstring php-xml php-curl php-zip \
  php-intl php-bcmath php-soap
# В новых PHP opcache встроен и отдельного пакета нет — не ошибка.
apt-get install -y php-opcache 2>/dev/null || true

PHPV="$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')"
echo "== PHP $PHPV"

echo "== Папки"
mkdir -p "$SITE_DIR" /var/www/letsencrypt /var/log/php "/etc/ssl/$DOMAIN"
chown -R www-data:www-data "$SITE_DIR"
chown www-data:www-data /var/log/php

echo "== Самоподписанный сертификат (до появления DNS $DOMAIN)"
if [ ! -s "/etc/ssl/$DOMAIN/fullchain.pem" ]; then
  openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
    -keyout "/etc/ssl/$DOMAIN/privkey.pem" -out "/etc/ssl/$DOMAIN/fullchain.pem" \
    -subj "/CN=$DOMAIN" -addext "subjectAltName=DNS:$DOMAIN,IP:$IP"
  chmod 600 "/etc/ssl/$DOMAIN/privkey.pem"
else
  echo "   уже есть — не трогаю"
fi

echo "== PHP: общие настройки для Bitrix (fpm + cli)"
for SAPI in fpm cli; do
  cat > "/etc/php/$PHPV/$SAPI/conf.d/99-bitrix.ini" <<'INI'
; TopDisk / Bitrix
short_open_tag = On
date.timezone = Europe/Moscow
default_charset = UTF-8
max_input_vars = 10000
realpath_cache_size = 4096k
opcache.enable = 1
opcache.enable_cli = 0
opcache.memory_consumption = 256
opcache.interned_strings_buffer = 32
opcache.max_accelerated_files = 100000
opcache.revalidate_freq = 0
opcache.validate_timestamps = 1
INI
done

echo "== PHP-FPM: пул $DOMAIN"
cat > "/etc/php/$PHPV/fpm/pool.d/$DOMAIN.conf" <<POOL
[$DOMAIN]
user = www-data
group = www-data
listen = /run/php/$DOMAIN.sock
listen.owner = www-data
listen.group = www-data

; Под 4 ГБ RAM. Больше памяти — можно поднять max_children.
pm = dynamic
pm.max_children = 16
pm.start_servers = 4
pm.min_spare_servers = 2
pm.max_spare_servers = 6
pm.max_requests = 500

php_admin_value[memory_limit] = 512M
php_admin_value[post_max_size] = 1024M
php_admin_value[upload_max_filesize] = 1024M
php_admin_value[max_execution_time] = 300
php_admin_flag[display_errors] = off
php_admin_flag[log_errors] = on
php_admin_value[error_log] = /var/log/php/$DOMAIN.error.log
POOL
systemctl enable --now "php$PHPV-fpm"
systemctl restart "php$PHPV-fpm"

echo "== MySQL: настройки для Bitrix"
RAM_MB="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)"
POOL_MB=$(( RAM_MB / 4 )); [ "$POOL_MB" -lt 256 ] && POOL_MB=256
cat > /etc/mysql/mysql.conf.d/zz-bitrix.cnf <<CNF
[mysqld]
bind-address = 127.0.0.1
sql_mode = ""
innodb_strict_mode = OFF
transaction_isolation = READ-COMMITTED
innodb_flush_log_at_trx_commit = 2
innodb_buffer_pool_size = ${POOL_MB}M
max_allowed_packet = 256M
skip-name-resolve
disable_log_bin
CNF
systemctl enable --now mysql
systemctl restart mysql

echo "== MySQL: база и пользователь"
if [ -s "$CREDS" ]; then
  echo "   $CREDS уже есть — пароль не меняю"
else
  DB_PASS="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)"
  mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
ALTER USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQL
  umask 077
  printf 'host=localhost\ndb=%s\nuser=%s\npassword=%s\n' "$DB_NAME" "$DB_USER" "$DB_PASS" > "$CREDS"
fi

echo "== nginx"
install -m 644 "$HERE/nginx-$DOMAIN.conf" "/etc/nginx/sites-available/$DOMAIN"
ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

echo "== Файрвол"
ufw allow OpenSSH >/dev/null
# На время переноса открыто всем (restore.php, админка по IP). После
# переноса закрыть — см. README.md, шаг "Закрыть бэк".
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null
ufw status

cat <<DONE

================ ГОТОВО ================
Папка сайта:   $SITE_DIR
PHP:           $PHPV, пул /run/php/$DOMAIN.sock
БД:            $CREDS
Проверка:      curl -k https://$IP/   (пока 403/404 — сайт ещё не залит)
Дальше:        README.md, шаг 2 — перенос сайта.
========================================
DONE
