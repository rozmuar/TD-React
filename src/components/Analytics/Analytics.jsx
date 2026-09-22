import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const METRIKA_ID = 41288789
const MAILRU_ID = '3510809'

// Счётчики (index.html) сами логируют первый просмотр при обычной загрузке
// страницы. Но переходы между страницами в SPA не перезагружают документ —
// без ручной отправки хита следующие просмотры вообще не попадали бы
// в статистику Метрики и Top.Mail.Ru.
function Analytics() {
  const location = useLocation()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const url = location.pathname + location.search

    if (typeof window.ym === 'function') {
      window.ym(METRIKA_ID, 'hit', url)
    }

    if (Array.isArray(window._tmr)) {
      window._tmr.push({ id: MAILRU_ID, type: 'pageView', start: Date.now() })
    }
  }, [location.pathname, location.search])

  return null
}

export default Analytics
