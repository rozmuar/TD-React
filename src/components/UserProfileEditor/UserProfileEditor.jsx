import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchUserProfile,
  updateProfile,
  updatePassword,
  clearError,
} from '../../store/slices/authSlice'
import './UserProfileEditor.css'

export default function UserProfileEditor() {
  const dispatch = useDispatch()
  const { user, loading, error, isAuthenticated } = useSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'password'
  const [profileData, setProfileData] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    photo: null,
    photoDelete: false,
  })
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [previewPhoto, setPreviewPhoto] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(fetchUserProfile())
    }
  }, [dispatch, isAuthenticated, user])

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        gender: user.gender || '',
        photo: null,
        photoDelete: false,
      })
      setPreviewPhoto(user.photo || null)
    }
  }, [user])

  useEffect(() => {
    if (error) {
      setTimeout(() => dispatch(clearError()), 5000)
    }
  }, [error, dispatch])

  useEffect(() => {
    if (successMessage) {
      setTimeout(() => setSuccessMessage(''), 3000)
    }
  }, [successMessage])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5 МБ')
        return
      }
      setProfileData((prev) => ({ ...prev, photo: file, photoDelete: false }))
      setPreviewPhoto(URL.createObjectURL(file))
    }
  }

  const handleDeletePhoto = () => {
    setProfileData((prev) => ({ ...prev, photo: null, photoDelete: true }))
    setPreviewPhoto(null)
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    try {
      const formData = {
        name: profileData.name,
        last_name: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        gender: profileData.gender,
      }
      
      if (profileData.photo) {
        formData.photo = profileData.photo
      } else if (profileData.photoDelete) {
        formData.photo_delete = 'Y'
      }

      await dispatch(updateProfile(formData)).unwrap()
      setSuccessMessage('Профиль успешно обновлён')
      dispatch(fetchUserProfile())
    } catch (err) {
      console.error('Profile update error:', err)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Новый пароль и подтверждение не совпадают')
      return
    }
    if (passwordData.newPassword.length < 6) {
      alert('Пароль должен содержать минимум 6 символов')
      return
    }

    try {
      await dispatch(updatePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      })).unwrap()
      setSuccessMessage('Пароль успешно изменён')
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err) {
      console.error('Password change error:', err)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="profile-editor">
        <p>Пожалуйста, авторизуйтесь для редактирования профиля</p>
      </div>
    )
  }

  return (
    <div className="profile-editor">
      <h2 className="profile-editor__title">Мой профиль</h2>

      <div className="profile-editor__tabs">
        <button
          className={`profile-tab ${activeTab === 'profile' ? 'profile-tab--active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Личные данные
        </button>
        <button
          className={`profile-tab ${activeTab === 'password' ? 'profile-tab--active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          Сменить пароль
        </button>
      </div>

      {successMessage && (
        <div className="profile-editor__success">{successMessage}</div>
      )}
      {error && (
        <div className="profile-editor__error">{error}</div>
      )}

      {activeTab === 'profile' && (
        <form className="profile-form" onSubmit={handleProfileSubmit}>
          <div className="profile-form__photo-section">
            <div className="profile-photo">
              {previewPhoto ? (
                <img src={previewPhoto} alt="Фото профиля" className="profile-photo__img" />
              ) : (
                <div className="profile-photo__placeholder">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="#ccc">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="profile-photo__actions">
              <label className="btn btn-sm btn-outline">
                Загрузить фото
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
              </label>
              {previewPhoto && (
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={handleDeletePhoto}
                >
                  Удалить
                </button>
              )}
            </div>
          </div>

          <div className="profile-form__grid">
            <div className="form-group">
              <label>Имя</label>
              <input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                placeholder="Иван"
              />
            </div>
            <div className="form-group">
              <label>Фамилия</label>
              <input
                type="text"
                name="lastName"
                value={profileData.lastName}
                onChange={handleProfileChange}
                placeholder="Иванов"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                placeholder="example@mail.com"
              />
            </div>
            <div className="form-group">
              <label>Телефон</label>
              <input
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleProfileChange}
                placeholder="+7 (999) 123-45-67"
              />
            </div>
            <div className="form-group">
              <label>Пол</label>
              <select
                name="gender"
                value={profileData.gender}
                onChange={handleProfileChange}
              >
                <option value="">Не указан</option>
                <option value="M">Мужской</option>
                <option value="F">Женский</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </form>
      )}

      {activeTab === 'password' && (
        <form className="password-form" onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label>Старый пароль</label>
            <input
              type="password"
              name="oldPassword"
              value={passwordData.oldPassword}
              onChange={handlePasswordChange}
              placeholder="Введите старый пароль"
              required
            />
          </div>
          <div className="form-group">
            <label>Новый пароль</label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              placeholder="Минимум 6 символов"
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Подтвердите новый пароль</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Повторите новый пароль"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Сохранение...' : 'Изменить пароль'}
          </button>
        </form>
      )}
    </div>
  )
}
