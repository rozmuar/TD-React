import { useState } from 'react'
import { Link } from 'react-router-dom'
import CallbackModal from '../CallbackModal/CallbackModal'

function Footer() {
  const [callbackOpen, setCallbackOpen] = useState(false)
  return (
    <>
      {/* Мобильный бар */}
      <footer className="mobile-bar">
        <nav>
          <Link to="/catalog/">
            <img src="/img/footer/catalog.svg" alt="Каталог" />
            <span>Каталог</span>
          </Link>
          <Link to="/cart/">
            <img src="/img/footer/cart.svg" alt="Корзина" />
            <span>Корзина</span>
          </Link>
          <Link to="/favorites/">
            <img src="/img/footer/favorite.svg" alt="Избранное" />
            <span>Избранное</span>
          </Link>
          <Link to="/profile/">
            <img src="/img/footer/profile.svg" alt="Кабинет" />
            <span>Кабинет</span>
          </Link>
        </nav>
      </footer>

      {/* Основной футер */}
      <footer>
        <div className="container">
          <div className="footer__row">
            <div className="footer__left">
              <Link to="/">
                <img src="/img/footer/logo.png" alt="logo" className="footer__logo" />
              </Link>
              <div className="footer__text">
                ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ТОП ДИСК"
              </div>
              <div className="footer__data">
                <div className="footer__data-item">
                  ИНН <span>5800007220</span>
                </div>
                <div className="footer__data-item">
                  КПП <span>580001001</span>
                </div>
              </div>
              <div className="footer__stores">
                <div className="footer__store">
                  <div className="footer__store-name">TOP DISC Платформа</div>
                  <div className="footer__store-address">Ставского 4 (Напротив АЗС Роснефть)</div>
                  <div className="footer__store-time">Ежедневно 9:00–21:00</div>
                </div>
                <div className="footer__store">
                  <div className="footer__store-name">TOP DISC Смарт</div>
                  <div className="footer__store-address">Проспект Победы 124 (Универсам №173 со стороны ТРЦ «Квадрат»)</div>
                  <div className="footer__store-time">Ежедневно 9:00–20:00</div>
                </div>
                <div className="footer__store">
                  <div className="footer__store-name">TOP DISC Смарт Мини</div>
                  <div className="footer__store-address">Проспект Строителей 1В (ТЦ «Коллаж», 1 этаж)</div>
                  <div className="footer__store-time">Ежедневно 10:00–22:00</div>
                </div>
                <div className="footer__store">
                  <div className="footer__store-name">TOP DISC Смарт Мини</div>
                  <div className="footer__store-address">ул. Мира 60 (ТЦ «Западный», слева от главного входа)</div>
                  <div className="footer__store-time">Ежедневно 9:00–21:00</div>
                </div>
                <div className="footer__store">
                  <div className="footer__store-name">TOP DISC Смарт Мини</div>
                  <div className="footer__store-address">ул. Комсомольская 10 (Заречный, ТЦ «Юбилейный»)</div>
                  <div className="footer__store-time">Ежедневно 9:00–21:00</div>
                </div>
              </div>
              <div className="footer__copyright">
                © 2007-{new Date().getFullYear()} Top Disc.<br />Все права защищены
              </div>
            </div>
            <div className="footer__right">
              <div className="footer__top"></div>
              <div className="footer__bottom">
                <div className="footer__nav">
                  <div className="footer__nav-left">
                    <div className="footer__title">Компания</div>
                    <nav>
                      <ul>
                        <li><Link to="/o-nas/">О нас</Link></li>
                        <li><Link to="/brands/">Бренды</Link></li>
                        <li><Link to="/suppliers/">Поставщикам</Link></li>
                        <li><Link to="/opt/">Оптовикам</Link></li>
                        <li><Link to="/contacts/">Контакты</Link></li>
                      </ul>
                    </nav>
                  </div>
                  <div className="footer__nav-right">
                    <div className="footer__title">Покупателям</div>
                    <nav>
                      <ul>
                        <li><Link to="/company/news/">Статьи</Link></li>
                        <li><Link to="/bonus/">Бонусная программа</Link></li>
                        <li><Link to="/personal-service/">Персональное обслуживание</Link></li>
                        <li><Link to="/dostavka/">Доставка</Link></li>
                        <li><Link to="/payment/">Оплата</Link></li>
                        <li><Link to="/obmen-i-vozvraty/">Обмен и возврат</Link></li>
                        <li><Link to="/tradein/">Трейд-ин</Link></li>
                        <li><Link to="/garantiya-nizkoy-tseny/">Гарантия низкой цены</Link></li>
                        <li><Link to="/platnyy-remont/">Платный ремонт</Link></li>
                      </ul>
                    </nav>
                  </div>
                </div>
                <div className="footer__contacts">
                  <div className="footer__contacts-left">
                    <div className="footer__title">Контакты</div>
                    <a className="footer__phone" href="tel:8(800)500-21-41">
                      8 (800) 500-21-41
                    </a>
                    <div className="footer__address">Пенза, улица Ставского, 4, корп. 1</div>
                    <div className="footer__worktime">Ежедневно 9:00-21:00</div>
                    <button className="callback_btn" onClick={() => setCallbackOpen(true)}>Обратный звонок</button>
                  </div>
                  <div className="footer__contacts-right">
                    <div className="footer__socials-row">
                      <a href="#" className="footer__socials-item">
                        <img src="/img/footer/wp.svg" alt="whatsapp" />
                      </a>
                      <a href="#" className="footer__socials-item">
                        <img src="/img/footer/tg.svg" alt="telegram" />
                      </a>
                      <a href="#" className="footer__socials-item">
                        <img src="/img/footer/mail.svg" alt="mail" />
                      </a>
                      <a href="#" className="footer__socials-item">
                        <img src="/img/footer/vk.svg" alt="vk" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      {callbackOpen && <CallbackModal onClose={() => setCallbackOpen(false)} />}
    </>
  )
}

export default Footer
