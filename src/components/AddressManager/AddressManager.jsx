import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchUserAddresses,
  createAddress,
  editAddress,
  removeAddress,
  clearError,
} from '../../store/slices/userSlice'
import './AddressManager.css'

export default function AddressManager() {
  const dispatch = useDispatch()
  const { addresses, loading, error } = useSelector((state) => state.user)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    city: '',
    street: '',
    house: '',
    apartment: '',
    zip: '',
  })

  useEffect(() => {
    dispatch(fetchUserAddresses())
  }, [dispatch])

  useEffect(() => {
    if (error) {
      alert(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.city || !formData.street || !formData.house) {
      alert('Заполните обязательные поля: город, улица, дом')
      return
    }

    if (editingId) {
      dispatch(editAddress({ id: editingId, data: formData }))
        .unwrap()
        .then(() => {
          resetForm()
        })
        .catch(() => {})
    } else {
      dispatch(createAddress(formData))
        .unwrap()
        .then(() => {
          resetForm()
        })
        .catch(() => {})
    }
  }

  const handleEdit = (address) => {
    setEditingId(address.id)
    setFormData({
      city: address.city || '',
      street: address.street || '',
      house: address.house || '',
      apartment: address.apartment || '',
      zip: address.zip || '',
    })
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (confirm('Удалить этот адрес?')) {
      dispatch(removeAddress(id))
    }
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

      {showForm && (
        <form className="address-form" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Редактировать адрес' : 'Новый адрес'}</h3>
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
                required
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
                required
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
                required
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
          <div className="address-form__actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
              disabled={loading}
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
            addresses.map((address) => (
              <div key={address.id} className="address-card">
                <div className="address-card__content">
                  <div className="address-card__city">{address.city}</div>
                  <div className="address-card__details">
                    {address.street}, д. {address.house}
                    {address.apartment && `, кв. ${address.apartment}`}
                  </div>
                  {address.zip && (
                    <div className="address-card__zip">Индекс: {address.zip}</div>
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
            ))
          )}
        </div>
      )}
    </div>
  )
}
