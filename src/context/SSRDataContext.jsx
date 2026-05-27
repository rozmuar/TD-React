import { createContext, useContext } from 'react'

// Контекст для данных, предзагруженных на сервере (SSR)
// На сервере — заполняется из fetchPageData
// На клиенте — заполняется из window.__SSR_DATA__
export const SSRDataContext = createContext(null)

export const useSSRData = () => useContext(SSRDataContext)
