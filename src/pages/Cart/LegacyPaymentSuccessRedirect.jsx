import { Navigate, useLocation } from 'react-router-dom'

// Т-Банк после оплаты редиректит браузер клиента на старый адрес Bitrix
// personal/order/success.php?OrderId=78630%2F1&Success=true&... — этот путь
// больше не существует на topdisc.ru (чистый React-фронтенд без PHP), поэтому
// перехватываем его тут и доводим клиента до уже готовой страницы результата
// оплаты. OrderId от Т-Банка приходит в формате "78630/1" (ID заказа + номер
// попытки оплаты через слэш) — берём только ID заказа.
// Важно: Success/ErrorCode и прочие параметры запроса НЕ используются для
// определения статуса оплаты — это данные из адресной строки браузера,
// их может подделать кто угодно. Настоящий статус PaymentResult получает
// от backend по orderId (getOrderById), а не из query-параметров.
export default function LegacyPaymentSuccessRedirect() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const rawOrderId = params.get('OrderId') || ''
  const orderId = rawOrderId.split('/')[0]

  if (!orderId) {
    return <Navigate to="/personal/orders/" replace />
  }

  return <Navigate to={`/cart/payment-result/${orderId}/`} replace />
}
