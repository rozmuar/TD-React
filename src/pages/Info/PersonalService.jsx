import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback'
import CallbackModal from '../../components/CallbackModal/CallbackModal'

const IMG_BASE = 'https://topdisc.ru/personal-service/img'

const BENEFITS = [
  ['Бесплатная консультация', 'Экспертно. Без обязательств.'],
  ['Работаем с вашим дизайнером', 'Или подключим своего.'],
  ['Эксклюзив под заказ', 'То, чего нет в сетях.'],
  ['Любая форма оплаты', 'Нал, безнал, рассрочка, юрлица.'],
  ['Индивидуальный подбор цены', 'Под ваш проект и бюджет.'],
  ['Доставка и хранение', 'Привезём, подождём, установим.'],
  ['Персональный менеджер', 'Один контакт — от подбора до сдачи.'],
  ['20 лет опыта', 'Решаем сложные задачи.'],
]

const PAINS = [
  'Техника не вписана в интерьер?',
  'Не уверены, какие бренды выбрать?',
  'Хочется всё сразу — и красиво, и надёжно?',
]

const STEPS = [
  ['Консультация', 'Выясняем ваши потребности и бюджет'],
  ['Подбор техники', 'Подбираем под ваш интерьер'],
  ['Работа с дизайнером', 'Согласовываем с вашим специалистом, в случае вашего сотрудничества'],
  ['Доставка и хранение', 'Привезём в удобное время'],
  ['Установка и настройка', 'Запустим всё под ключ'],
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
    text: '«Вчера родители приходили в Top Disc, чтобы настроить новый телефон и перенести данные со старого. Вечером они поделились впечатлениями — об отношении, внимании и уровне сервиса. Отдельное Спасибо просили передать Кириллу. Они были в восторге, насколько человек сделал всё хорошо и с уважением. В общем, Спасибо большое, Паша!»',
  },
  {
    name: 'Денис',
    role: 'г. Пенза',
    text: '«Кирилл, доброе утро! Спасибо за подробную информацию. Это лучший подход к работе, который мне встречался. Наш выбор V15. Только давайте ещё определимся со стационарным, он нам нужен в первую очередь, так как он сломался, а вертикальный пока ещё дышит. Возможно разделю покупку на приоритеты.»',
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
    <div className="ps-faq__item">
      <button
        type="button"
        className="ps-faq__question"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {question}
        <span className={'ps-faq__icon' + (open ? ' ps-faq__icon--open' : '')} aria-hidden="true" />
      </button>
      {open && <div className="ps-faq__answer">{answer}</div>}
    </div>
  )
}

function PersonalService() {
  const [callbackOpen, setCallbackOpen] = useState(false)
  const openCallback = () => setCallbackOpen(true)

  return (
    <>
      <Helmet><title>Персональное обслуживание — Top Disc</title></Helmet>
      <h1 className="info-page__title">Персональное обслуживание</h1>

      <div className="ps-page">
        <div className="ps-hero">
          <div className="ps-hero__text">
            <span className="ps-eyebrow">Персональный сервис Top Disc</span>
            <h2 className="ps-hero__title">
              Техника, которая подойдёт <span className="ps-accent">именно вам</span>
            </h2>
            <p className="ps-hero__subtitle">
              Персональный подбор премиальных комплектов для вашего дома — от идеи до установки под ключ.
            </p>
            <div className="ps-hero__actions">
              <button type="button" className="ps-btn" onClick={openCallback}>
                Получить консультацию
              </button>
              <a className="btn--outline-accent" href="https://t.me/topdiscpenza" target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
            </div>
            <p className="ps-hero__note">Ответим в день обращения</p>
          </div>
          <div className="ps-hero__frame">
            <ImageWithFallback className="ps-hero__img" src={`${IMG_BASE}/orig.png`} alt="Персональный сервис Top Disc" />
          </div>
        </div>

        <div className="ps-benefits">
          {BENEFITS.map(([title, text]) => (
            <div className="ps-benefits__item" key={title}>
              <b>{title}</b>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <div className="ps-divider" />

        <h2 className="ps-heading ps-heading--center">Не знаете, что выбрать?</h2>
        <div className="ps-pains">
          {PAINS.map((p) => (
            <div className="ps-pains__item" key={p}>{p}</div>
          ))}
        </div>
        <div className="ps-cta-center">
          <button type="button" className="ps-btn" onClick={openCallback}>
            Мы подберём для вас — бесплатно
          </button>
        </div>

        <div className="ps-divider" />

        <h2 className="ps-heading">Как мы работаем</h2>
        <ol className="ps-steps">
          {STEPS.map(([title, text], i) => (
            <li className="ps-steps__item" key={title}>
              <span className="ps-steps__num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <b>{title}</b>
                <span>{text}</span>
              </div>
            </li>
          ))}
        </ol>

        <div className="ps-divider" />

        <h2 className="ps-heading">Какие комплекты выбирают наши клиенты</h2>
        <div className="ps-kits">
          {KITS.map((kit) => (
            <div className="ps-kit" key={kit.title}>
              <h3>{kit.title}</h3>
              <p>{kit.text}</p>
              <ul>
                {kit.items.map(([name, desc]) => (
                  <li key={name}><b>{name}</b> — {desc}</li>
                ))}
              </ul>
              <button
                type="button"
                className="btn--outline-accent"
                onClick={openCallback}
              >
                Хочу такой комплект
              </button>
            </div>
          ))}
        </div>

        <div className="ps-divider" />

        <h2 className="ps-heading">Отзывы наших клиентов</h2>
        <p className="ps-intro">
          Отдел по работе с персональными клиентами работает не только с комплектацией квартир, но и со всеми
          товарами и услугами торговой площадки Top Disc. А отзывы наших друзей тому подтверждение.
        </p>
        <div className="ps-testimonials">
          {TESTIMONIALS.map((t) => (
            <div className="ps-testimonial" key={t.name}>
              <p>{t.text}</p>
              <div className="ps-testimonial__name">{t.name}</div>
              <div className="ps-testimonial__role">{t.role}</div>
            </div>
          ))}
        </div>
        <p className="ps-social-footer">Работаем по Пензе и ПФО</p>

        <div className="ps-divider" />

        <h2 className="ps-heading">Ваши персональные менеджеры</h2>
        <div className="ps-team">
          {TEAM.map((m) => (
            <div className="ps-member" key={m.name}>
              {m.photo
                ? <ImageWithFallback className="ps-member__photo" src={m.photo} alt={m.name} />
                : <div className="ps-member__photo ps-member__photo--placeholder">{m.name.charAt(0)}</div>}
              <h3>{m.name}</h3>
              <p className="ps-member__position">{m.position}</p>
              {m.exp && (
                <div className="ps-member__exp">
                  {m.exp.map((line) => <p key={line}>{line}</p>)}
                </div>
              )}
              {m.quote && <p className="ps-member__quote">{m.quote}</p>}
              <div className="ps-member__btns">
                <a href={m.tg} target="_blank" rel="noopener noreferrer" className="btn--outline-accent">Telegram</a>
                <a href={`tel:${m.phone}`} className="ps-member__call">{m.phoneLabel}</a>
              </div>
            </div>
          ))}
        </div>

        <div className="ps-divider" />

        <h2 className="ps-heading">Часто задаваемые вопросы</h2>
        <div className="ps-faq">
          {FAQ.map(([q, a]) => <FaqItem key={q} question={q} answer={a} />)}
        </div>

        <div className="ps-final">
          <h2>Готовы начать?</h2>
          <p>Оставьте заявку, и мы свяжемся с вами в течение дня</p>
          <button type="button" className="ps-btn" onClick={openCallback}>
            Получить консультацию
          </button>
        </div>
      </div>

      {callbackOpen && <CallbackModal onClose={() => setCallbackOpen(false)} />}
    </>
  )
}

export default PersonalService
