import { useEffect } from 'react'

/**
 * Хук для выравнивания высоты элементов
 * @param {string} selector - CSS селектор элементов для выравнивания
 * @param {Array} dependencies - Зависимости для пересчёта высоты
 */
export const useMatchHeight = (selector, dependencies = []) => {
  useEffect(() => {
    const matchHeights = () => {
      const elements = document.querySelectorAll(selector)
      
      if (elements.length === 0) return

      // Сбрасываем высоту для корректного расчёта
      elements.forEach(el => {
        el.style.height = 'auto'
      })

      // Находим максимальную высоту
      let maxHeight = 0
      elements.forEach(el => {
        const height = el.offsetHeight
        if (height > maxHeight) {
          maxHeight = height
        }
      })

      // Применяем максимальную высоту ко всем элементам
      if (maxHeight > 0) {
        elements.forEach(el => {
          el.style.height = `${maxHeight}px`
        })
      }
    }

    // Выполняем сразу
    matchHeights()

    // Пересчитываем при изменении размера окна
    const handleResize = () => {
      matchHeights()
    }

    window.addEventListener('resize', handleResize)

    // Добавляем небольшую задержку для загрузки изображений
    const timeoutId = setTimeout(matchHeights, 100)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, dependencies)
}

/**
 * Функция для ручного выравнивания высоты (можно вызвать из компонента)
 * @param {string} selector - CSS селектор элементов для выравнивания
 */
export const matchHeights = (selector) => {
  const elements = document.querySelectorAll(selector)
  
  if (elements.length === 0) return

  // Сбрасываем высоту
  elements.forEach(el => {
    el.style.height = 'auto'
  })

  // Находим максимальную высоту
  let maxHeight = 0
  elements.forEach(el => {
    const height = el.offsetHeight
    if (height > maxHeight) {
      maxHeight = height
    }
  })

  // Применяем максимальную высоту
  if (maxHeight > 0) {
    elements.forEach(el => {
      el.style.height = `${maxHeight}px`
    })
  }
}
