import { useState, useEffect } from 'react'

const FALLBACK_IMAGE = 'https://topdisc.ru/local/templates/bitlate_pro/images/top_no.png'

function ImageWithFallback({ src, alt, className, style, ...props }) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMAGE)
  const [hasError, setHasError] = useState(false)

  // Обновляем src при изменении props
  useEffect(() => {
    setImgSrc(src || FALLBACK_IMAGE)
    setHasError(false)
  }, [src])

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      setImgSrc(FALLBACK_IMAGE)
    }
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      {...props}
    />
  )
}

export default ImageWithFallback
