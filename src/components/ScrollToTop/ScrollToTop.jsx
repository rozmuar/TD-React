import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// React Router сам по себе не прокручивает страницу наверх при переходах —
// открыв карточку товара из середины длинного списка каталога, покупатель
// иначе видит её с той же прокруткой, что была в списке.
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default ScrollToTop
