import { Helmet } from 'react-helmet-async'
import { useEffect, useRef } from 'react'

function Contacts() {
  const mapRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current || mapRef.current.dataset.loaded) return
    mapRef.current.dataset.loaded = 'true'

    const checkYmaps = () => {
      if (window.ymaps) {
        window.ymaps.ready(() => {
          const map = new window.ymaps.Map(mapRef.current, {
            center: [53.195041, 45.018434],
            zoom: 16,
          })
          map.geoObjects.add(new window.ymaps.Placemark([53.195041, 45.018434], {
            balloonContent: 'TOP DISC — г. Пенза, ул. Ставского, д. 4',
          }))
        })
      }
    }

    if (window.ymaps) {
      checkYmaps()
    } else {
      const script = document.createElement('script')
      script.src = 'https://api-maps.yandex.ru/2.1/?apikey=&lang=ru_RU'
      script.onload = checkYmaps
      document.head.appendChild(script)
    }
  }, [])

  return (
    <>
      <Helmet>
        <title>Контакты — Top Disc</title>
        <meta name="description" content="Контакты магазина Top Disc: телефон, адрес, режим работы." />
      </Helmet>

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

        <div ref={mapRef} style={{ width: '100%', height: 400 }} />

        <section className="contacts__about">
          <div className="contacts__about-text">
            <h2 className="contacts__about-title">О компании</h2>
            <p>
              <strong>Top Disc</strong> – оптово‑розничный супермаркет электроники,
              образованный в 2007 году, расположенный по адресу: г. Пенза, ул.
              Ставского, 4.
            </p>
            <p>
              Компания Top Disc заинтересована в поставщиках компьютерных и
              сотовых аксессуаров, автoаксессуаров, портативной электроники и
              сопутствующих товаров. Лояльно относимся к новым брендам, выходящим на
              рынок. Мы с радостью ответим на все вопросы по работе компании, выслушаем
              конструктивную критику или добрые отзывы о нашей работе.
            </p>
          </div>
        </section>
      </section>
    </>
  )
}

export default Contacts
