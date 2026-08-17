import { Helmet } from 'react-helmet-async'
import { useEffect, useRef } from 'react'
import JsonLd from '../../components/JsonLd/JsonLd'
import { breadcrumbSchema, storeSchema } from '../../utils/jsonLd'

const STORES = [
  {
    name: 'TOP DISC Платформа',
    address: 'Ставского 4 (Напротив АЗС Роснефть)',
    hours: 'Ежедневно с 9:00 до 21:00',
    coords: [53.192862, 45.003436],
    note: 'ТОП Сервис — с 1 апреля 2026 года режим работы сервисного центра: Пн–Пт 9:00–19:00, Сб–Вс 9:00–16:00',
  },
  {
    name: 'TOP DISC Смарт',
    address: 'Проспект Победы 124 (Универсам №173 со стороны ТРЦ «Квадрат»)',
    hours: 'Ежедневно с 9:00 до 20:00',
    coords: [53.227478, 44.937608],
  },
  {
    name: 'TOP DISC Смарт Мини',
    address: 'Проспект Строителей 1В (ТЦ «Коллаж», 1 этаж)',
    hours: 'Ежедневно с 10:00 до 22:00',
    coords: [53.220241, 44.951110],
  },
  {
    name: 'TOP DISC Смарт Мини',
    address: 'ул. Мира 60 (ТЦ «Западный», слева от главного входа)',
    hours: 'Ежедневно с 9:00 до 21:00',
    coords: [53.186272, 44.980551],
  },
  {
    name: 'TOP DISC Смарт Мини',
    address: 'ул. Комсомольская 10 (Заречный, ТЦ «Юбилейный»)',
    hours: 'Ежедневно с 9:00 до 21:00',
    coords: [53.193243, 45.174261],
  },
]

function Contacts() {
  const mapRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current || mapRef.current.dataset.loaded) return
    mapRef.current.dataset.loaded = 'true'

    const initMap = () => {
      window.ymaps.ready(() => {
        const map = new window.ymaps.Map(mapRef.current, {
          center: STORES[0].coords,
          zoom: 12,
        })
        STORES.forEach((store) => {
          map.geoObjects.add(new window.ymaps.Placemark(store.coords, {
            balloonContentHeader: store.name,
            balloonContentBody: `${store.address}<br>${store.hours}`,
            hintContent: store.name,
          }))
        })
        map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 40 })
      })
    }

    if (window.ymaps) {
      initMap()
    } else {
      const script = document.createElement('script')
      script.src = 'https://api-maps.yandex.ru/2.1/?apikey=&lang=ru_RU'
      script.onload = initMap
      document.head.appendChild(script)
    }
  }, [])

  return (
    <>
      <Helmet>
        <title>Контакты — Top Disc</title>
        <meta name="description" content="Контакты магазина Top Disc: телефон, адреса всех точек, режим работы." />
      </Helmet>
      <JsonLd data={[
        storeSchema(),
        breadcrumbSchema([
          { name: 'Главная', url: '/' },
          { name: 'Контакты' },
        ]),
      ]} />

      <section className="contacts">
        <h1 className="contacts__title">Контакты</h1>

        <div className="contacts__info-cards">
          <div className="info-card contacts__info-card">
            <div className="info-card__icon">
              <img src="/img/contacts/phone.png" alt="Телефон" />
            </div>
            <div className="info-card__content">
              <span className="info-card__label">Телефон:</span>
              <span><a href="tel:+78005002141">8 (800) 500‑21‑41</a></span>
            </div>
          </div>

          <div className="info-card contacts__info-card">
            <div className="info-card__icon">
              <img src="/img/contacts/pin.png" alt="Адрес" />
            </div>
            <div className="info-card__content">
              <span className="info-card__label">Адрес:</span>
              <span>г. Пенза, ул. Ставского, д. 4.<br />Супермаркет электроники Top Disc</span>
            </div>
          </div>

          <div className="info-card contacts__info-card">
            <div className="info-card__icon">
              <img src="/img/contacts/clock.png" alt="Время работы" />
            </div>
            <div className="info-card__content">
              <p>Ежедневно<br />с 9:00 до 21:00</p>
            </div>
          </div>
        </div>

        <h2 className="contacts__stores-title">Наши розничные точки</h2>
        <div className="contacts__stores">
          {STORES.map((s, i) => (
            <div className="contacts__store" key={i}>
              <strong>{s.name}</strong>
              <span>{s.address}</span>
              <span className="contacts__store-hours">{s.hours}</span>
              {s.note && <span className="contacts__store-note">{s.note}</span>}
            </div>
          ))}
        </div>

        <div ref={mapRef} style={{ width: '100%', height: 400 }} />

        <section className="contacts__about">
          <div className="contacts__about-text">
            <h2 className="contacts__about-title">О компании</h2>
            <p>
              <strong>Top Disc</strong> — онлайн-платформа по продаже техники и электроники,
              образованная в 2007 году.
            </p>
            <p>
              Компания Top Disc заинтересована в поставщиках компьютерных и
              сотовых аксессуаров, автoаксессуаров, портативной электроники и
              сопутствующих товаров. Лояльно относимся к новым брендам, выходящим на
              рынок. Мы с радостью ответим на все вопросы по работе компании, выслушаем
              конструктивную критику или добрые отзывы о нашей работе. Присылайте ваши
              письма по адресу <a href="mailto:info@topdisc.ru">info@topdisc.ru</a>.
            </p>
          </div>
        </section>
      </section>
    </>
  )
}

export default Contacts
