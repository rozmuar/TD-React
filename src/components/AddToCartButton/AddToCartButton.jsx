import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { addToCart } from '../../store/slices/cartSlice'
import './AddToCartButton.css'

const ADDED_DURATION = 1400

function AddToCartButton({ product, className = '', children = 'В корзину', ...rest }) {
  const dispatch = useDispatch()
  const [added, setAdded] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleClick = () => {
    dispatch(addToCart(product))
    setAdded(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setAdded(false), ADDED_DURATION)
  }

  return (
    <button
      type="button"
      className={`add-to-cart-btn${added ? ' is-added' : ''}${className ? ' ' + className : ''}`}
      onClick={handleClick}
      {...rest}
    >
      {added ? (
        <span className="add-to-cart-btn__added">
          <svg className="add-to-cart-btn__check" width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Добавлено
        </span>
      ) : children}
    </button>
  )
}

export default AddToCartButton
