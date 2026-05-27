/**
 * Серверная предзагрузка данных для SSR.
 * Использует прямые axios-запросы без localStorage / browser API.
 */
import axios from 'axios'

const BITRIX_URL =
  (typeof process !== 'undefined' && process.env.VITE_BITRIX_REST_URL) ||
  'https://topdisc.ru/rest/28531/ky7kc0zinte6jb7e'

// На сервере /api/mobile/* → обращаемся напрямую к topdisc.ru
const FILTER_URL =
  (typeof process !== 'undefined' && process.env.VITE_FILTER_API_URL) ||
  'https://topdisc.ru/mobile/v1'

const api = axios.create({ baseURL: BITRIX_URL, timeout: 6000 })
const filterApi = axios.create({ baseURL: FILTER_URL, timeout: 6000 })

// Безопасный вызов: возвращает data или null при ошибке
async function safe(promise) {
  try {
    const res = await promise
    return res.data
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────
//  Главная страница  /
// ─────────────────────────────────────────────────────────────
async function fetchHome() {
  const [banners, forYou, popular, hurry, news] = await Promise.all([
    safe(api.get('/app_mobile.bigBaner.json')),
    safe(api.get('/app_mobile.forYou.json', { params: { limit: 20 } })),
    safe(api.get('/app_mobile.popularCategories.json', { params: { limit: 9 } })),
    safe(api.get('/app_mobile.hurryToBuy.json', { params: { limit: 20 } })),
    safe(api.get('/app_mobile.news.json', { params: { limit: 6 } })),
  ])
  return {
    type: 'home',
    banners: banners?.result || [],
    forYouProducts: forYou?.result || [],
    popularCategories: popular?.result || [],
    hurryToBuyProducts: hurry?.result?.data || [],
    news: news?.result || [],
  }
}

// ─────────────────────────────────────────────────────────────
//  Страница товара  /catalog/:cat/:prod/
// ─────────────────────────────────────────────────────────────
async function fetchProduct(categoryCode, productCode) {
  const [catData, codeData] = await Promise.all([
    safe(api.get('/app_mobile.categoryIdByCode.json', { params: { code: categoryCode } })),
    safe(api.get('/app_mobile.getProductIdByCode.json', { params: { code: productCode } })),
  ])

  const category = catData?.result?.error === 0 ? catData.result : null
  let product = null

  if (codeData?.result?.error === 0) {
    const productId = codeData.result.id
    const productData = await safe(
      api.get('/app_mobile.product.json', { params: { id: productId } })
    )
    product = productData?.result || null
  }

  return { type: 'product', category, product }
}

// ─────────────────────────────────────────────────────────────
//  Страница категории  /catalog/:cat/  /category/:cat/
// ─────────────────────────────────────────────────────────────
async function fetchCategory(categoryCode, searchParams) {
  const currentPage = parseInt(searchParams.get('PAGEN_1') || '1', 10)
  const sortOrder = searchParams.get('sort') || ''

  // Получаем категорию по коду
  const catData = await safe(
    api.get('/app_mobile.categoryIdByCode.json', { params: { code: categoryCode } })
  )
  if (!catData?.result || catData.result.error !== 0) {
    return { type: 'category', error: true }
  }
  const category = catData.result

  // Параллельно: дочерние категории + категории первого уровня
  const [childrenData, mainCatsData] = await Promise.all([
    safe(api.get('/app_mobile.categoryId.json', { params: { id: category.id } })),
    safe(api.get('/app_mobile.categoryFirst.json')),
  ])

  const children = childrenData?.result || []
  const mainCats = mainCatsData?.result || []

  // Определяем: это категория 1-го уровня или нет
  const isLevel1 = mainCats.some((c) => String(c.id) === String(category.id))

  let subcategories = []
  let products = []
  let filters = null
  let isProductListPage = false
  let totalPages = 1
  let childSubcategories = []
  let breadcrumbsPath = []

  // Строим хлебные крошки для уровня 2+
  if (!isLevel1) {
    // Ищем родителя в mainCats
    const parentMain = mainCats.find((mc) => {
      // Упрощённо: смотрим по полю section_id если оно есть
      return String(mc.id) === String(category.section_id)
    })
    if (parentMain) {
      breadcrumbsPath = [{ id: parentMain.id, name: parentMain.name, code: parentMain.code }]
    }
  }

  if (isLevel1 && children.length > 0) {
    // Показываем подкатегории
    subcategories = children
    isProductListPage = false
  } else {
    // Показываем товары
    isProductListPage = true
    childSubcategories = children

    const [filtersData, productsData] = await Promise.all([
      safe(filterApi.get(`/filter/4/${category.id}`)),
      safe(
        api.get('/app_mobile.product_list.json', {
          params: { cat: category.id, page: currentPage, prods: 20, sort: sortOrder },
        })
      ),
    ])

    filters = filtersData?.filter || null
    products = productsData?.result?.data || []
    totalPages = parseInt(productsData?.result?.pagination?.total_pages || '1', 10)
  }

  return {
    type: 'category',
    categoryId: categoryCode,
    mainCategory: category,
    breadcrumbsPath,
    subcategories,
    products,
    filters,
    isProductListPage,
    totalPages,
    childSubcategories,
    categoryDescription: category.text || subcategories[0]?.text || '',
  }
}

// ─────────────────────────────────────────────────────────────
//  Список новостей  /company/news/
// ─────────────────────────────────────────────────────────────
async function fetchNewsList(searchParams) {
  const currentPage = parseInt(searchParams.get('PAGEN_1') || '1', 10)
  const data = await safe(
    api.get('/app_mobile.newsList.json', { params: { limit: 20, page: currentPage } })
  )
  return {
    type: 'newsList',
    news: data?.result?.data || [],
    totalPages: parseInt(data?.result?.pagination?.total_pages || '1', 10),
  }
}

// ─────────────────────────────────────────────────────────────
//  Детальная страница новости  /company/news/:code/
// ─────────────────────────────────────────────────────────────
async function fetchNewsDetail(newsCode) {
  // API не поддерживает поиск по code напрямую — нужно получить список и найти ID
  const listData = await safe(
    api.get('/app_mobile.newsList.json', { params: { limit: 100, page: 1 } })
  )
  const newsList = listData?.result?.data || []
  const found = newsList.find((n) => n.code === newsCode)

  if (!found) return { type: 'newsDetail', newsItem: null }

  const detailData = await safe(
    api.get('/app_mobile.newsDetail.json', { params: { id: found.id } })
  )
  return {
    type: 'newsDetail',
    newsItem: detailData?.result || null,
  }
}

// ─────────────────────────────────────────────────────────────
//  Инфо-страницы  /tradein/  /pravila/  /dogovor-oferty/ ...
// ─────────────────────────────────────────────────────────────
// Карта: URL-путь → символьный код в Bitrix (app_mobile.posts.json?code=...)
const INFO_CODES = {
  '/suppliers/': 'postavshchikam',
  '/opt/': 'optovikam',
  '/vacancy/': 'vakansii',
  '/club-card/': 'klub-karta',
  '/obmen-i-vozvraty/': 'obmen-i-vozvraty',
  '/tradein/': 'treyd-in',
  '/low-price/': 'garantiya-nizkoj-ceny',
  '/pravila/': 'pravila',
  '/politika-konfidentsialnosti/': 'politika-konfidentsialnosti',
  '/dogovor-oferty/': 'dogovor-oferty',
}

async function fetchInfo(code) {
  const data = await safe(api.get('/app_mobile.posts.json', { params: { code } }))
  const result = data?.result?.data
  return {
    type: 'info',
    code,
    content: result?.text || result?.detail_text || result?.preview_text || null,
    title: result?.name || null,
    detail_picture: result?.detail_picture || null,
    preview_picture: result?.preview_picture || null,
    preview_text: result?.preview_text || null,
    detail_text: result?.detail_text || null,
  }
}

async function fetchInfoTradein() {
  const [infoData, tradeData] = await Promise.all([
    safe(api.get('/app_mobile.posts.json', { params: { code: 'treyd-in' } })),
    safe(api.get('/app_mobile.tradein.json')),
  ])
  const result = infoData?.result?.data
  return {
    type: 'info',
    code: 'treyd-in',
    content: result?.detail_text || result?.text || null,
    title: result?.name || null,
    detail_picture: result?.detail_picture || null,
    preview_picture: result?.preview_picture || null,
    preview_text: result?.preview_text || null,
    detail_text: result?.detail_text || null,
    tradeData: tradeData?.result?.data || null,
  }
}

// ─────────────────────────────────────────────────────────────
//  Главная функция — выбирает нужный fetcher по URL
// ─────────────────────────────────────────────────────────────
export async function fetchPageData(url) {
  const [urlPath, query] = url.split('?')
  const searchParams = new URLSearchParams(query || '')

  // Главная
  if (urlPath === '/') {
    return fetchHome()
  }

  // Товар: /catalog/:cat/:prod/  или /catalog_oth/:cat/:prod/
  const productMatch = urlPath.match(/^\/(?:catalog|catalog_oth)\/([^/]+)\/([^/]+)\/$/)
  if (productMatch) {
    return fetchProduct(productMatch[1], productMatch[2])
  }

  // Категория: /catalog/:cat/  /category/:cat/  /catalog_oth/:cat/
  const categoryMatch = urlPath.match(/^\/(?:catalog|catalog_oth|category)\/([^/]+)\/$/)
  if (categoryMatch) {
    return fetchCategory(categoryMatch[1], searchParams)
  }

  // Детальная новость: /company/news/:code/
  const newsDetailMatch = urlPath.match(/^\/company\/news\/([^/]+)\/$/)
  if (newsDetailMatch) {
    return fetchNewsDetail(newsDetailMatch[1])
  }

  // Список новостей: /company/news/
  if (urlPath === '/company/news/' || urlPath.startsWith('/company/news/')) {
    return fetchNewsList(searchParams)
  }

  // Инфо-страницы: /tradein/  /pravila/ и т.д.
  if (INFO_CODES[urlPath]) {
    if (urlPath === '/tradein/') return fetchInfoTradein()
    return fetchInfo(INFO_CODES[urlPath])
  }

  // Остальные страницы — данных нет, только shell
  return null
}
