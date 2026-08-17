import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback'

const IMG_BASE = 'https://topdisc.ru/o-nas/img'
const MAP_MAIN = 'https://yandex.ru/maps/49/penza/?ll=45.003509%2C53.192953&mode=poi&poi%5Bpoint%5D=45.003436%2C53.192862&poi%5Buri%5D=ymapsbm1%3A%2F%2Forg%3Foid%3D1123110234&z=20'

const STORES = [
  { name: 'TOP DISC Платформа', address: 'Ставского 4 (Напротив АЗС Роснефть)', map: MAP_MAIN },
  { name: 'TOP DISC Смарт', address: 'Проспект Победы 124 (Универсам №173 со стороны ТРЦ «Квадрат»)', map: 'https://yandex.ru/maps/-/CHd6qVjJ' },
  { name: 'TOP DISC Смарт Мини', address: 'Проспект Строителей 1В (ТЦ «Коллаж», 1 этаж)', map: 'https://yandex.ru/maps/org/kollazh/1801679181/?ll=44.951110%2C53.220241&z=14' },
  { name: 'TOP DISC Смарт Мини', address: 'ул. Мира 60 (ТЦ «Западный», слева от главного входа)', map: 'https://yandex.ru/maps/org/zapadny/243804326412/?ll=44.980551%2C53.186272&z=16' },
]

const PARKING = [
  'Основная парковка — слева от локации «Платформа».',
  'Дополнительная парковка — во внутреннем дворе (въезд справа от центрального входа).',
  'Три входа: центральный (ул. Ставского), без ступенек — со стороны ул. Революционной, и из двора — к парковке.',
]

const CATEGORIES = [
  {
    title: 'Смартфоны и гаджеты',
    text: 'Популярные бренды по выгодным ценам. Топовые новинки и полный комплекс услуг.',
    badges: [
      ['Смартфоны', '/catalog/smartfony/'],
      ['Планшеты', '/catalog/planshety/'],
      ['Компьютеры и ноутбуки', '/catalog/kompyutery_i_noutbuki/'],
      ['Игровые приставки', '/catalog/igrovye_pristavki_i_igry/'],
      ['Повербанки', '/catalog/vneshnie_akb_power_bank_/'],
      ['Портативные колонки', '/catalog/portativnye_kolonki/'],
      ['Смарт-часы', '/catalog/smart_chasy_i_fitnes_braslety/'],
      ['Фитнес-браслеты', '/catalog/fitnes_braslety/'],
      ['Наушники', '/catalog/naushniki_1/'],
    ],
  },
  {
    title: 'Техника для дома',
    text: 'Практичные решения на каждый день: быстро, удобно и по разумной цене.',
    badges: [
      ['Роботы-пылесосы', '/catalog/roboty_pylesosy/'],
      ['Техника для кухни', '/catalog/malaya_bytovaya_tekhnika_dlya_kukhni/'],
      ['Красота и здоровье', '/catalog/krasota_i_zdorove/'],
      ['Телевизоры', '/catalog/televizory/'],
      ['Аксессуары для ТВ', '/catalog/aksessuary_dlya_tv/'],
    ],
  },
  {
    title: 'Товары для дома и отдыха',
    text: 'Большой выбор идей для активного (и не очень) времяпровождения — дарите себе и близким движение и эмоции.',
    badges: [
      ['Электротранспорт', '/catalog/elektrotransport/'],
      ['Велосипеды', '/catalog/velosipedy_1/'],
      ['Для дома и сада', '/catalog/dom_i_sad/'],
      ['Автотовары', '/catalog/avtotovary/'],
    ],
  },
]

function About() {
  return (
    <>
      <Helmet>
        <title>О нас — Супермаркет электроники Top Disc в Пензе</title>
        <meta name="description" content="TOP DISC — супермаркет электроники в Пензе. Огромный выбор техники по низким ценам." />
      </Helmet>

      <div className="about-page">
        <h1 className="info-page__title">О нас</h1>

        <div className="about-page__hero-text">
          <h2>TOP DISC — эксперт по электронике и бытовой технике в Пензе</h2>
          <p className="about-page__lead">
            Мы объединяем лучшие бренды, выгодные решения и клиентский сервис. В наших магазинах
            и онлайн-каталоге — тысячи актуальных моделей: от смарт-устройств до техники для дома.
            Работаем честно, с официальной гарантией и помогаем подобрать то, что подходит именно вам.
          </p>
          <div className="about-page__actions">
            <Link className="ps-btn" to="/catalog/">Смотреть каталог</Link>
            <a className="btn--outline-accent" href={MAP_MAIN} target="_blank" rel="noopener noreferrer">Проложить маршрут</a>
          </div>
        </div>

        <ImageWithFallback className="about-page__hero-img" src={`${IMG_BASE}/top.jpg`} alt="TOP DISC" />

        <div className="about-page__grid">
          <div className="about-page__card">
            <h2>Наши розничные точки</h2>
            <ul className="about-page__stores">
              {STORES.map((s, i) => (
                <li key={i}>
                  <strong>{s.name}</strong> — {s.address}.
                  <div><a href={s.map} target="_blank" rel="noopener noreferrer">Открыть на карте</a></div>
                </li>
              ))}
            </ul>
          </div>
          <div className="about-page__card">
            <h2>Парковка и входы главного супермаркета (Платформа)</h2>
            <ul className="about-page__checklist">
              {PARKING.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
        </div>

        <div className="about-page__photo-grid">
          <ImageWithFallback src={`${IMG_BASE}/kbt.jpg`} alt="Бытовая техника в зале" />
          <ImageWithFallback src={`${IMG_BASE}/phone.jpg`} alt="Смартфоны в зале" />
        </div>

        <div className="ps-divider" />

        <div className="about-page__categories">
          {CATEGORIES.map((cat) => (
            <div className="about-page__category" key={cat.title}>
              <h2>{cat.title}</h2>
              <p>{cat.text}</p>
              <div className="about-page__badges">
                {cat.badges.map(([label, url]) => (
                  <Link className="about-page__badge" to={url} key={label}>{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="ps-divider" />

        <ImageWithFallback className="about-page__gallery-img" src={`${IMG_BASE}/navigation.jpg`} alt="Навигация по залу" />

        <div className="about-page__footer">
          <Link to="/catalog/">Каталог</Link>
          <span aria-hidden="true">·</span>
          <Link to="/contacts/">Контакты</Link>
          <span aria-hidden="true">·</span>
          <a href={MAP_MAIN} target="_blank" rel="noopener noreferrer">Маршрут</a>
        </div>
      </div>
    </>
  )
}

export default About
