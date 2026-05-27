import { useEffect, useState, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { getInfoPost } from '../../services/apiClient'
import { useSSRData } from '../../context/SSRDataContext'

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
        const result = res.data?.result
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
      <h1>{title}</h1>
      {loading && <p>Загрузка...</p>}
      {!loading && content && (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      )}
      {!loading && !content && !children && <p>Раздел находится в разработке.</p>}
      {children}
    </>
  )
}

export default InfoPage
