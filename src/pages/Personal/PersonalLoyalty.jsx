function PersonalLoyalty() {
  return (
    <div className="personal-loyalty">
      <h2 className="personal__section-title">Система лояльности</h2>

      <p className="personal-loyalty__desc">
        Программа лояльности TopDisc — это система бонусов, которая позволяет получать скидки
        на покупки и накапливать бонусные баллы.
      </p>

      <div className="personal-loyalty__levels">
        <h3 className="personal-loyalty__subtitle">Уровни участия</h3>
        <div className="personal-loyalty__table-wrap">
          <table className="personal-loyalty__table">
            <thead>
              <tr>
                <th>Уровень</th>
                <th>Сумма покупок</th>
                <th>Скидка</th>
                <th>Бонусы</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Стандарт</td>
                <td>от 0 ₽</td>
                <td>—</td>
                <td>1%</td>
              </tr>
              <tr>
                <td>Серебро</td>
                <td>от 50 000 ₽</td>
                <td>3%</td>
                <td>2%</td>
              </tr>
              <tr>
                <td>Золото</td>
                <td>от 150 000 ₽</td>
                <td>5%</td>
                <td>3%</td>
              </tr>
              <tr>
                <td>Платина</td>
                <td>от 300 000 ₽</td>
                <td>7%</td>
                <td>5%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="personal-loyalty__info">
        <h3 className="personal-loyalty__subtitle">Как это работает</h3>
        <ul className="personal-loyalty__list">
          <li>Бонусные баллы начисляются с каждой покупки</li>
          <li>1 бонус = 1 рубль при оплате следующей покупки</li>
          <li>Бонусами можно оплатить до 30% стоимости заказа</li>
          <li>Бонусы действительны в течение 12 месяцев с момента начисления</li>
        </ul>
      </div>
    </div>
  )
}

export default PersonalLoyalty
