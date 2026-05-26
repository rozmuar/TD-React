import { useEffect, useState } from 'react'
import { getUserProfile, updateUserProfile } from '../../services/apiClient'

function PersonalInfo() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Поля формы профиля
  const [form, setForm] = useState({ name: '', last_name: '', email: '', phone: '' })



  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await getUserProfile()
        if (cancelled) return
        const data = res.data?.message || res.data
        setProfile(data)
        setForm({
          name: data?.name || data?.NAME || '',
          last_name: data?.last_name || data?.LAST_NAME || '',
          email: data?.email || data?.EMAIL || '',
          phone: data?.phone || data?.PERSONAL_PHONE || '',
        })
      } catch {
        if (!cancelled) setError('Не удалось загрузить данные профиля')
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await updateUserProfile(form)
      setMessage('Данные сохранены')
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }



  if (loading) return <div className="personal__loading">Загрузка...</div>

  return (
    <div className="personal-info">
      <h2 className="personal__section-title">Личная информация</h2>

      <form className="personal-info__form" onSubmit={handleSave}>
        <div className="personal-info__row">
          <label className="personal-info__label">
            Имя
            <input className="personal-info__input" name="name" value={form.name} onChange={handleChange} />
          </label>
          <label className="personal-info__label">
            Фамилия
            <input className="personal-info__input" name="last_name" value={form.last_name} onChange={handleChange} />
          </label>
        </div>
        <div className="personal-info__row">
          <label className="personal-info__label">
            Email
            <input className="personal-info__input" name="email" type="email" value={form.email} onChange={handleChange} />
          </label>
          <label className="personal-info__label">
            Телефон
            <input className="personal-info__input" name="phone" type="tel" value={form.phone} onChange={handleChange} />
          </label>
        </div>
        {message && <p className="personal-info__success">{message}</p>}
        {error && <p className="personal-info__error">{error}</p>}
        <button className="personal-info__save" type="submit" disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>


    </div>
  )
}

export default PersonalInfo
