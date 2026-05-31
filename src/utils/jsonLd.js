/**
 * Хелперы для построения объектов JSON-LD (schema.org).
 * Все генераторы возвращают plain JS-объект — сериализация делается в
 * компоненте <JsonLd/>.
 */

export const SITE_URL = 'https://topdisc.ru'
export const SITE_NAME = 'TopDisc'
export const SITE_LEGAL_NAME = 'Top Disc'
export const SITE_LOGO = `${SITE_URL}/img/header/logo.png`

const ORG_PHONE = '+7-800-500-21-41'
const ORG_ADDRESS = {
  streetAddress: 'ул. Ставского, д. 4',
  addressLocality: 'Пенза',
  addressCountry: 'RU',
  postalCode: '440000',
}
const ORG_GEO = { latitude: 53.195041, longitude: 45.018434 }
const ORG_SAME_AS = []

function absUrl(path = '') {
  if (!path) return SITE_URL
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

function priceToStr(p) {
  const num = Number(p)
  if (!Number.isFinite(num) || num <= 0) return null
  return num.toFixed(2)
}

// ── Глобальные сущности (Organization + WebSite + SearchAction) ──
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_LEGAL_NAME,
    alternateName: SITE_NAME,
    url: SITE_URL,
    logo: SITE_LOGO,
    image: SITE_LOGO,
    sameAs: ORG_SAME_AS,
    contactPoint: [{
      '@type': 'ContactPoint',
      telephone: ORG_PHONE,
      contactType: 'customer service',
      areaServed: 'RU',
      availableLanguage: ['Russian'],
    }],
    address: {
      '@type': 'PostalAddress',
      ...ORG_ADDRESS,
    },
  }
}

export function webSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'ru-RU',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/catalog/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

// ── Хлебные крошки ─────────────────────────────────────────────
/**
 * @param {Array<{name: string, url?: string}>} items — последний может быть без url.
 */
export function breadcrumbSchema(items) {
  if (!Array.isArray(items) || !items.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      ...(item.url ? { item: absUrl(item.url) } : {}),
    })),
  }
}

// ── Товар ──────────────────────────────────────────────────────
/**
 * Минимальный набор полей: id, name, price.
 * Ожидаемые поля product:
 *   id, name, code, section_code, price, oldPrice, image|images[],
 *   description|preview_text, brand|properties[].name=='Бренд', quantity,
 *   currency (RUB по умолчанию), rating, reviews_count, sku|article
 */
export function productSchema(product, opts = {}) {
  if (!product || !product.name) return null
  const path = opts.path
    || (product.section_code && product.code ? `/catalog/${product.section_code}/${product.code}/` : '')
  const url = absUrl(path)

  const images = []
  if (Array.isArray(product.images)) images.push(...product.images.filter(Boolean).map(absUrl))
  if (product.image) images.push(absUrl(product.image))

  let brand = product.brand
  if (!brand && Array.isArray(product.properties)) {
    const p = product.properties.find((x) => x?.name === 'Бренд' || x?.code === 'BRAND')
    if (p) brand = p.value || p.text
  }

  const sku = product.sku || product.article
    || (Array.isArray(product.properties)
      ? (product.properties.find((p) => p?.name === 'Артикул')?.value)
      : null)
    || String(product.id || '')

  const priceStr = priceToStr(product.price)
  const inStock = Number(product.quantity) > 0

  const offers = priceStr ? {
    '@type': 'Offer',
    url,
    priceCurrency: product.currency || 'RUB',
    price: priceStr,
    availability: inStock
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@id': `${SITE_URL}/#organization` },
  } : undefined

  const description = product.description
    || product.preview_text
    || `Купить ${product.name} в интернет-магазине ${SITE_NAME}`

  const out = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.name,
    description,
    sku,
    url,
  }
  if (images.length) out.image = images.length === 1 ? images[0] : images
  if (brand) out.brand = { '@type': 'Brand', name: brand }
  if (offers) out.offers = offers

  const ratingValue = Number(product.rating)
  const reviewCount = Number(product.reviews_count || product.reviewCount)
  if (Number.isFinite(ratingValue) && ratingValue > 0 && Number.isFinite(reviewCount) && reviewCount > 0) {
    out.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ratingValue.toFixed(2),
      reviewCount,
      bestRating: '5',
      worstRating: '1',
    }
  }

  return out
}

// ── Список товаров (категория, бренд, поиск) ───────────────────
/**
 * @param {Array} products — список товаров (минимум name+price+code).
 * @param {{ path?: string, name?: string, description?: string }} opts
 */
export function itemListSchema(products, opts = {}) {
  if (!Array.isArray(products) || !products.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: opts.name,
    description: opts.description,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 50).map((p, idx) => {
      const path = p.section_code && p.code ? `/catalog/${p.section_code}/${p.code}/` : null
      return {
        '@type': 'ListItem',
        position: idx + 1,
        url: path ? absUrl(path) : undefined,
        name: p.name,
      }
    }),
  }
}

// ── Страница категории как CollectionPage ──────────────────────
export function collectionPageSchema({ name, description, path, breadcrumbs, itemList } = {}) {
  if (!name) return null
  const url = absUrl(path || '/')
  const out = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#webpage`,
    url,
    name,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    inLanguage: 'ru-RU',
  }
  if (description) out.description = description
  if (breadcrumbs) out.breadcrumb = breadcrumbs
  if (itemList) out.mainEntity = itemList
  return out
}

// ── Новость / статья ───────────────────────────────────────────
export function newsArticleSchema(news, { path } = {}) {
  if (!news || !news.name) return null
  const url = absUrl(path || (news.code ? `/company/news/${news.code}/` : '/company/news/'))
  const out = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': `${url}#article`,
    headline: news.name,
    mainEntityOfPage: url,
    url,
    inLanguage: 'ru-RU',
    publisher: { '@id': `${SITE_URL}/#organization` },
  }
  if (news.image) out.image = absUrl(news.image)
  if (news.preview_text) out.description = news.preview_text
  if (news.date) {
    const iso = toIsoDate(news.date)
    if (iso) {
      out.datePublished = iso
      out.dateModified = iso
    }
  }
  if (news.author) out.author = { '@type': 'Person', name: news.author }
  else out.author = { '@id': `${SITE_URL}/#organization` }
  return out
}

function toIsoDate(s) {
  if (!s) return null
  // Поддерживаем DD.MM.YYYY и ISO.
  const m = String(s).match(/^(\d{2})\.(\d{2})\.(\d{4})/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

// ── Контактная страница / магазин ──────────────────────────────
export function storeSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${SITE_URL}/contacts/#store`,
    name: SITE_LEGAL_NAME,
    image: SITE_LOGO,
    telephone: ORG_PHONE,
    url: `${SITE_URL}/contacts/`,
    address: { '@type': 'PostalAddress', ...ORG_ADDRESS },
    geo: { '@type': 'GeoCoordinates', ...ORG_GEO },
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
      opens: '09:00',
      closes: '21:00',
    }],
  }
}

export { absUrl }
