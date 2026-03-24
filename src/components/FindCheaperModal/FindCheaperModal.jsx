import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { filterClient, getUserProfile } from '../../services/apiClient'

function formatPhone(value) {
  const digits = value.replace(/\D/g, '')
  let d = digits
  if (d.startsWith('8') && d.length > 1) d = '7' + d.slice(1)
  if (!d.startsWith('7') && d.length > 0) d = '7' + d

  let result = '+7'
  if (d.length > 1) result += ' (' + d.slice(1, 4)
  if (d.length >= 4) result += ') ' + d.slice(4, 7)
  if (d.length >= 7) result += '-' + d.slice(7, 9)
  if (d.length >= 9) result += '-' + d.slice(9, 11)
  return result
}

function FindCheaperModal({ productName, productId, productPrice, onClose }) {
  const { isAuthenticated } = useSelector((s) => s.auth)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [link, setLink] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) return
    getUserProfile().then((res) => {
      const u = res.data?.message || res.data?.data || res.data || {}
      const uName = u.name || u.NAME || ''
      const uPhone = u.phone || u.PERSONAL_PHONE || u.PHONE || ''
      if (uName) setName(uName)
      if (uPhone) setPhone(formatPhone(uPhone))
    }).catch(() => {})
  }, [isAuthenticated])

  const phoneDigits = phone.replace(/\D/g, '')
  const isValid = name.trim().length >= 2 && phoneDigits.length === 11 && link.trim().length > 0 && agreed

  const handlePhoneChange = (e) => {
    const raw = e.target.value
    if (raw.length < 2) {
      setPhone('+7')
      return
    }
    setPhone(formatPhone(raw))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid || sending) return
    setSending(true)
    setError('')

    try {
      const fd = new FormData()
      fd.append('form_name', 'Нашли дешевле')
      fd.append('name', name.trim())
      fd.append('phone', '+' + phoneDigits)
      fd.append('link', link.trim())
      fd.append('product_id', productId)
      fd.append('product_name', productName)
      fd.append('price', productPrice)
      await filterClient.post('/find-low-price', fd)
      setSent(true)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error
      setError(msg || 'Не удалось отправить заявку. Попробуйте позже.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="preorder-modal" onClick={(e) => e.stopPropagation()}>
        <button className="preorder-modal__close" onClick={onClose} aria-label="Закрыть">&times;</button>

        {sent ? (
          <div className="preorder-modal__success">
            <h3>Заявка отправлена!</h3>
            <p>Мы рассмотрим вашу заявку и постараемся сделать скидку на товар «{productName}».</p>
            <button className="preorder-modal__btn" onClick={onClose}>Закрыть</button>
          </div>
        ) : (
          <>
            <h3 className="preorder-modal__title">Пришлите ссылку — получите скидку!</h3>
            <p className="preorder-modal__product">
              Нашли дешевле товар <strong>{productName}</strong>? Сообщите нам, мы постараемся сделать для Вас скидку.
            </p>
            <form className="preorder-modal__form" onSubmit={handleSubmit}>
              <label className="preorder-modal__label">
                Имя
                <input
                  className="preorder-modal__input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите ваше имя"
                  autoComplete="name"
                />
              </label>
              <label className="preorder-modal__label">
                Телефон
                <input
                  className="preorder-modal__input"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  onFocus={() => { if (!phone) setPhone('+7') }}
                  placeholder="+7 (___) ___-__-__"
                  autoComplete="tel"
                />
              </label>
              <label className="preorder-modal__label">
                Ссылка на низкую цену
                <input
                  className="preorder-modal__input"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                />
              </label>
              <label className="preorder-modal__agree">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span>Нажимая на кнопку, я принимаю условия <a href="/politika-konfidentsialnosti/" target="_blank" rel="noopener noreferrer">соглашения</a> и даю согласие на обработку персональных данных.</span>
              </label>
              {error && <div className="preorder-modal__error">{error}</div>}
              <button
                className="preorder-modal__btn"
                type="submit"
                disabled={!isValid || sending}
              >
                {sending ? 'Отправка...' : 'Отправить'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default FindCheaperModal
