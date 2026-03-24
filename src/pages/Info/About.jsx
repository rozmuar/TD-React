import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

function About() {
  return (
    <>
      <Helmet>
        <title>О компании — Top Disc</title>
        <meta name="description" content="TOP DISC — супермаркет электроники в Пензе. Огромный выбор техники по низким ценам." />
      </Helmet>

      <section className="company">
        <h1 className="company__title">О компании</h1>

        <div className="company__cards">
          <article className="card company__card">
            <div className="card__image">
              <img src="/img/about/1.png" alt="Вход в магазин TOP DISC" />
            </div>
            <p className="card__text">
              TOP DISC — это супермаркет электроники, который состоит из
              нескольких локаций с огромным количеством товаров и расположен в самом
              центре города по адресу:<br /><strong>г. Пенза, ул. Ставского 4.</strong>
            </p>
          </article>

          <article className="card company__card">
            <div className="card__image">
              <img src="/img/about/2.png" alt="Парковка у магазина" />
            </div>
            <p className="card__text">
              Рядом с магазином расположена удобная парковка для посетителей. Она
              находится по левую сторону от локации «Платформа».
            </p>
          </article>

          <article className="card company__card">
            <div className="card__image">
              <img src="/img/about/3.png" alt="Парковка во внутреннем дворе" />
            </div>
            <p className="card__text">
              Также вы можете припарковать своё авто во внутреннем дворе (въезд с
              правой стороны от центрального входа).
            </p>
          </article>
        </div>

        <div className="company__hero">
          <div className="company__hero-image">
            <img src="/img/about/4.png" alt="Центральный вход локации Платформа" />
          </div>
          <div className="company__hero-content">
            <p>
              Попасть в магазин можно через центральный вход со стороны улицы
              Ставского. Для большего удобства есть 2‑й вход без ступенек со стороны
              улицы Революционной и 3‑й выход во внутреннем дворе, через который вы
              можете попасть на парковку или к зданию локации «Технопорт».
            </p>
          </div>
        </div>
      </section>

      <div className="company__wrapper">
        <section className="location">
          <div className="location__gallery">
            <figure className="location__photo">
              <img src="/img/about/5.png" alt="Вход в локацию" />
            </figure>
          </div>

          <div className="location__top-row">
            <div className="location__features">
              <h2 className="location__title">В локации Технопорт представлены:</h2>
              <ol className="location__list">
                <li className="location__item">
                  <span className="location__num">01</span>
                  <span className="location__link">крупная бытовая техника</span>
                </li>
                <li className="location__item">
                  <span className="location__num">02</span>
                  <span className="location__link">кухонная техника</span>
                </li>
                <li className="location__item">
                  <span className="location__num">03</span>
                  <span className="location__link">компьютеры и ноутбуки</span>
                </li>
                <li className="location__item">
                  <span className="location__num">04</span>
                  <span className="location__link">телевизоры</span>
                </li>
                <li className="location__item">
                  <span className="location__num">05</span>
                  <span className="location__link">электросамокаты</span>
                  <span className="location__etc">и многое другое</span>
                </li>
              </ol>
            </div>

            <aside className="location__access">
              <div className="location__access-icon">
                <img src="/img/about/8.png" alt="Точка на карте" />
              </div>
              <p className="location__access-text">
                Так же в локацию Технопорт вы можете пройти с улицы Захарова.
              </p>
            </aside>
          </div>

          <div className="location__description">
            <p>
              В TOP DISC большой выбор электротранспорта
              различных моделей и расцветок на любой вкус. А также
              самокаты не только для взрослых, но и для
              детей. Сделайте подарок себе и близким и испытайте незабываемые эмоции от
              катания.
            </p>
            <p>
              Если Вы давно мечтаете о новом смартфоне, но не хотите переплачивать за
              него, то мы рады предложить Вам весь ассортимент продукции
              Apple, XIAOMI, Samsung, Honor, Huawei и Realme
              по низким ценам. Также в наличии смарт‑часы и фитнес‑браслеты.
            </p>
            <p>
              У нас Вы можете приобрести любую технику
              Apple, либо из наличия магазина, либо предварительно оформив заказ, если
              данной техники нет в наличии. На всю продукцию, приобретённую в нашем
              магазине, действует гарантия.
            </p>
          </div>

          <div className="location__row">
            <div className="location__row-image">
              <img src="/img/about/9.png" alt="Зона выдачи покупок" />
            </div>
            <div className="location__row-content">
              <p>
                В нашем магазине Вы найдёте бытовую технику для дома различных
                производителей. Робот‑пылесос станет Вашим
                незаменимым помощником. А новая техника для
                кухни по привлекательной цене поможет приготовить не только вкусную,
                но и полезную еду для всей семьи. Так же представлена техника для
                поддержания красоты и Вашего здоровья.
              </p>
              <p>
                В продаже представлены телевизоры различной
                диагонали и все необходимые для просмотра
                аксессуары.
              </p>
            </div>
          </div>
        </section>

        <section className="assortment">
          <div className="assortment__text">
            <p>
              А так же у нас огромный ассортимент
              кабелей и зарядных устройств для мобильных
              телефонов, аксессуаров и комплектующих для компьютеров.
            </p>
            <p>
              В продаже имеются игровые приставки
              Sega, Dendy, Sony Playstation, XBOX, Nintendo,
              аксессуары и видеоигры к ним.
            </p>
            <p>
              Настольные игры, транспорт на радиоуправлении, конструкторы, мягкие игрушки…
              У нас Вы найдёте подарок на любой вкус и возраст!
            </p>
            <p>
              Огромный выбор защитных плёнок и стёкол, а так
              же чехлов для самых популярных моделей
              смартфонов.
            </p>
          </div>

          <div className="assortment__row">
            <div className="assortment__row-image">
              <img src="/img/about/10.png" alt="Вывеска пунктов выдачи" />
            </div>
            <div className="assortment__row-content">
              <p>
                В TOP DISC также есть пункты выдачи сервиса доставки «Boxberry»,
                «Wildberries», «Ozon», «СДЭК».
              </p>
            </div>
          </div>

          <div className="assortment__row-bottom">
            <div className="assortment__about">
              <p>
                Мы работаем только с проверенными поставщиками и производителями, поэтому
                весь товар отвечает строгим стандартам качества и имеет официальную
                гарантию от производителя. Профессиональные консультанты всегда помогут
                Вам в выборе интересующего Вас товара. Низкие цены и гибкая система скидок,
                несомненно, порадуют Вас и позволят существенно сэкономить на покупке.
              </p>
              <p>
                В скором времени у нас планируется расширение. Откроется новая локация
                «Депо», где будут представлены игрушки, товары для спорта и отдыха и многое
                другое!
              </p>
            </div>

            <div className="assortment__footer">
              <figure className="assortment__footer-image">
                <img src="/img/about/bot.png" alt="Робот с коробками" />
              </figure>
              <div className="assortment__footer-content">
                <p className="assortment__footer-title">
                  Весь ассортимент<br />товаров Вы можете<br />посмотреть здесь
                </p>
                <Link to="/catalog/" className="button button--primary">В каталог</Link>
              </div>
            </div>
          </div>

          <p className="assortment__note">
            Документ о происхождении СОУТ № 271585 от 17.02.2021
          </p>
        </section>
      </div>
    </>
  )
}

export default About
