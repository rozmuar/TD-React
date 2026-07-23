import { Helmet } from 'react-helmet-async'
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback'

const UPLOAD_BASE = 'https://topdisc.ru'

const DEVICES = [
  { icon: '/upload/iblock/e88/1m05nr0ya7v59lcr1zu5cjlrlfell8z5.png', label: 'Техника Apple' },
  { icon: '/upload/iblock/ddc/d63qf5y2ypxc7a1hwxz1jyd5rtt8hoj5.png', label: 'Смартфоны' },
  { icon: '/upload/iblock/320/wrri4n2gswypdn1k6ide00sqw0lssidd.png', label: 'Планшеты' },
  { icon: '/upload/iblock/415/1g5yb4bb82cuj0qz5ckh0zvtpyg7lwk0.png', label: 'Роботы-пылесосы' },
  { icon: '/upload/iblock/0fb/yws4vmmbyuc50lwxx8kl0dfjmjp4r4wc.png', label: 'Игровые консоли PS4, PS5, X-BOX' },
  { icon: '/upload/iblock/4f1/oyc32iag6wxyfq2ma1eu8z882uia1hhx.png', label: 'Телевизоры' },
  { icon: '/upload/iblock/592/szp3i1qslwzcje7qkkspo98fh2usuvaw.png', label: 'Портативные колонки' },
  { icon: '/upload/iblock/2ea/3j07ohnsmq91kvu54gbzptk1w340imox.png', label: 'Геймпады' },
  { icon: '/upload/iblock/556/k56zagf765acxi9dp2r8656ihkiu4hp6.png', label: 'Ноутбуки' },
  { icon: '/upload/iblock/a7d/p76899kg4l62b25hen8lqueihgrdnbw9.png', label: 'Электросамокаты' },
]

const ADVANTAGES = [
  { icon: '/upload/medialibrary/082/0ocjxsow5f0ir3rmp7hzb3gnree28bu7.png', label: 'Бесплатная диагностика' },
  { icon: '/upload/medialibrary/3cb/a8qcm88d8w1s8eiorde1hc2zxm54dn20.png', label: 'Гарантия на ремонт 30 дней' },
  { icon: '/upload/medialibrary/da8/g1u9vn0eld7nl3802vs1ucbh4ckpyxdk.png', label: 'Курьерская доставка' },
]

function PlatnyyRemont() {
  return (
    <>
      <Helmet>
        <title>Платный ремонт электроники и бытовой техники в Пензе — Top Disc</title>
      </Helmet>
      <h1 className="info-page__title">Платный ремонт</h1>

      <div className="repair-page">
        <div className="repair-page__hero">
          <ImageWithFallback
            className="repair-page__hero-img"
            src={`${UPLOAD_BASE}/upload/medialibrary/dec/ewa1th82i8zhyanv34t18597nencozig.jpg`}
            alt="Дружелюбный сервис"
          />
          <ImageWithFallback
            className="repair-page__hero-mascot"
            src={`${UPLOAD_BASE}/upload/medialibrary/4d5/qvtv28h150mtdppm4tevmtxb9qg4juzm.png`}
            alt="Маскот ремонтник"
          />
        </div>

        <p className="repair-page__hours">
          С 1 апреля 2026 года режим работы сервисного центра:<br />
          Понедельник – Пятница <b>с 9:00 до 19:00</b><br />
          Суббота – Воскресенье <b>с 9:00 до 16:00</b>
        </p>

        <h2>Ремонт смартфонов и техники в Пензе</h2>
        <p>
          Мы занимаемся ремонтом техники Apple, смартфонов, планшетов, ноутбуков, роботов-пылесосов,
          игровых консолей PS4, PS5, X-BOX. А также ремонтом геймпадов, телевизоров,
          портативных колонок, электросамокатов и многих других девайсов!
        </p>

        <h2>Устройства, которые мы ремонтируем</h2>
        <div className="repair-page__devices">
          {DEVICES.map((d) => (
            <div className="repair-page__device" key={d.label}>
              <ImageWithFallback className="repair-page__device-icon" src={UPLOAD_BASE + d.icon} alt={d.label} />
              <b>{d.label}</b>
            </div>
          ))}
        </div>

        <div className="repair-page__callout">
          <h2>Не нашли своё устройство?</h2>
          <div className="repair-page__callout-grid">
            <div>
              <p>Мы ремонтируем широкий спектр устройств!</p>
              <p>Приносите устройство, и мы сразу проведём бесплатную диагностику!</p>
            </div>
            <div>
              <p>Получите консультацию любым удобным для вас способом:</p>
              <div className="repair-page__socials">
                <a href="https://api.whatsapp.com/send?phone=79674400808" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                  <img src="/local/templates/bitlate_pro/images/whats.svg" alt="WhatsApp" />
                </a>
                <a href="tg://resolve?domain=Topdisc_Bot" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                  <img src="/local/templates/bitlate_pro/images/teleg.svg" alt="Telegram" />
                </a>
                <a href="mailto:shop@topdisc.ru" aria-label="E-mail">
                  <img src="/local/templates/bitlate_pro/images/mail.svg" alt="E-mail" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <h2>А ещё мы предоставляем доп. услуги:</h2>
        <ul className="repair-page__list">
          <li>Установка операционной системы на ПК</li>
          <li>Настройка VR-гарнитуры</li>
          <li>Обновление базы радар-детектора и прошивка</li>
          <li>Установка мобильных банков Apple/Android</li>
          <li>Создание аккаунта PS</li>
          <li>Чистка динамиков смартфона</li>
        </ul>

        <h2>Производя ремонт у нас, мы гарантируем качество и надёжность</h2>

        <div className="repair-page__advantages">
          <h3>Наш сервисный центр</h3>
          <div className="repair-page__advantages-grid">
            {ADVANTAGES.map((a) => (
              <div className="repair-page__advantage" key={a.label}>
                <ImageWithFallback src={UPLOAD_BASE + a.icon} alt={a.label} />
                <span>{a.label}</span>
              </div>
            ))}
          </div>
        </div>

        <ul className="repair-page__list">
          <li><b>Квалифицированные мастера</b> — опытные специалисты с большим стажем работы.</li>
          <li><b>Быстрый ремонт</b> — оперативное устранение поломок.</li>
          <li><b>Гарантия качества</b> — предоставляем гарантию на все виды услуг.</li>
          <li><b>Оригинальные запчасти</b> — используем только проверенные и сертифицированные комплектующие.</li>
          <li><b>Доступные цены</b> — выгодные предложения и прозрачная ценовая политика.</li>
          <li><b>Бесплатная диагностика</b> — точное определение проблемы перед ремонтом.</li>
        </ul>
      </div>
    </>
  )
}

export default PlatnyyRemont
