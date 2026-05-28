import { useEffect, useState, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { getInfoPost, getTradeInData } from '../../services/apiClient'
import { useSSRData } from '../../context/SSRDataContext'

const ADVANTAGES = [
  {
    title: 'Выгодно',
    text: 'Вы обязательно найдете выгодную технику на замену',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Удобно',
    text: 'Вы не тратите время на продажу',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Быстро',
    text: 'Быстрая диагностика',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M7 2v11h3v9l7-12h-4l4-8z" fill="currentColor" />
      </svg>
    ),
  },
]

function getImgSrc(img) {
  if (!img) return null
  if (typeof img === 'string') return img
  return img.src || img.path || img.url || null
}

function TradeIn() {
  const ssrData = useSSRData()
  const ssrMatch = ssrData?.type === 'info' && ssrData?.code === 'treyd-in'
  const ssrUsed = useRef(false)

  const [pageInfo, setPageInfo] = useState(ssrMatch ? ssrData : null)
  const [tradeData, setTradeData] = useState(ssrMatch ? ssrData.tradeData : null)
  const [loading, setLoading] = useState(!ssrMatch)

  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState('')
  const [volumeOptions, setVolumeOptions] = useState([])
  const [selectedVolume, setSelectedVolume] = useState('')
  const [price, setPrice] = useState(0)

  const initForm = (data) => {
    if (!data) return
    setModels(Object.keys(data))
  }

  useEffect(() => {
    if (ssrMatch && !ssrUsed.current) {
      ssrUsed.current = true
      initForm(ssrData.tradeData)
      return
    }
    ssrUsed.current = true

    const fetchAll = async () => {
      try {
        const [postsRes, tradeRes] = await Promise.all([
          getInfoPost('treyd-in'),
          getTradeInData(),
        ])
        setPageInfo(postsRes.data?.result?.data || null)
        const trade = tradeRes.data?.result?.data || null
        setTradeData(trade)
        initForm(trade)
      } catch (e) {
        console.error('TradeIn fetch error:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const handleModelChange = (e) => {
    const model = e.target.value
    setSelectedModel(model)
    setSelectedVolume('')
    setPrice(0)
    if (model && tradeData?.[model]) {
      setVolumeOptions([...tradeData[model]].reverse())
    } else {
      setVolumeOptions([])
    }
  }

  const handleVolumeChange = (e) => {
    const vol = e.target.value
    setSelectedVolume(vol)
    if (selectedModel && tradeData?.[selectedModel]) {
      const item = tradeData[selectedModel].find((i) => i.UF_MEMORY === vol)
      setPrice(item ? Number(item.UF_PRICE) : 0)
    }
  }

  const detailPicSrc = getImgSrc(pageInfo?.detail_picture)
  const previewPicSrc = getImgSrc(pageInfo?.preview_picture)
  const previewText = pageInfo?.preview_text || null
  const detailText = pageInfo?.detail_text || null

  return (
    <>
      <Helmet>
        <title>Трейд-ин — Top Disc</title>
        <meta name="description" content="Обменяйте старый iPhone на новый по программе Трейд-ин в магазине Top Disc" />
      </Helmet>

      {/* 1. detail_picture — верхний баннер */}
      {detailPicSrc && (
        <img src={detailPicSrc} alt="Трейд-ин" className="tradein__banner" />
      )}

      {/* 2. Заголовок (preview_text — plain text) + форма */}
      <section className="tradein__form-section">
        {previewText && (
          <h2 className="tradein__section-title">{previewText}</h2>
        )}
        <div className="tradein__form-row">
          <select
            className="tradein__select tradein__select--wide"
            value={selectedModel}
            onChange={handleModelChange}
          >
            <option value="">Сдаваемое устройство</option>
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            className="tradein__select"
            value={selectedVolume}
            onChange={handleVolumeChange}
            disabled={!selectedModel}
          >
            <option value="">Выберите объем памяти</option>
            {volumeOptions.map((opt) => (
              <option key={opt.UF_MEMORY} value={opt.UF_MEMORY}>{opt.UF_MEMORY} ГБ</option>
            ))}
          </select>
          <div className="tradein__price">
            {price > 0
              ? price.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 })
              : '0 ₽'}
          </div>
        </div>
        <p className="tradein__note">
          <span className="tradein__note-star">*</span> Данная оценочная стоимость является ОРИЕНТИРОВОЧНОЙ, окончательную стоимость устройства Вам назовут после осмотра специалистом
        </p>
      </section>

      {/* 3. preview_picture — зелёный баннер «3 шага» */}
      {previewPicSrc && (
        <img src={previewPicSrc} alt="Трейд-ин — 3 шага до нового смартфона" className="tradein__banner" />
      )}

      {/* 4. Преимущества — хардкод */}
      <section className="tradein__advantages">
        <h2 className="tradein__advantages-title">Преимущества</h2>
        <div className="tradein__advantages-grid">
          {ADVANTAGES.map((adv) => (
            <div key={adv.title} className="tradein__advantage-card">
              <div className="tradein__advantage-icon">{adv.icon}</div>
              <div className="tradein__advantage-name">{adv.title}</div>
              <div className="tradein__advantage-text">{adv.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. detail_text — HTML из API */}
      {detailText && (
        <div className="tradein__detail-text" dangerouslySetInnerHTML={{ __html: detailText }} />
      )}
    </>
  )
}

export default TradeIn
