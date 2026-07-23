import { Fragment } from 'react'
import { Helmet } from 'react-helmet-async'

const IMG_BASE = 'https://topdisc.ru/bonus/img'

const TIERS = [
  { level: 'Старт', range: '0 – 20 000 ₽', count: '0', activation: 'через 15 дней', accrual: '1%', writeoff: '10%' },
  { level: '2 уровень', range: '20 000 – 100 000 ₽', count: '4', activation: 'через 15 дней', accrual: '1.5%', writeoff: '15%' },
  { level: '3 уровень', range: '100 000 – 300 000 ₽', count: '12', activation: 'через 7 дней', accrual: '2%', writeoff: '20%' },
  { level: '4 уровень', range: 'более 300 000 ₽', count: '24', activation: 'через 3 дня', accrual: '3%', writeoff: '30%' },
]

const STEPS = [
  { you: 'Регистрируетесь в программе', shop: 'Дарит 500 эвриков приветствия' },
  { you: 'Совершаете покупки', shop: 'Начисляет эврики и определяет уровень в программе' },
  { you: 'Оплачиваете часть суммы эвриками', shop: 'Списывает до 30% эвриков (зависит от уровня)' },
  { you: 'Снимаете обзоры и оставляете отзывы', shop: 'Начисляет дополнительные эврики' },
  { you: 'Отмечаете праздники', shop: 'Гарантирует приятные подарки' },
]

function Bonus() {
  return (
    <>
      <Helmet><title>Бонусная программа — Top Disc</title></Helmet>
      <h1 className="info-page__title">Бонусная программа</h1>

      <div className="bonus-page">
        <div className="bonus-page__hero">
          <div className="bonus-page__hero-text">
            <h2 className="bonus-page__hero-title">
              Новая удобная <span className="bonus-page__accent">выгодная</span>
            </h2>
            <ul className="bonus-page__hero-steps">
              <li>регистрируйтесь</li>
              <li className="bonus-page__accent">совершайте покупки</li>
              <li>получайте бонусы</li>
              <li className="bonus-page__accent">пользуйтесь преимуществами</li>
            </ul>
          </div>
          <img className="bonus-page__hero-img" src={`${IMG_BASE}/eviback.png`} alt="Бонусная программа TopDisc" />
        </div>

        <div className="bonus-page__intro">
          <ul className="bonus-page__benefits">
            <li>Несгораемые баллы уже с первой покупки</li>
            <li>Чем больше покупок — тем выше уровень выгоды в программе</li>
            <li>Приятные сюрпризы к праздникам</li>
            <li>Прекрасное настроение от классных приобретений</li>
          </ul>
          <div className="bonus-page__side">
            <div className="bonus-page__gift">
              <img src={`${IMG_BASE}/evik1.png`} alt="" />
              <div>
                <p>дарим</p>
                <p><b>500 бонусов</b></p>
                <p><b>приветствия</b></p>
              </div>
            </div>
            <div className="bonus-page__qr">
              <img src={`${IMG_BASE}/evik.png`} alt="" className="bonus-page__qr-icon" />
              <p>Регистрация и проверка бонусного баланса</p>
              <img src={`${IMG_BASE}/qr.png`} alt="QR-код регистрации" className="bonus-page__qr-code" />
            </div>
          </div>
        </div>

        <div className="bonus-page__table-block">
          <h2 className="bonus-page__table-title">Таблица привилегий</h2>
          <p className="bonus-page__table-note">возможны персональные акции и предложения</p>
          <div className="bonus-page__table-scroll">
            <table className="bonus-page__table">
              <thead>
                <tr>
                  <th></th>
                  {TIERS.map((t) => <th key={t.level}>{t.level}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Общая сумма покупок (за 1 год)</td>
                  {TIERS.map((t) => <td key={t.level}>{t.range}</td>)}
                </tr>
                <tr>
                  <td>Количество покупок</td>
                  {TIERS.map((t) => <td key={t.level}>{t.count}</td>)}
                </tr>
                <tr>
                  <td>Время активации бонусов</td>
                  {TIERS.map((t) => <td key={t.level}>{t.activation}</td>)}
                </tr>
                <tr>
                  <td>% начисления бонусов (от суммы покупки)</td>
                  {TIERS.map((t) => <td key={t.level}>{t.accrual}</td>)}
                </tr>
                <tr>
                  <td>% списания бонусов *</td>
                  {TIERS.map((t) => <td key={t.level}>{t.writeoff}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bonus-page__flow">
          <div className="bonus-page__flow-header">
            <span>Вы</span>
            <span className="bonus-page__accent">Top Disc</span>
          </div>
          {STEPS.map((step, i) => (
            <Fragment key={i}>
              <div className="bonus-page__flow-step">{step.you}</div>
              <div className="bonus-page__flow-step bonus-page__accent">{step.shop}</div>
            </Fragment>
          ))}
        </div>

        <div className="bonus-page__footer">
          <a href="/politika-konfidentsialnosti/" className="bonus-page__footer-link">Политика конфиденциальности</a>
          <p className="bonus-page__footer-note">
            * Кроме товаров:<br />
            — Продукция Starline<br />
            — Продукция Haier<br />
            — Из категории «распродажа»<br />
            — С указанием «стоп-цена»
          </p>
        </div>
      </div>
    </>
  )
}

export default Bonus
