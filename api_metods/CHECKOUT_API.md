# Checkout API (`/v1/sale/checkout`)

Документ описывает сценарий оформления заказа и получение LOCATION через endpoint:

- `GET /sale/location/code`
- `GET /checkout/context`
- `POST /checkout/calculate`
- `POST /checkout/submit`

Ниже примеры даны для базового пути `https://topdisc.ru/mobile/v1`.

---

## Общая схема работы

Рекомендуемый порядок вызовов:

1. `GET /sale/checkout/context`  
   Получить стартовые данные checkout: типы плательщиков, доступные доставки/оплаты, текущие суммы, список обязательных свойств.
2. `POST /sale/checkout/calculate`  
   Передать выбор пользователя (тип плательщика, свойства, доставка, оплата) и получить пересчет с учетом ограничений Bitrix.
3. `POST /sale/checkout/submit`  
   Отправить финальные данные и создать заказ.

---

## Авторизация

`/sale/*` находится под `Auth` middleware, поэтому запросы нужно выполнять от авторизованного пользователя (или с действующим механизмом авторизации вашего API).

Пример заголовков:

```http
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
```

---

## Получение LOCATION по городу

`GET /sale/location/code` — вспомогательный метод для получения кода местоположения по названию города.

Параметры:
- `city` (`string`, обязательно), пример: `Пенза`

Пример:

```bash
curl -X GET "https://topdisc.ru/mobile/v1/sale/location/code?city=Пенза" \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json"
```

Ответ (сокращенно):

```json
{
  "success": true,
  "data": {
    "query": "Пенза",
    "location_code": "0000073738",
    "items": [
      {
        "id": 1234,
        "code": "0000073738",
        "name": "Пенза",
        "type": "CITY"
      }
    ]
  }
}
```

Используйте `data.location_code` в методах checkout как `location` и/или `properties.LOCATION`.

---

## 1) `GET /sale/checkout/context`

### Назначение

Возвращает текущий контекст checkout по корзине пользователя:

- доступные типы плательщиков;
- доступные способы доставки (с учетом ограничений и расчета);
- доступные способы оплаты (с учетом ограничений);
- свойства заказа и незаполненные обязательные;
- суммы (`basket`, `delivery`, `discount`, `tax`, `total`);
- признак `can_submit`.

### Query-параметры

Все параметры опциональны:

- `person_type_id` (`int`) — предварительно выбранный тип плательщика.
- `delivery_id` (`int`) — предварительно выбранная доставка.
- `pay_system_id` (`int`) — предварительно выбранная оплата.
- `location` (`string|int`) — код/ID местоположения (город). Рекомендуется передавать, чтобы получить корректный список доставок.

### Пример запроса

```bash
curl -X GET "https://topdisc.ru/mobile/v1/sale/checkout/context?person_type_id=1&delivery_id=3&pay_system_id=5&location=0000073738" \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json"
```

### Пример успешного ответа (сокращенно)

```json
{
  "success": true,
  "can_submit": false,
  "errors": [],
  "checkout": {
    "person_types": [
      { "id": 1, "name": "Физическое лицо", "sort": 100 }
    ],
    "selected": {
      "person_type_id": 1,
      "delivery_id": 3,
      "pay_system_id": 5
    },
    "properties": [
      {
        "id": 7,
        "code": "PHONE",
        "name": "Телефон",
        "required": true,
        "value": "+7..."
      }
    ],
    "missing_required_properties": [],
    "available_deliveries": [
      {
        "id": 3,
        "name": "Курьер",
        "logotip": "https://topdisc.ru/upload/sale/delivery/logo.png",
        "selected": true,
        "available": true,
        "price": 350,
        "price_formatted": "350 руб.",
        "period_text": "1-2 дня"
      }
    ],
    "available_pay_systems": [
      {
        "id": 5,
        "name": "Онлайн оплата",
        "logotip": "https://topdisc.ru/upload/sale/paysystem/logo.png",
        "selected": true,
        "available": true
      }
    ],
    "totals": {
      "currency": "RUB",
      "basket_price": 12000,
      "delivery_price": 350,
      "discount_price": 1200,
      "tax_price": 0,
      "total_price": 11150
    }
  }
}
```

---

## 2) `POST /sale/checkout/calculate`

### Назначение

Промежуточный пересчет checkout после действий пользователя:

- сменил тип плательщика;
- заполнил/изменил свойства заказа;
- выбрал доставку;
- выбрал оплату.

`calculate` **не создает заказ**, только валидирует и пересчитывает.

### Тело запроса (`application/json`)

Параметры:

- `person_type_id` (`int`, опционально, но рекомендуется)
- `delivery_id` (`int`, опционально)
- `pay_system_id` (`int`, опционально)
- `location` (`string|int`, опционально, рекомендуется) — код/ID местоположения (город), влияет на доступность доставок.
- `properties` (`object|array`, опционально)
- `comment` (`string`, опционально; для `calculate` не обязателен, но можно передавать единообразно)

Поддерживаются 2 формата `properties`:

1. Объект (ключ = `ID` свойства или `CODE` свойства):

```json
{
  "properties": {
    "LOCATION": "0000073738",
    "7": "+79990000000",
    "EMAIL": "user@example.com",
    "ADDRESS": "Москва, ул. Пример, 1"
  }
}
```

2. Массив объектов:

```json
{
  "properties": [
    { "code": "LOCATION", "value": "0000073738" },
    { "id": 7, "value": "+79990000000" },
    { "code": "EMAIL", "value": "user@example.com" },
    { "code": "ADDRESS", "value": "Москва, ул. Пример, 1" }
  ]
}
```

### Пример запроса

```bash
curl -X POST "https://topdisc.ru/mobile/v1/sale/checkout/calculate" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "person_type_id": 1,
    "delivery_id": 3,
    "pay_system_id": 5,
    "location": "0000073738",
    "properties": {
      "LOCATION": "0000073738",
      "PHONE": "+79990000000",
      "EMAIL": "user@example.com",
      "ADDRESS": "Москва, ул. Пример, 1"
    }
  }'
```

### Что смотреть в ответе

- `missing_required_properties` — что обязательно дозаполнить;
- `available_deliveries` — какие доставки реально доступны;
- `available_pay_systems` — какие оплаты реально доступны;
- `errors` — ошибки ограничений/валидации;
- `can_submit` — готов ли checkout к финальному `submit`.

Важно:
- `LOCATION` рекомендуется передавать всегда до выбора доставки.
- `ADDRESS` заполняется только если его требует выбранная доставка (например, курьер).
- Для самовывоза адрес может быть не нужен.

---

## 3) `POST /sale/checkout/submit`

### Назначение

Финальный шаг. Создает заказ в Bitrix после полной проверки данных.

### Тело запроса (`application/json`)

Обязательные поля:

- `person_type_id` (`int`) — обязательно
- `delivery_id` (`int`) — обязательно
- `pay_system_id` (`int`) — обязательно

Опционально:

- `location` (`string|int`) — код/ID местоположения (город)
- `properties` (`object|array`) — свойства заказа (обычно передаются те же, что и в `calculate`)
- `comment` (`string`) — комментарий покупателя (запишется в `USER_DESCRIPTION`)

### Пример запроса

```bash
curl -X POST "https://topdisc.ru/mobile/v1/sale/checkout/submit" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "person_type_id": 1,
    "delivery_id": 3,
    "pay_system_id": 5,
    "location": "0000073738",
    "properties": {
      "LOCATION": "0000073738",
      "PHONE": "+79990000000",
      "EMAIL": "user@example.com",
      "ADDRESS": "Москва, ул. Пример, 1"
    },
    "comment": "Позвонить за час до доставки"
  }'
```

### Пример успешного ответа

```json
{
  "success": true,
  "order": {
    "id": 12345,
    "account_number": "12345/1",
    "status_id": "N",
    "price": 11150,
    "price_formatted": "11 150 руб.",
    "currency": "RUB"
  },
  "payment": [
    {
      "id": 9876,
      "pay_system_id": 5,
      "pay_system_name": "Онлайн оплата",
      "sum": 11150,
      "currency": "RUB",
      "paid": false
    }
  ]
}
```

---

## Когда какой метод вызывать

- **Открыли экран checkout** -> `GET /context`
- **Пользователь поменял что-то в форме** (плательщик, адрес, доставка, оплата) -> `POST /calculate`
- **Нажал "Оформить заказ"** -> `POST /submit`

---

## Типовые ошибки и что делать

- `Корзина пуста`  
  Добавить товары в корзину перед checkout.

- `Передан недоступный person_type_id`  
  Использовать `person_type_id` только из `checkout.person_types`.

- `Выбранный способ доставки/оплаты недоступен`  
  Повторно вызвать `calculate`, взять актуальные `available_deliveries` / `available_pay_systems`.

- `Не заполнены обязательные свойства заказа`  
  Заполнить поля из `missing_required_properties`.

---

## Рекомендация для фронта/мобилки

Перед `submit` всегда делайте последний `calculate` с текущими данными.  
Это снижает риск отказа из-за изменившихся ограничений (доставка, оплата, скидки, состав корзины).

