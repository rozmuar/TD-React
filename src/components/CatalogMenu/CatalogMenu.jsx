import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getMenu } from '../../services/apiClient'
import { decodeHtml } from '../../utils/decodeHtml'

let menuCache = null

function CatalogMenu({ isOpen, onClose }) {
  const [menu, setMenu] = useState(menuCache)
  const [activeL1, setActiveL1] = useState(null)
  const [activeL2, setActiveL2] = useState(null)
  // Мобильная версия — не 3 колонки рядом (не влезает в экран), а один
  // уровень на весь экран с drill-down: 0 = L1, 1 = L2, 2 = L3, назад —
  // кнопкой. На десктопе это состояние ни на что не влияет (там все
  // колонки видны одновременно через hover, см. CSS)
  const [mobileLevel, setMobileLevel] = useState(0)
  const menuRef = useRef(null)
  const hoverTimeout = useRef(null)

  // Загрузка меню (с кешем)
  useEffect(() => {
    if (!isOpen || menuCache) {
      if (menuCache) setMenu(menuCache)
      return
    }
    getMenu().then(res => {
      const items = res.data?.result?.menu || []
      menuCache = items
      setMenu(items)
    }).catch(console.error)
  }, [isOpen])

  // Выбираем первый пункт по умолчанию при открытии
  useEffect(() => {
    if (isOpen && menu?.length && !activeL1) {
      setActiveL1(menu[0].id)
      const firstChild = menu[0].children?.[0]
      setActiveL2(firstChild?.children?.length ? firstChild.id : null)
    }
  }, [isOpen, menu, activeL1])

  // Сброс при закрытии
  useEffect(() => {
    if (!isOpen) {
      setActiveL1(null)
      setActiveL2(null)
      setMobileLevel(0)
    }
  }, [isOpen])

  // Клик вне меню — закрытие
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.header__catalog')) {
        onClose()
      }
    }
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, onClose])

  const handleL1Enter = useCallback((id) => {
    clearTimeout(hoverTimeout.current)
    hoverTimeout.current = setTimeout(() => {
      setActiveL1(id)
      // Автовыбор первой L2 подкатегории, у которой есть children
      const l1 = (menu || []).find(c => c.id === id)
      const firstL2 = l1?.children?.find(c => c.children?.length)
      setActiveL2(firstL2?.id || null)
    }, 80)
  }, [menu])

  const handleL2Enter = useCallback((id) => {
    setActiveL2(id)
  }, [])

  const handleNavigate = useCallback(() => {
    onClose()
  }, [onClose])

  // Тап по пункту с подкатегориями на мобильном — не переходим по ссылке,
  // а открываем следующий уровень (drill-down). На десктопе клик по такому
  // пункту всё равно должен вести на страницу категории (там подкатегории
  // уже открыты через hover) — поэтому это поведение включаем только через
  // CSS/медиа-запрос, а здесь просто не мешаем обычной навигации, если
  // используется как обычная ссылка. Различить "тач это или мышь" в JS
  // ненадёжно, поэтому решение простое: клик по СТРЕЛКЕ — всегда drill-down
  // (работает и как основной способ на мобильном, и не мешает на десктопе),
  // клик по остальной части строки — обычная навигация.
  const handleL1DrillDown = useCallback((e, item) => {
    e.preventDefault()
    e.stopPropagation()
    setActiveL1(item.id)
    const firstL2 = item.children?.find(c => c.children?.length)
    setActiveL2(firstL2?.id || null)
    setMobileLevel(1)
  }, [])

  const handleL2DrillDown = useCallback((e, item) => {
    e.preventDefault()
    e.stopPropagation()
    setActiveL2(item.id)
    setMobileLevel(2)
  }, [])

  const handleMobileBack = useCallback(() => {
    setMobileLevel((lvl) => Math.max(0, lvl - 1))
  }, [])

  if (!isOpen) return null

  const activeL1Data = menu?.find(c => c.id === activeL1)
  const l2Items = activeL1Data?.children || []
  const activeL2Data = l2Items.find(c => c.id === activeL2)
  const l3Items = activeL2Data?.children || []

  // Заголовок мобильной шапки меню — название текущего уровня
  const mobileTitle = mobileLevel === 2
    ? decodeHtml(activeL2Data?.text || '')
    : mobileLevel === 1
      ? decodeHtml(activeL1Data?.text || '')
      : 'Каталог'

  return (
    <div className="catalog-menu" ref={menuRef}>
      <div className="catalog-menu__overlay" onClick={onClose} />
      <div className="catalog-menu__dropdown">
        {/* Шапка — только на мобильном (см. CSS): назад/заголовок/закрыть */}
        <div className="catalog-menu__mobile-header">
          {mobileLevel > 0 ? (
            <button type="button" className="catalog-menu__mobile-back" onClick={handleMobileBack} aria-label="Назад">
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ) : <span className="catalog-menu__mobile-back-spacer" />}
          <span className="catalog-menu__mobile-title">{mobileTitle}</span>
          <button type="button" className="catalog-menu__mobile-close" onClick={onClose} aria-label="Закрыть">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Уровень 1 — левая колонка (десктоп) / первый экран (мобильный) */}
        <div className={`catalog-menu__l1${mobileLevel === 0 ? ' is-mobile-level' : ''}`}>
          {menu?.map(item => (
            <Link
              key={item.id}
              to={item.link}
              className={`catalog-menu__l1-item${item.id === activeL1 ? ' is-active' : ''}`}
              onMouseEnter={() => handleL1Enter(item.id)}
              onClick={handleNavigate}
            >
              <span>{decodeHtml(item.text)}</span>
              {item.is_parent && (
                <svg
                  className="catalog-menu__arrow"
                  width="6" height="10" viewBox="0 0 6 10" fill="none"
                  onClick={(e) => handleL1DrillDown(e, item)}
                >
                  <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </Link>
          ))}
        </div>

        {/* Уровень 2 — средняя колонка (десктоп) / второй экран (мобильный) */}
        {l2Items.length > 0 && (
          <div className={`catalog-menu__l2${mobileLevel === 1 ? ' is-mobile-level' : ''}`}>
            {l2Items.map(item => (
              <Link
                key={item.id}
                to={item.link}
                className={`catalog-menu__l2-item${item.id === activeL2 ? ' is-active' : ''}`}
                onMouseEnter={() => handleL2Enter(item.id)}
                onClick={handleNavigate}
              >
                <span>{decodeHtml(item.text)}</span>
                {item.children?.length > 0 && (
                  <svg
                    className="catalog-menu__arrow"
                    width="6" height="10" viewBox="0 0 6 10" fill="none"
                    onClick={(e) => handleL2DrillDown(e, item)}
                  >
                    <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Уровень 3 — правая колонка (десктоп) / третий экран (мобильный) */}
        {l3Items.length > 0 && (
          <div className={`catalog-menu__l3${mobileLevel === 2 ? ' is-mobile-level' : ''}`}>
            {l3Items.map(item => (
              <Link
                key={item.id}
                to={item.link}
                className="catalog-menu__l3-item"
                onClick={handleNavigate}
              >
                {decodeHtml(item.text)}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CatalogMenu
