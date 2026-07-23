import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchUserAddresses,
  createAddress,
  editAddress,
  removeAddress,
  clearError,
} from '../../store/slices/userSlice'
import { getLocationCode } from '../../services/apiClient'
import { getPropValue } from '../../utils/addressProperties'
import { getDefaultAddressId, setDefaultAddressId } from '../../utils/defaultAddress'
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog'
import './AddressManager.css'

// person_type_id=5 — «Физическое лицо», единственный тип плательщика,
// который реально используется на этом сайте (см. checkout)
const PERSON_TYPE_ID = 5

// DaData API для подсказок адресов
const DADATA_TOKEN = import.meta.env.VITE_DADATA_TOKEN
const DADATA_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'

// Лучшая попытка разложить сохранённую строку адреса обратно по полям формы.
// Надёжно это сделать нельзя (адрес хранится одной строкой без разметки),
// но для адресов, собранных этой же формой ("Город, Улица, д. X, кв. Y"),
// разбор получается точным
function parseAddressLine(addressLine) {
  const empty = { city: '', street: '', house: '', apartment: '' }
  if (!addressLine) return empty

  const parts = addressLine.split(',').map((s) => s.trim()).filter(Boolean)
  let house = ''
  let apartment = ''
  const rest = []

  parts.forEach((part) => {
    const houseMatch = !house && part.match(/^д(?:ом)?\.?\s*(.+)/i)
    const aptMatch = !apartment && part.match(/^(?:кв(?:артира)?|апарт(?:амент)?)\.?\s*(.+)/i)
    if (houseMatch) {
      house = houseMatch[1].trim()
    } else if (aptMatch) {
      apartment = aptMatch[1].trim()
    } else {
      rest.push(part)
    }
  })

  return {
    city: rest.shift() || '',
    street: rest.join(', '),
    house,
    apartment,
  }
}

async function suggestAddress(query) {
  if (!query || query.length < 3) return []
  try {
    const res = await fetch(DADATA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Token ' + DADATA_TOKEN,
      },
      body: JSON.stringify({
        query,
        count: 5,
        locations: [{ country: '*' }],
      }),
    })
    const json = await res.json()
    return json.suggestions || []
  } catch (err) {
    console.error('DaData error:', err)
    return []
  }
}

export default function AddressManager() {
  const dispatch = useDispatch()
  const { addresses, loading, error } = useSelector((state) => state.user)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formError, setFormError] = useState('')
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [defaultId, setDefaultId] = useState(() => getDefaultAddressId())
  const [formData, setFormData] = useState({
    city: '',
    street: '',
    house: '',
    apartment: '',
    zip: '',
  })

  // DaData подсказки
  const [addressQuery, setAddressQuery] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const addressTimeoutRef = useRef(null)
  const suggestionsRef = useRef(null)

  useEffect(() => {
    dispatch(fetchUserAddresses())
  }, [dispatch])


  // Закрытие подсказок при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Поиск адресов через DaData с debounce
  useEffect(() => {
    if (addressTimeoutRef.current) {
      clearTimeout(addressTimeoutRef.current)
    }

    if (addressQuery.length >= 3) {
      addressTimeoutRef.current = setTimeout(async () => {
        const suggestions = await suggestAddress(addressQuery)
        setAddressSuggestions(suggestions)
        setShowSuggestions(suggestions.length > 0)
      }, 300)
    } else {
      setAddressSuggestions([])
      setShowSuggestions(false)
    }

    return () => {
      if (addressTimeoutRef.current) {
        clearTimeout(addressTimeoutRef.current)
      }
    }
  }, [addressQuery])

  const handleAddressQueryChange = (e) => {
    setAddressQuery(e.target.value)
  }

  const handleSelectSuggestion = (suggestion) => {
    const data = suggestion.data
    setFormData({
      city: data.city || data.settlement || '',
      street: data.street || '',
      house: data.house || '',
      apartment: '',
      zip: data.postal_code || '',
    })
    setAddressQuery(suggestion.value)
    setShowSuggestions(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const addressLine = [
      formData.city,
      formData.street,
      formData.house && `д. ${formData.house}`,
      formData.apartment && `кв. ${formData.apartment}`,
    ].filter(Boolean).join(', ')

    // Бэкенд хранит адрес одной строкой (ADDRESS), поэтому при редактировании
    // старой записи разложить обратно на city/street/house гарантированно
    // нельзя — проверяем только итоговую строку, а не каждое поле по отдельности
    if (!addressLine.trim()) {
      setFormError('Укажите адрес')
      return
    }

    setSubmitting(true)

    // Бэкенд (/user/addresses) хранит адрес как профиль свойств заказа
    // Bitrix — не плоские city/street/house, а {name, person_type_id,
    // properties: {ADDRESS, LOCATION}}. LOCATION — код города, как в чекауте
    let locationCode = ''
    try {
      const locRes = await getLocationCode(formData.city || formData.street)
      locationCode = locRes.data?.data?.location_code || ''
    } catch {}

    const payload = {
      name: addressLine || 'Адрес',
      person_type_id: PERSON_TYPE_ID,
      properties: {
        ADDRESS: addressLine,
        ...(locationCode ? { LOCATION: locationCode } : {}),
      },
    }

    const action = editingId
      ? editAddress({ id: editingId, data: payload })
      : createAddress(payload)

    dispatch(action)
      .unwrap()
      .then(() => {
        // Ответ add/update содержит только {id, message} без properties —
        // локально мержить нечего, перезапрашиваем список целиком с сервера
        dispatch(fetchUserAddresses())
        resetForm()
      })
      .catch(() => {})
      .finally(() => setSubmitting(false))
  }

  const handleEdit = (address) => {
    const addressLine = getPropValue(address.properties, 'ADDRESS')
    const parsed = parseAddressLine(addressLine)
    setEditingId(address.id)
    setFormData({
      city: parsed.city,
      street: parsed.street,
      house: parsed.house,
      apartment: parsed.apartment,
      zip: '',
    })
    setShowForm(true)
  }

  const handleDelete = (id) => {
    setDeleteTargetId(id)
  }

  const confirmDelete = () => {
    dispatch(removeAddress(deleteTargetId))
    if (String(defaultId) === String(deleteTargetId)) {
      setDefaultAddressId(null)
      setDefaultId(null)
    }
    setDeleteTargetId(null)
  }

  const handleSetDefault = (id) => {
    setDefaultAddressId(id)
    setDefaultId(id)
  }

  const resetForm = () => {
    setFormData({
      city: '',
      street: '',
      house: '',
      apartment: '',
      zip: '',
    })
    setEditingId(null)
    setFormError('')
    setShowForm(false)
  }

  return (
    <div className="address-manager">
      <div className="address-manager__header">
        <h2>Мои адреса</h2>
        {!showForm && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            + Добавить адрес
          </button>
        )}
      </div>

      {error && (
        <div className="address-manager__error">
          <span>{error}</span>
          <button type="button" onClick={() => dispatch(clearError())} aria-label="Закрыть">&times;</button>
        </div>
      )}

      {showForm && (
        <form className="address-form" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Редактировать адрес' : 'Новый адрес'}</h3>
          
          {/* Поле поиска с DaData подсказками */}
          <div className="form-group form-group--full address-search" ref={suggestionsRef}>
            <label>Поиск адреса</label>
            <input
              type="text"
              value={addressQuery}
              onChange={handleAddressQueryChange}
              placeholder="Начните вводить адрес..."
              className="address-search__input"
            />
            {showSuggestions && addressSuggestions.length > 0 && (
              <div className="address-suggestions">
                {addressSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="address-suggestion"
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    {suggestion.value}
                  </div>
                ))}
              </div>
            )}
            <small className="form-hint">
              Введите адрес для автозаполнения полей ниже
            </small>
          </div>

          <div className="address-form__grid">
            <div className="form-group">
              <label>
                Город <span className="required">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Москва"
              />
            </div>
            <div className="form-group">
              <label>Индекс</label>
              <input
                type="text"
                name="zip"
                value={formData.zip}
                onChange={handleInputChange}
                placeholder="101000"
              />
            </div>
            <div className="form-group form-group--full">
              <label>
                Улица <span className="required">*</span>
              </label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                placeholder="ул. Пример"
              />
            </div>
            <div className="form-group">
              <label>
                Дом <span className="required">*</span>
              </label>
              <input
                type="text"
                name="house"
                value={formData.house}
                onChange={handleInputChange}
                placeholder="1"
              />
            </div>
            <div className="form-group">
              <label>Квартира</label>
              <input
                type="text"
                name="apartment"
                value={formData.apartment}
                onChange={handleInputChange}
                placeholder="42"
              />
            </div>
          </div>
          {formError && <p className="address-form__error">{formError}</p>}
          <div className="address-form__actions">
            <button type="submit" className="btn btn-primary" disabled={loading || submitting}>
              {loading || submitting ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
              disabled={loading || submitting}
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {loading && addresses.length === 0 ? (
        <div className="address-manager__loading">Загрузка...</div>
      ) : (
        <div className="address-list">
          {addresses.length === 0 ? (
            <div className="address-list__empty">
              У вас пока нет сохранённых адресов
            </div>
          ) : (
            addresses.map((address) => {
              const addressLine = getPropValue(address.properties, 'ADDRESS')
              const phone = getPropValue(address.properties, 'PHONE', 'Phone')
              const isDefault = defaultId !== null && String(defaultId) === String(address.id)
              return (
              <div key={address.id} className={`address-card${isDefault ? ' address-card--default' : ''}`}>
                <div className="address-card__content">
                  <div className="address-card__city">
                    {address.name}
                    {isDefault && <span className="address-card__default-badge">По умолчанию</span>}
                  </div>
                  <div className="address-card__details">{addressLine || '—'}</div>
                  {phone && (
                    <div className="address-card__zip">Телефон: {phone}</div>
                  )}
                  {!isDefault && (
                    <button
                      type="button"
                      className="address-card__default-btn"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      Сделать основным
                    </button>
                  )}
                </div>
                <div className="address-card__actions">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleEdit(address)}
                    disabled={loading}
                  >
                    Изменить
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(address.id)}
                    disabled={loading}
                  >
                    Удалить
                  </button>
                </div>
              </div>
              )
            })
          )}
        </div>
      )}

      {deleteTargetId !== null && (
        <ConfirmDialog
          title="Удалить адрес?"
          message="Это действие нельзя отменить."
          confirmLabel="Удалить"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  )
}
