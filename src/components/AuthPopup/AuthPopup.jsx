import { useState, useEffect, useCallback, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { setToken, initTidAuth, completeTidAuth } from '../../store/slices/authSlice'
import { fetchFavorites } from '../../store/slices/favoritesSlice'
import { mergeGuestCart } from '../../store/slices/cartSlice'
import { sendSmsCode, verifySmsCode, getGuestFuserId } from '../../services/apiClient'

// Маска телефона (на основе phoneinput.js — github.com/Shaadanio/phoneinput)
function formatPhoneValue(value) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''

  let formatted = ''
  let nums = digits

  if (['7', '8', '9'].includes(nums[0])) {
    if (nums[0] === '9') nums = '7' + nums
    const firstSymbols = nums[0] === '8' ? '8' : '+7'
    formatted = firstSymbols + ' '
    if (nums.length > 1) formatted += '(' + nums.substring(1, 4)
    if (nums.length >= 5) formatted += ') ' + nums.substring(4, 7)
    if (nums.length >= 8) formatted += '-' + nums.substring(7, 9)
    if (nums.length >= 10) formatted += '-' + nums.substring(9, 11)
  } else {
    formatted = '+' + nums.substring(0, 16)
  }
  return formatted
}

function getPhoneDigits(value) {
  return value.replace(/\D/g, '')
}

function AuthPopup({ isOpen, onClose }) {
  const dispatch = useDispatch()

  // 'choose' | 'sms-phone' | 'sms-code' | 'tid-waiting'
  const [step, setStep] = useState('choose')
  const [phone, setPhone] = useState('+7 ')
  const phoneRef = useRef(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tidUrl, setTidUrl] = useState('')

  // Сброс при открытии/закрытии
  useEffect(() => {
    if (isOpen) {
      setStep('choose')
      setPhone('+7 ')
      setCode('')
      setError('')
      setLoading(false)
      setTidUrl('')
    }
  }, [isOpen])

  // Закрытие по Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Обработка успешной авторизации
  const handleAuthSuccess = useCallback(async (token) => {
    dispatch(setToken(token))
    
    // Объединяем гостевую корзину с авторизованной
    const guestFuserId = getGuestFuserId()
    if (guestFuserId) {
      try {
        await dispatch(mergeGuestCart()).unwrap()
      } catch (err) {
        console.warn('Failed to merge guest cart:', err)
      }
    }
    
    // Загружаем избранное
    dispatch(fetchFavorites())
    onClose()
  }, [dispatch, onClose])

  // --- Маска ввода телефона ---
  const handlePhoneInput = useCallback((e) => {
    const input = e.target
    const inputDigits = getPhoneDigits(input.value)
    const selectionStart = input.selectionStart

    if (!inputDigits) {
      setPhone('')
      return
    }

    // Редактирование в середине — отсекаем нецифровые символы
    if (input.value.length !== selectionStart) {
      if (e.nativeEvent.data && /\D/.test(e.nativeEvent.data)) {
        setPhone(formatPhoneValue(inputDigits))
        return
      }
    }

    setPhone(formatPhoneValue(inputDigits))
  }, [])

  const handlePhoneKeyDown = useCallback((e) => {
    const inputDigits = getPhoneDigits(e.target.value)
    if (e.key === 'Backspace' && inputDigits.length === 1) {
      setPhone('')
    }
  }, [])

  const handlePhonePaste = useCallback((e) => {
    const pasted = e.clipboardData?.getData('Text')
    if (pasted && /\D/.test(pasted)) {
      e.preventDefault()
      const digits = pasted.replace(/\D/g, '')
      if (digits) setPhone(formatPhoneValue(digits))
    }
  }, [])

  // --- SMS авторизация ---
  const handleSendSms = async (e) => {
    e.preventDefault()
    const digits = getPhoneDigits(phone)
    if (digits.length < 11) {
      setError('Введите корректный номер телефона')
      return
    }
    setLoading(true)
    setError('')
    try {
      await sendSmsCode(digits)
      setStep('sms-code')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Ошибка отправки SMS')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySms = async (e) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('Введите код из SMS')
      return
    }
    setLoading(true)
    setError('')
    try {
      const digits = getPhoneDigits(phone)
      const res = await verifySmsCode(digits, code.trim())
      const token = res.data?.message?.Authorization
      if (token) {
        handleAuthSuccess(token)
      } else {
        setError('Неверный код')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка проверки кода')
    } finally {
      setLoading(false)
    }
  }

  // --- Tinkoff ID авторизация ---
  const handleTidInit = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await dispatch(initTidAuth()).unwrap()
      const url = result.redirectUrl || result.redirect_url
      if (url && url.startsWith('http')) {
        setTidUrl(url)
        setStep('tid-waiting')
        window.open(url, '_blank', 'noopener')
      } else {
        setError('Не удалось получить ссылку для авторизации')
      }
    } catch (err) {
      setError(err || 'Ошибка инициализации Tinkoff ID')
    } finally {
      setLoading(false)
    }
  }

  const handleTidComplete = async () => {
    setLoading(true)
    setError('')
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const authCode = urlParams.get('code')
      const token = await dispatch(completeTidAuth(authCode || undefined)).unwrap()
      if (authCode) window.history.replaceState({}, '', window.location.pathname)
      handleAuthSuccess(token)
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка проверки Tinkoff ID')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-popup" onClick={(e) => e.stopPropagation()}>
        <button className="auth-popup__close" onClick={onClose} aria-label="Закрыть">×</button>

        {step === 'choose' && (
          <>
            <h2 className="auth-popup__title">Войти</h2>
            <p className="auth-popup__subtitle">Выберите способ авторизации</p>
            <div className="auth-popup__methods">
              <button
                className="auth-popup__method-btn auth-popup__method-btn--sms"
                onClick={() => setStep('sms-phone')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.72 11.72 0 003.66.59 1 1 0 011 1v3.59a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.59a1 1 0 011 1 11.72 11.72 0 00.58 3.66 1 1 0 01-.24 1.01l-2.2 2.2z" fill="currentColor"/></svg>
                Войти по SMS
              </button>
              <button
                className="auth-popup__method-btn auth-popup__method-btn--tid"
                onClick={handleTidInit}
                disabled={loading}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor"/><text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">T</text></svg>
                {loading ? 'Загрузка...' : 'Войти через Т‑ID'}
              </button>
            </div>
            {error && <p className="auth-popup__error">{error}</p>}
          </>
        )}

        {step === 'sms-phone' && (
          <>
            <button className="auth-popup__back" onClick={() => { setStep('choose'); setError('') }}>← Назад</button>
            <h2 className="auth-popup__title">Вход по SMS</h2>
            <p className="auth-popup__subtitle">Введите номер телефона</p>
            <form onSubmit={handleSendSms} className="auth-popup__form">
              <input
                ref={phoneRef}
                className="auth-popup__input"
                type="tel"
                placeholder="+7 (___) ___-__-__"
                maxLength={18}
                value={phone}
                onChange={handlePhoneInput}
                onKeyDown={handlePhoneKeyDown}
                onPaste={handlePhonePaste}
                autoFocus
              />
              {error && <p className="auth-popup__error">{error}</p>}
              <button className="auth-popup__submit" type="submit" disabled={loading}>
                {loading ? 'Отправка...' : 'Получить код'}
              </button>
            </form>
          </>
        )}

        {step === 'sms-code' && (
          <>
            <button className="auth-popup__back" onClick={() => { setStep('sms-phone'); setError('') }}>← Назад</button>
            <h2 className="auth-popup__title">Введите код</h2>
            <p className="auth-popup__subtitle">SMS отправлено на {phone}</p>
            <form onSubmit={handleVerifySms} className="auth-popup__form">
              <input
                className="auth-popup__input auth-popup__input--code"
                type="text"
                inputMode="numeric"
                placeholder="Код из SMS"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
                maxLength={6}
              />
              {error && <p className="auth-popup__error">{error}</p>}
              <button className="auth-popup__submit" type="submit" disabled={loading}>
                {loading ? 'Проверка...' : 'Войти'}
              </button>
              <button type="button" className="auth-popup__resend" onClick={handleSendSms} disabled={loading}>
                Отправить код повторно
              </button>
            </form>
          </>
        )}

        {step === 'tid-waiting' && (
          <>
            <button className="auth-popup__back" onClick={() => { setStep('choose'); setError('') }}>← Назад</button>
            <h2 className="auth-popup__title">Tinkoff ID</h2>
            <p className="auth-popup__subtitle">
              Завершите авторизацию в открывшемся окне, затем нажмите кнопку ниже.
            </p>
            {error && <p className="auth-popup__error">{error}</p>}
            <div className="auth-popup__form">
              <button className="auth-popup__submit" onClick={handleTidComplete} disabled={loading}>
                {loading ? 'Проверка...' : 'Я авторизовался'}
              </button>
              <a
                className="auth-popup__tid-link"
                href={tidUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Открыть окно авторизации повторно
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AuthPopup
