// Профиль адреса приходит с бэкенда как properties: [{id, code, name, value}]
// (свойства заказа Bitrix, привязанные к person_type_id), а не плоские
// city/street/house — достаём значение по коду свойства
export function getPropValue(properties, ...codes) {
  if (!Array.isArray(properties)) return ''
  const upperCodes = codes.map((c) => c.toUpperCase())
  const prop = properties.find((p) => upperCodes.includes((p.code || '').toUpperCase()))
  return prop?.value || ''
}
