import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchStores, setPickupPoint } from '../../store/slices/checkoutSlice'
import './PickupPointSelector.css'

export default function PickupPointSelector() {
  const dispatch = useDispatch()
  const { 
    selectedDelivery,
    pickupPoints, 
    selectedPickupPoint, 
    stores,
    loading 
  } = useSelector((state) => state.checkout)

  useEffect(() => {
    // Загружаем склады, если они пусты
    if (stores.length === 0) {
      dispatch(fetchStores())
    }
  }, [dispatch, stores.length])

  // Определяем, является ли выбранная доставка самовывозом
  const isPickupDelivery = selectedDelivery && (
    selectedDelivery.is_pickup || 
    selectedDelivery.code?.includes('PICKUP') ||
    selectedDelivery.name?.toLowerCase().includes('самовывоз')
  )

  if (!isPickupDelivery) {
    return null
  }

  // Используем либо pickupPoints из calculate, либо stores
  const availablePoints = pickupPoints.length > 0 ? pickupPoints : stores

  if (availablePoints.length === 0 && !loading) {
    return (
      <div className="pickup-selector">
        <p className="pickup-selector__empty">
          Нет доступных пунктов самовывоза
        </p>
      </div>
    )
  }

  const handleSelectPoint = (pointId) => {
    dispatch(setPickupPoint(pointId))
  }

  return (
    <div className="pickup-selector">
      <h3 className="pickup-selector__title">Выберите пункт выдачи</h3>
      
      {loading ? (
        <div className="pickup-selector__loading">Загрузка пунктов выдачи...</div>
      ) : (
        <div className="pickup-points">
          {availablePoints.map((point) => {
            const pointId = point.id || point.ID || point.store_id
            const isSelected = selectedPickupPoint === pointId
            
            return (
              <div
                key={pointId}
                className={`pickup-point ${isSelected ? 'pickup-point--selected' : ''}`}
                onClick={() => handleSelectPoint(pointId)}
              >
                <div className="pickup-point__radio">
                  <input
                    type="radio"
                    name="pickup_point"
                    checked={isSelected}
                    onChange={() => handleSelectPoint(pointId)}
                  />
                </div>
                <div className="pickup-point__content">
                  <div className="pickup-point__name">
                    {point.name || point.TITLE || point.title || `Пункт ${pointId}`}
                  </div>
                  {point.address || point.ADDRESS && (
                    <div className="pickup-point__address">
                      📍 {point.address || point.ADDRESS}
                    </div>
                  )}
                  {point.schedule || point.SCHEDULE && (
                    <div className="pickup-point__schedule">
                      🕐 {point.schedule || point.SCHEDULE}
                    </div>
                  )}
                  {point.phone || point.PHONE && (
                    <div className="pickup-point__phone">
                      📞 {point.phone || point.PHONE}
                    </div>
                  )}
                  {point.description || point.DESCRIPTION && (
                    <div className="pickup-point__description">
                      {point.description || point.DESCRIPTION}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
