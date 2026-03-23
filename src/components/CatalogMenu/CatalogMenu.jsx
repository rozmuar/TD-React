import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getMenu } from '../../services/apiClient'

let menuCache = null

function CatalogMenu({ isOpen, onClose }) {
  const [menu, setMenu] = useState(menuCache)
  const [activeL1, setActiveL1] = useState(null)
  const [activeL2, setActiveL2] = useState(null)
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

  if (!isOpen) return null

  const activeL1Data = menu?.find(c => c.id === activeL1)
  const l2Items = activeL1Data?.children || []
  const activeL2Data = l2Items.find(c => c.id === activeL2)
  const l3Items = activeL2Data?.children || []

  return (
    <div className="catalog-menu" ref={menuRef}>
      <div className="catalog-menu__overlay" onClick={onClose} />
      <div className="catalog-menu__dropdown">
        {/* Уровень 1 — левая колонка */}
        <div className="catalog-menu__l1">
          {menu?.map(item => (
            <Link
              key={item.id}
              to={item.link}
              className={`catalog-menu__l1-item${item.id === activeL1 ? ' is-active' : ''}`}
              onMouseEnter={() => handleL1Enter(item.id)}
              onClick={handleNavigate}
            >
              <span>{item.text}</span>
              {item.is_parent && (
                <svg className="catalog-menu__arrow" width="6" height="10" viewBox="0 0 6 10" fill="none">
                  <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </Link>
          ))}
        </div>

        {/* Уровень 2 — средняя колонка */}
        {l2Items.length > 0 && (
          <div className="catalog-menu__l2">
            {l2Items.map(item => (
              <Link
                key={item.id}
                to={item.link}
                className={`catalog-menu__l2-item${item.id === activeL2 ? ' is-active' : ''}`}
                onMouseEnter={() => handleL2Enter(item.id)}
                onClick={handleNavigate}
              >
                <span>{item.text}</span>
                {item.children?.length > 0 && (
                  <svg className="catalog-menu__arrow" width="6" height="10" viewBox="0 0 6 10" fill="none">
                    <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Уровень 3 — правая колонка */}
        {l3Items.length > 0 && (
          <div className="catalog-menu__l3">
            {l3Items.map(item => (
              <Link
                key={item.id}
                to={item.link}
                className="catalog-menu__l3-item"
                onClick={handleNavigate}
              >
                {item.text}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CatalogMenu
