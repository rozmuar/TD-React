import { Helmet } from 'react-helmet-async'

const IMG_BASE = 'https://back.topdisc.ru/yuridicheskim-litsam/items'

const PARTNER_ITEMS = [
  {
    img: `${IMG_BASE}/1.png`,
    title: 'Оставить заявку',
    body: (
      <>
        <p>на нашей почте</p>
        <a href="mailto:zakaz@topdisc.ru">zakaz@topdisc.ru</a>
        <p>наш менеджер поможет вам оформить счет на оплату</p>
      </>
    ),
  },
  {
    img: `${IMG_BASE}/2.png`,
    title: 'Позвонить по номеру',
    body: (
      <>
        <a href="tel:+78412236566"><b>+7 (8412) 23-65-66 (доб. 904)</b></a>
        <p>менеджер ответит на вопросы и оформит счет на оплату</p>
      </>
    ),
  },
  {
    img: `${IMG_BASE}/3.png`,
    title: null,
    body: (
      <>
        <p className="yur-lico__title">У нас можно: <b>оплатить покупку бизнес-картой в магазине</b> и получить закрывающие документы!</p>
        <span>(на сайте эта форма оплаты недоступна)</span>
      </>
    ),
  },
]

const COMFORT_ITEMS = [
  { img: `${IMG_BASE}/4.png`, title: 'Широкий ассортимент', text: 'представленный в трех локациях: Платформа, Депо и Технопорт.' },
  { img: `${IMG_BASE}/5.png`, title: 'Все, что ищется – всегда находится!', text: 'Не нашли нужную позицию в магазине или на сайте? Найдем и привезем!' },
  { img: `${IMG_BASE}/6.png`, title: 'Бесплатная доставка', text: 'для юридических лиц по г. Пенза от 3000 р.' },
]

const DOCS = [
  { href: `${IMG_BASE}/Договор_поставки_НДС_ИП_Ханакин_предоплата_2025.pdf`, title: 'Договор поставки: 100% предоплата' },
  { href: `${IMG_BASE}/Шаблон_ДП_НДС_ИП_Ханакин_202530на_70_рассрочка.pdf`, title: 'Договор поставки с частичной отсрочкой платежа' },
]

function LegalEntities() {
  return (
    <>
      <Helmet>
        <title>Юридическим лицам — TopDisc</title>
        <meta name="description" content="Условия покупки для юридических лиц в TopDisc: оплата по счёту, закрывающие документы, договор поставки, бесплатная доставка по Пензе и помощь менеджера." />
      </Helmet>
      <h1 className="info-page__title">Юридическим лицам</h1>

      <div className="yur-lico-page">
        <img
          className="yur-lico-page__hero"
          src="https://back.topdisc.ru/upload/iblock/4f4/qm6o27zn6813t0y4yoeet760fnf0n29x.jpg"
          alt="Юридическим лицам"
        />

        <div className="yur-lico-block">
          <h2>Стать нашим партнером</h2>
          <div className="row">
            {PARTNER_ITEMS.map((item, i) => (
              <div className="col-12 col-md-4" key={i}>
                <div className="yur-lico__item">
                  <img src={item.img} alt="Юридическим лицам" />
                  {item.title && <p className="yur-lico__title"><b>{item.title}</b></p>}
                  {item.body}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="yur-lico-block">
          <h2>С нами – удобно :)</h2>
          <div className="row">
            {COMFORT_ITEMS.map((item, i) => (
              <div className="col-12 col-md-4" key={i}>
                <div className="yur-lico__item">
                  <img src={item.img} alt="Юридическим лицам" />
                  <p className="yur-lico__title"><b>{item.title}</b></p>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="yur-lico-block">
          <h2>Необходимые документы на получение товара</h2>
          <p>Для юридических лиц с печатью</p>
          <p>Получатель – Генеральный директор</p>
          <ul>
            <li>Паспорт гражданина РФ</li>
            <li>Реестровая печать</li>
          </ul>
          <p>Получатель – Доверенное лицо</p>
          <ul>
            <li>Доверенность, заверенная печатью</li>
            <li>Паспорт гражданина РФ</li>
          </ul>
          <p>Для юридических лиц без печати</p>
          <p>Получатель – Генеральный директор</p>
          <ul>
            <li>Паспорт гражданина РФ</li>
            <li>Скан-копия Устава, страница 2 (для всех, кроме ИП)</li>
          </ul>
          <p>Получатель – Доверенное лицо</p>
          <ul>
            <li>Доверенность, заверенная подписью ген. Директора</li>
            <li>Паспорт гражданина РФ</li>
          </ul>
        </div>

        <div className="yur-lico-block">
          <h2>Типовые документы</h2>
          <div className="yur-lico-doc">
            {DOCS.map((doc, i) => (
              <div className="yur-lico-doc-item" key={i}>
                <a href={doc.href} target="_blank" rel="noopener noreferrer">
                  <img src={`${IMG_BASE}/7.png`} alt="Юридическим лицам" />
                  <p className="yur-lico__title">{doc.title}</p>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default LegalEntities
