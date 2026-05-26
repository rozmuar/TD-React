import { Helmet } from 'react-helmet-async'
import AddressManager from '../../components/AddressManager/AddressManager'

export default function PersonalAddresses() {
  return (
    <>
      <Helmet>
        <title>Мои адреса - TopDisk</title>
        <meta name="description" content="Управление адресами доставки" />
      </Helmet>

      <div className="personal-section">
        <h1 className="personal-section__title">Мои адреса</h1>
        <p className="personal-section__subtitle">
          Управляйте адресами доставки для быстрого оформления заказов
        </p>
        
        <AddressManager />
      </div>
    </>
  )
}
