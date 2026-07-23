// Бэкенд не хранит признак "адрес по умолчанию" — храним выбор локально
const DEFAULT_ADDRESS_KEY = 'default_address_id'

export function getDefaultAddressId() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(DEFAULT_ADDRESS_KEY)
}

export function setDefaultAddressId(id) {
  if (typeof window === 'undefined') return
  if (id) localStorage.setItem(DEFAULT_ADDRESS_KEY, String(id))
  else localStorage.removeItem(DEFAULT_ADDRESS_KEY)
}
