import { Helmet } from 'react-helmet-async'

function Delivery() {
  return (
    <>
      <Helmet>
        <title>Доставка — Top Disc</title>
        <meta name="description" content="Доставка товаров Top Disc: самовывоз, доставка по Пензе и в регионы." />
      </Helmet>

      <h1>Доставка Top Disc</h1>

      <section className="pickup">
        <h2>Самовывоз</h2>
        <p>Забрать заказ можно через 15 минут после его оформления на сайте, в рабочее время.</p>
        <div className="pickup__map">
          <iframe
            src="https://yandex.ru/map-widget/v1/?um=constructor%3Ac93884cf59e976738da5f3c4be4cc7411e578827b3014ae7787ce0351a9f8c1b&source=constructor"
            width="100%" height="240" frameBorder="0" title="Карта самовывоза"
          />
        </div>
      </section>

      <section className="delivery-options">
        <aside className="city-delivery">
          <div className="city-delivery__header">
            <h3 className="city-delivery__title">Доставка по Пензе</h3>
            <img src="/img/delivery/1.png" alt="Грузовик Top Disc" />
          </div>

          <details className="accordion">
            <summary>Доставим за 2 часа!</summary>
          </details>

          <details className="accordion">
            <summary>Грузовая доставка по Пензе</summary>
          </details>

          <details className="accordion">
            <summary>Юридическая информация</summary>
          </details>
        </aside>

        <div className="region-delivery">
          <h3>Доставка в регионы</h3>
          <p>
            Отправка товара в другие регионы производится на 1‑2 день с момента зачисления денег
            на наш счёт. При оформлении заказа доступны несколько способов доставки. В регионы возможна
            доставка по всей России транспортными компаниями «СДЭК», «ПЭК», «Boxberry» или курьерской
            службой.
            Способ доставки необходимо выбрать при оформлении заказа. После оформления наши менеджеры
            свяжутся с вами по телефону для уточнения деталей.
          </p>
          <div className="region-delivery__logos">
            <img src="/img/delivery/sdek.png" alt="СДЭК" />
          </div>
          <p className="region-delivery__note"><strong>*</strong>Сумма доставки будет известна при оформлении заказа</p>
        </div>
      </section>
    </>
  )
}

export default Delivery
