import { useEffect, useState, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { getInfoPost } from '../../services/apiClient'
import { useSSRData } from '../../context/SSRDataContext'
import { sanitizeHtml } from '../../utils/sanitizeHtml'

function InfoPage({ title, bitrixCode, children }) {
  const ssrData = useSSRData()
  const ssrMatch = bitrixCode && ssrData?.type === 'info' && ssrData?.code === bitrixCode
  const ssrUsed = useRef(false)

  const [content, setContent] = useState(ssrMatch ? ssrData.content : null)
  const [loading, setLoading] = useState(!!bitrixCode && !ssrMatch)

  useEffect(() => {
    if (!bitrixCode) return
    if (ssrMatch && !ssrUsed.current) {
      ssrUsed.current = true
      return
    }
    ssrUsed.current = true

    const fetchContent = async () => {
      try {
        const res = await getInfoPost(bitrixCode)
        // Реальный ответ app_mobile.posts.json — result.data.{...}, а не result.{...}
        // напрямую (как уже учтено в SSR-версии, src/ssr/fetchPageData.js)
        const result = res.data?.result?.data
        setContent(result?.text || result?.detail_text || result?.preview_text || null)
      } catch (e) {
        console.error('InfoPage fetch error:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [bitrixCode])

  return (
    <>
      <Helmet>
        <title>{title} — Top Disc</title>
      </Helmet>
      <h1 className="info-page__title">{title}</h1>
      {loading && <p className="info-page__loading">Загрузка...</p>}
      {!loading && content && (
        <div className="info-page__content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
      )}
      {!loading && !content && !children && <p className="info-page__loading">Раздел находится в разработке.</p>}
      {children}
    </>
  )
}

export default InfoPage
