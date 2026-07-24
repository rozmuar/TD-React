import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback'
import CallbackModal from '../../components/CallbackModal/CallbackModal'

const IMG_BASE = 'https://topdisc.ru/personal-service/img'

const BENEFITS = [
  { icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />, extra: <path d="M9 12l2 2 4-4" />, title: 'Бесплатная консультация', text: 'Экспертно. Без обязательств.' },
  { icon: <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />, title: 'Работаем с вашим дизайнером', text: 'Или подключим своего.' },
  { icon: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />, title: 'Эксклюзив под заказ', text: 'То, чего нет в сетях.' },
  { icon: <path d="M1 4h22v16H1z" />, title: 'Любая форма оплаты', text: 'Нал, безнал, рассрочка, юрлица.' },
  { icon: <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />, title: 'Индивидуальный подбор цены', text: 'Под ваш проект и бюджет.' },
  { icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />, title: 'Доставка и хранение', text: 'Привезём, подождём, установим.' },
  { icon: <path d="M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />, title: 'Персональный менеджер', text: 'Один контакт — от подбора до сдачи.' },
  { icon: <path d="M12 8a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12" />, title: '20 лет опыта', text: 'Решаем сложные задачи.' },
]

const PAINS = [
  'Техника не вписана в интерьер?',
  'Не уверены, какие бренды выбрать?',
  'Хочется всё сразу — и красиво, и надёжно?',
]

const STEPS = [
  { title: 'Консультация', text: 'Выясняем ваши потребности и бюджет' },
  { title: 'Подбор техники', text: 'Подбираем под ваш интерьер' },
  { title: 'Работа с дизайнером', text: 'Согласовываем с вашим специалистом, в случае вашего сотрудничества' },
  { title: 'Доставка и хранение', text: 'Привезём в удобное время' },
  { title: 'Установка и настройка', text: 'Запустим всё под ключ' },
]

const KITS = [
  {
    title: 'Smart Comfort Kitchen',
    text: 'Техника с интеллектуальными функциями для комфортной кухни',
    items: [
      ['Варочная панель Asko HI2641FBG1', 'с функцией объединения конфорок с правой стороны'],
      ['Посудомоечная машина Smeg ST4523IN', 'на 10 комплектов'],
      ['Вытяжка Elica LANE SENSOR BL MAT/A/52', 'датчик загрязнённости и влажности воздуха, автоматический запуск'],
      ['Винный шкаф Maunfeld MFWC-85D28', 'на 28 бутылок'],
    ],
  },
  {
    title: 'Smart Steam Kitchen',
    text: 'Умная кухня с паром и встроенными решениями',
    items: [
      ['Холодильник Liebherr ICNSE 5103', 'No Frost в морозильной камере'],
      ['Встраиваемая СВЧ Electrolux LMS2203EMK', 'мощно и компактно'],
      ['Духовой шкаф Electrolux EOD6P77WZ', 'программы готовки на пару'],
    ],
  },
  {
    title: 'Steam Care Laundry',
    text: 'Профессиональный уход за одеждой у вас дома',
    items: [
      ['Стиральная машина Asko W4086C.T/3', 'паровое освежение и бережная стирка'],
      ['Сушильная машина Asko T608HX.S', 'сушка с парогенератором без пересушивания'],
    ],
  },
]

const TESTIMONIALS = [
  {
    name: 'Евгений Якимов',
    role: 'г. Пенза · Операционный директор Blackroom (создание домашних кинозалов в ОАЭ)',
    text: '«Вчера родители приходили в Top Disc, чтобы настроить новый телефон и перенести данные со старого. Вечером они поделились впечатлениями — об отношении, внимании и уровне сервиса. Отдельное Спасибо просили передать Кириллу. Они были в восторге, насколько человек сделал всё хорошо и с уважением. В общем, Спасибо большое, Паша! 🤝»',
  },
  {
    name: 'Денис',
    role: 'г. Пенза',
    text: '«Кирилл, доброе утро! Спасибо за подробную информацию. Это лучший подход к работе, который мне встречался. Наш выбор V15. Только давайте ещё определимся со стационарным, он нам нужен в первую очередь, так как он сломался, а вертикальный пока ещё дышит 🙂. Возможно разделю покупку на приоритеты.»',
  },
  {
    name: 'Клиент',
    role: 'г. Пенза и ПФО',
    text: '«Быстро, чётко, с доставкой и складами. Рекомендую.»',
  },
]

const TEAM = [
  {
    name: 'Кирилл Кушнир',
    photo: null,
    position: 'Менеджер отдела персонального и корпоративного обслуживания',
    exp: [
      'Профессионально работает с аудиотехникой с 2011 года.',
      'Смартфоны, ноутбуки, компьютеры — с 2017 года.',
      'Бытовая техника — с 2019 года.',
    ],
    quote: '«Технику я уже изучил, поэтому перед продажей мне нужно изучить вас»',
    tg: 'https://t.me/+79300360337',
    phone: '+79300360337',
    phoneLabel: '8 930 036 03 37',
  },
  {
    name: 'Илья Алексеев',
    photo: `${IMG_BASE}/ilya_alekseev.png`,
    position: 'Менеджер отдела персонального и корпоративного обслуживания',
    tg: 'https://t.me/+79300365640',
    phone: '+79300365640',
    phoneLabel: '8 930 036 56 40',
  },
  {
    name: 'Ионов Максим',
    photo: `${IMG_BASE}/ionov_maksim.png`,
    position: 'Менеджер отдела персонального и корпоративного обслуживания',
    tg: 'https://t.me/+79300360338',
    phone: '+79300360338',
    phoneLabel: '8 930 036 03 38',
  },
]

const FAQ = [
  ['Сколько стоит персональное обслуживание?', 'Персональная консультация бесплатна.'],
  ['Вы работаете только с премиальной техникой?', 'Нет. Мы подбираем решения под ваш бюджет — от надёжных базовых до премиальных и эксклюзивных.'],
  ['Можно ли работать с нашим дизайнером?', 'Да. Мы взаимодействуем с вашим специалистом — под ваш формат проекта.'],
  ['Какие варианты оплаты доступны?', 'Любая форма оплаты: наличный и безналичный расчёт, рассрочка, оплата от юрлица с документами.'],
  ['Есть ли гарантия на технику под заказ?', 'Да. Мы обеспечиваем гарантийное сопровождение и сервисное решение.'],
  ['Вы можете хранить технику до окончания ремонта?', 'Да. Мы организуем хранение и доставку в удобный для вас момент.'],
  ['Кто будет вести мой проект?', 'За вами закрепляется персональный менеджер — один контакт на всех этапах: от подбора до установки.'],
  ['С какими проектами вы работаете?', 'Квартиры, дома, коммерческие объекты, офисы, апартаменты, шоурумы. От одной позиции до комплексных поставок. Это может быть любая бытовая техника, электроника, товары для дома и даже отдыха.'],
  ['Сколько времени занимает подбор и расчёт?', 'Первичные рекомендации — в день обращения. Детальный расчёт — после уточнения задачи.'],
  ['Как начать работу?', 'Оставьте заявку или обратитесь в офис — мы свяжемся с вами, уточним задачу и предложим персональное решение.'],
]

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="personal-service-page__faq-item">
      <button
        type="button"
        className="personal-service-page__faq-question"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {question}
        <span className={'personal-service-page__faq-icon' + (open ? ' personal-service-page__faq-icon--open' : '')}>▼</span>
      </button>
      {open && <div className="personal-service-page__faq-answer">{answer}</div>}
    </div>
  )
}

function PersonalService() {
  const [callbackOpen, setCallbackOpen] = useState(false)

  return (
    <>
      <Helmet><title>Персональное обслуживание — Top Disc</title></Helmet>
      <h1 className="info-page__title">Персональное обслуживание</h1>

      <div className="personal-service-page">
        <div className="personal-service-page__hero">
          <div className="personal-service-page__hero-badge">Персональный сервис Top Disc</div>
          <h2 className="personal-service-page__hero-title">
            Техника, которая подойдёт <span className="personal-service-page__accent">именно вам</span>
          </h2>
          <p className="personal-service-page__hero-subtitle">
            Персональный подбор премиальных комплектов для вашего дома
          </p>
          <div className="personal-service-page__hero-actions">
            <button type="button" className="personal-service-page__btn" onClick={() => setCallbackOpen(true)}>
              Получить персональную консультацию
            </button>
            <a className="personal-service-page__btn personal-service-page__btn--outline" href="https://t.me/topdiscpenza" target="_blank" rel="noopener noreferrer">
              Telegram
            </a>
          </div>
          <p className="personal-service-page__hero-note">Ответим в день обращения</p>
          <ImageWithFallback className="personal-service-page__hero-img" src={`${IMG_BASE}/orig.png`} alt="Персональный сервис Top Disc" />
        </div>

        <div className="personal-service-page__benefits">
          {BENEFITS.map((b) => (
            <div className="personal-service-page__benefit" key={b.title}>
              <svg className="personal-service-page__benefit-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {b.icon}
                {b.extra}
              </svg>
              <b>{b.title}</b>
              <span>{b.text}</span>
            </div>
          ))}
        </div>

        <h2>Не знаете, что выбрать?</h2>
        <div className="personal-service-page__pains">
          {PAINS.map((p) => (
            <div className="personal-service-page__pain" key={p}>{p}</div>
          ))}
        </div>
        <div className="personal-service-page__cta-center">
          <button type="button" className="personal-service-page__btn" onClick={() => setCallbackOpen(true)}>
            Мы подберём для вас — бесплатно
          </button>
        </div>

        <h2>Как мы работаем</h2>
        <div className="personal-service-page__steps">
          {STEPS.map((s, i) => (
            <div className="personal-service-page__step" key={s.title}>
              <div className="personal-service-page__step-num">{i + 1}</div>
              <b>{s.title}</b>
              <span>{s.text}</span>
            </div>
          ))}
        </div>

        <h2>Какие комплекты выбирают наши клиенты</h2>
        <div className="personal-service-page__kits">
          {KITS.map((kit) => (
            <div className="personal-service-page__kit" key={kit.title}>
              <h3>{kit.title}</h3>
              <p>{kit.text}</p>
              <ul>
                {kit.items.map(([name, desc]) => (
                  <li key={name}><b>{name}</b> — {desc}</li>
                ))}
              </ul>
              <button
                type="button"
                className="personal-service-page__btn personal-service-page__btn--sm"
                onClick={() => setCallbackOpen(true)}
              >
                Хочу такой комплект!
              </button>
            </div>
          ))}
        </div>

        <h2>Отзывы наших клиентов</h2>
        <p className="personal-service-page__intro">
          Отдел по работе с персональными клиентами работает не только с комплектацией квартир, но и со всеми
          товарами и услугами торговой площадки Top Disc. А отзывы наших друзей тому подтверждение.
        </p>
        <div className="personal-service-page__testimonials">
          {TESTIMONIALS.map((t) => (
            <div className="personal-service-page__testimonial" key={t.name}>
              <div className="personal-service-page__testimonial-name">{t.name}</div>
              <div className="personal-service-page__testimonial-role">{t.role}</div>
              <p>{t.text}</p>
            </div>
          ))}
        </div>
        <p className="personal-service-page__social-footer">Работаем по Пензе и ПФО</p>

        <h2>Ваши персональные менеджеры</h2>
        <div className="personal-service-page__team">
          {TEAM.map((m) => (
            <div className="personal-service-page__member" key={m.name}>
              {m.photo && <ImageWithFallback className="personal-service-page__member-photo" src={m.photo} alt={m.name} />}
              <h3>{m.name}</h3>
              <p className="personal-service-page__member-position">{m.position}</p>
              {m.exp && (
                <div className="personal-service-page__member-exp">
                  {m.exp.map((line) => <p key={line}>{line}</p>)}
                </div>
              )}
              {m.quote && <p className="personal-service-page__member-quote">{m.quote}</p>}
              <div className="personal-service-page__member-btns">
                <a href={m.tg} target="_blank" rel="noopener noreferrer" className="personal-service-page__member-tg">Telegram</a>
                <a href={`tel:${m.phone}`} className="personal-service-page__member-call">{m.phoneLabel}</a>
              </div>
            </div>
          ))}
        </div>

        <h2>Часто задаваемые вопросы</h2>
        <div className="personal-service-page__faq">
          {FAQ.map(([q, a]) => <FaqItem key={q} question={q} answer={a} />)}
        </div>

        <div className="personal-service-page__final">
          <h2>Готовы начать?</h2>
          <p>Оставьте заявку, и мы свяжемся с вами в течение дня</p>
          <button type="button" className="personal-service-page__btn personal-service-page__btn--green" onClick={() => setCallbackOpen(true)}>
            Получить консультацию
          </button>
        </div>
      </div>

      {callbackOpen && <CallbackModal onClose={() => setCallbackOpen(false)} />}
    </>
  )
}

export default PersonalService
