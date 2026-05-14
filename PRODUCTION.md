# Production Deployment Guide

## Проблема CORS на production

На production сервере (`31.129.101.230`) возникает ошибка CORS при обращении к API `https://topdisc.ru/mobile/v1/`.

**Причина:** В dev режиме Vite проксирует запросы `/api/mobile/*` → `https://topdisc.ru/mobile/*`. На production этого прокси нет, и браузер блокирует прямые запросы.

## Решение: настройка nginx

### 1. Установите конфигурацию nginx

На сервере создайте файл `/etc/nginx/sites-available/topdisk`:

```bash
sudo nano /etc/nginx/sites-available/topdisk
```

Скопируйте содержимое из файла `nginx-production.conf` (см. корень проекта).

### 2. Активируйте конфигурацию

```bash
# Создайте символическую ссылку
sudo ln -s /etc/nginx/sites-available/topdisk /etc/nginx/sites-enabled/

# Проверьте конфигурацию
sudo nginx -t

# Перезапустите nginx
sudo systemctl reload nginx
```

### 3. Проверьте работу

После перезагрузки nginx все запросы `/api/mobile/*` будут автоматически проксироваться на `https://topdisc.ru/mobile/*`.

Откройте консоль браузера (F12) и проверьте, что:
- ✅ Запросы к `/api/mobile/v1/user/profile` выполняются успешно
- ✅ Запросы к `/api/mobile/v1/favorites/list` выполняются успешно
- ✅ Нет ошибок CORS

## Альтернатива: настройка CORS на API

Если у вас есть доступ к серверу API `topdisc.ru`, можно настроить CORS заголовки:

```nginx
add_header 'Access-Control-Allow-Origin' 'https://31.129.101.230' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
```

**Но это небезопасно!** Лучше использовать nginx прокси.

## Deployment checklist

- [ ] Сборка проекта: `npm run build`
- [ ] Копирование `dist/` на сервер в `/var/www/topdisk/dist/`
- [ ] Настройка nginx конфигурации
- [ ] Перезагрузка nginx: `sudo systemctl reload nginx`
- [ ] Проверка работы сайта
- [ ] Проверка API запросов в консоли браузера
- [ ] Проверка работы авторизации
- [ ] Проверка работы корзины

## Troubleshooting

### Ошибка 502 Bad Gateway

Проблема: nginx не может подключиться к `topdisc.ru`.

Решение:
```bash
# Проверьте доступность API
curl -I https://topdisc.ru/mobile/v1/

# Проверьте логи nginx
sudo tail -f /var/log/nginx/topdisk_error.log
```

### Ошибка 404 для статических файлов

Проблема: файлы не найдены в `/var/www/topdisk/dist/`.

Решение:
```bash
# Проверьте права доступа
ls -la /var/www/topdisk/dist/

# Установите правильные права
sudo chown -R www-data:www-data /var/www/topdisk/dist/
sudo chmod -R 755 /var/www/topdisk/dist/
```

### Cookies не сохраняются

Проблема: авторизация не работает после перезагрузки страницы.

Решение: убедитесь, что в nginx конфигурации есть строка:
```nginx
proxy_cookie_domain topdisc.ru $host;
```

## Автоматизация deployment

Создайте скрипт `deploy.sh`:

```bash
#!/bin/bash
echo "Building project..."
npm run build

echo "Uploading to server..."
rsync -avz --delete dist/ root@31.129.101.230:/var/www/topdisk/dist/

echo "Reloading nginx..."
ssh root@31.129.101.230 "systemctl reload nginx"

echo "Deployment complete!"
```

Запуск:
```bash
chmod +x deploy.sh
./deploy.sh
```
