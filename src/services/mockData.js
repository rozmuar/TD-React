// Mock data для разработки и тестирования
// В production эти данные будут приходить из API

export const mockCategories = [
  {
    id: 1,
    name: 'Смартфоны',
    image: '/img/category/smartphones.jpg',
    description: 'Широкий выбор смартфонов от ведущих производителей',
    subcategories: [
      { id: 11, name: 'iPhone', productCount: 25, image: '/img/subcategory/iphone.jpg' },
      { id: 12, name: 'Samsung', productCount: 30, image: '/img/subcategory/samsung.jpg' },
      { id: 13, name: 'Xiaomi', productCount: 40, image: '/img/subcategory/xiaomi.jpg' },
    ],
  },
  {
    id: 2,
    name: 'Ноутбуки',
    image: '/img/category/laptops.jpg',
    description: 'Ноутбуки для работы, учебы и игр',
    subcategories: [
      { id: 21, name: 'MacBook', productCount: 15, image: '/img/subcategory/macbook.jpg' },
      { id: 22, name: 'Gaming ноутбуки', productCount: 20, image: '/img/subcategory/gaming.jpg' },
    ],
  },
  {
    id: 3,
    name: 'Наушники',
    image: '/img/category/headphones.jpg',
    description: 'Проводные и беспроводные наушники',
    subcategories: [
      { id: 31, name: 'TWS наушники', productCount: 35, image: '/img/subcategory/tws.jpg' },
      { id: 32, name: 'Накладные', productCount: 25, image: '/img/subcategory/overhead.jpg' },
    ],
  },
  {
    id: 4,
    name: 'Планшеты',
    image: '/img/category/tablets.jpg',
    description: 'Планшеты для любых задач',
    subcategories: [],
  },
  {
    id: 5,
    name: 'Аксессуары',
    image: '/img/category/accessories.jpg',
    description: 'Чехлы, защитные стекла и другие аксессуары',
    subcategories: [],
  },
  {
    id: 6,
    name: 'Умные часы',
    image: '/img/category/smartwatches.jpg',
    description: 'Смарт-часы и фитнес-браслеты',
    subcategories: [],
  },
]

export const mockProducts = [
  {
    id: 1,
    name: 'iPhone 15 Pro Max 256GB',
    price: 129990,
    oldPrice: 139990,
    discount: 7,
    image: '/img/product/iphone/iphone-15-pro-max.jpg',
    images: [
      '/img/product/iphone/iphone-15-pro-max.jpg',
      '/img/product/iphone/iphone-15-pro-max-2.jpg',
      '/img/product/iphone/iphone-15-pro-max-3.jpg',
    ],
    inStock: true,
    rating: 5,
    reviewsCount: 125,
    description:
      'Новейший флагманский смартфон от Apple с процессором A17 Pro, титановым корпусом и улучшенной камерой. Идеальное устройство для работы и развлечений.',
    specifications: {
      'Диагональ экрана': '6.7"',
      'Процессор': 'A17 Pro',
      'Оперативная память': '8 ГБ',
      'Встроенная память': '256 ГБ',
      'Камера': '48 Мп + 12 Мп + 12 Мп',
      'Батарея': '4422 мАч',
      'Операционная система': 'iOS 17',
    },
    category: 1,
    subcategory: 11,
  },
  {
    id: 2,
    name: 'Samsung Galaxy S24 Ultra 512GB',
    price: 119990,
    oldPrice: null,
    discount: 0,
    image: '/img/product/samsung/s24-ultra.jpg',
    images: ['/img/product/samsung/s24-ultra.jpg'],
    inStock: true,
    rating: 5,
    reviewsCount: 89,
    description:
      'Топовый смартфон от Samsung с S Pen, мощным процессором Snapdragon 8 Gen 3 и превосходной камерой.',
    specifications: {
      'Диагональ экрана': '6.8"',
      'Процессор': 'Snapdragon 8 Gen 3',
      'Оперативная память': '12 ГБ',
      'Встроенная память': '512 ГБ',
      'Камера': '200 Мп + 50 Мп + 12 Мп + 10 Мп',
      'Батарея': '5000 мАч',
      'Операционная система': 'Android 14',
    },
    category: 1,
    subcategory: 12,
  },
  {
    id: 3,
    name: 'Xiaomi 14 Pro 512GB',
    price: 89990,
    oldPrice: 99990,
    discount: 10,
    image: '/img/product/xiaomi/14-pro.jpg',
    images: ['/img/product/xiaomi/14-pro.jpg'],
    inStock: true,
    rating: 4,
    reviewsCount: 67,
    description:
      'Флагманский смартфон Xiaomi с камерой Leica, процессором Snapdragon 8 Gen 3 и быстрой зарядкой 120 Вт.',
    specifications: {
      'Диагональ экрана': '6.73"',
      'Процессор': 'Snapdragon 8 Gen 3',
      'Оперативная память': '16 ГБ',
      'Встроенная память': '512 ГБ',
      'Камера': '50 Мп + 50 Мп + 50 Мп',
      'Батарея': '4880 мАч',
      'Операционная система': 'Android 14',
    },
    category: 1,
    subcategory: 13,
  },
  {
    id: 4,
    name: 'MacBook Pro 14" M3 Pro 512GB',
    price: 249990,
    oldPrice: null,
    discount: 0,
    image: '/img/product/macbook/macbook-pro-14.jpg',
    images: ['/img/product/macbook/macbook-pro-14.jpg'],
    inStock: true,
    rating: 5,
    reviewsCount: 45,
    description:
      'Профессиональный ноутбук от Apple с чипом M3 Pro, Liquid Retina XDR дисплеем и невероятной производительностью.',
    specifications: {
      'Диагональ экрана': '14.2"',
      'Процессор': 'Apple M3 Pro',
      'Оперативная память': '18 ГБ',
      'SSD': '512 ГБ',
      'Видеокарта': 'Интегрированная',
      'Вес': '1.6 кг',
      'Операционная система': 'macOS Sonoma',
    },
    category: 2,
    subcategory: 21,
  },
  {
    id: 5,
    name: 'AirPods Pro 2-го поколения',
    price: 24990,
    oldPrice: 27990,
    discount: 11,
    image: '/img/product/airpods/airpods-pro-2.jpg',
    images: ['/img/product/airpods/airpods-pro-2.jpg'],
    inStock: true,
    rating: 5,
    reviewsCount: 234,
    description:
      'Беспроводные наушники с активным шумоподавлением, пространственным звуком и зарядным кейсом MagSafe.',
    specifications: {
      'Тип': 'TWS наушники',
      'Шумоподавление': 'Да',
      'Время работы': 'До 6 часов',
      'Кейс': 'До 30 часов',
      'Подключение': 'Bluetooth 5.3',
      'Водозащита': 'IPX4',
    },
    category: 3,
    subcategory: 31,
  },
  {
    id: 6,
    name: 'Samsung Galaxy Buds2 Pro',
    price: 14990,
    oldPrice: null,
    discount: 0,
    image: '/img/product/samsung/buds2-pro.jpg',
    images: ['/img/product/samsung/buds2-pro.jpg'],
    inStock: true,
    rating: 4,
    reviewsCount: 156,
    description:
      'Премиальные TWS наушники от Samsung с интеллектуальным шумоподавлением и 360 Audio.',
    specifications: {
      'Тип': 'TWS наушники',
      'Шумоподавление': 'Да',
      'Время работы': 'До 5 часов',
      'Кейс': 'До 18 часов',
      'Подключение': 'Bluetooth 5.3',
      'Водозащита': 'IPX7',
    },
    category: 3,
    subcategory: 31,
  },
  {
    id: 7,
    name: 'iPad Pro 12.9" M2 256GB',
    price: 134990,
    oldPrice: null,
    discount: 0,
    image: '/img/product/ipad/ipad-pro-12.jpg',
    images: ['/img/product/ipad/ipad-pro-12.jpg'],
    inStock: false,
    rating: 5,
    reviewsCount: 78,
    description:
      'Профессиональный планшет с чипом M2, ProMotion дисплеем и поддержкой Apple Pencil 2.',
    specifications: {
      'Диагональ экрана': '12.9"',
      'Процессор': 'Apple M2',
      'Оперативная память': '8 ГБ',
      'Встроенная память': '256 ГБ',
      'Камера': '12 Мп + 10 Мп',
      'Батарея': '10758 мАч',
      'Операционная система': 'iPadOS 17',
    },
    category: 4,
    subcategory: null,
  },
  {
    id: 8,
    name: 'Apple Watch Series 9 45mm',
    price: 49990,
    oldPrice: 54990,
    discount: 9,
    image: '/img/product/apple-watch/series-9.jpg',
    images: ['/img/product/apple-watch/series-9.jpg'],
    inStock: true,
    rating: 5,
    reviewsCount: 112,
    description:
      'Умные часы от Apple с ярким дисплеем, мощным процессором S9 и расширенными функциями для здоровья.',
    specifications: {
      'Размер корпуса': '45 мм',
      'Процессор': 'S9',
      'Дисплей': 'Always-On Retina',
      'Водозащита': 'WR50',
      'Время работы': 'До 18 часов',
      'Датчики': 'ЭКГ, Пульсоксиметр',
    },
    category: 6,
    subcategory: null,
  },
]

// Функции для работы с mock данными
export const getMockCategories = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: mockCategories })
    }, 500)
  })
}

export const getMockCategoryById = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const category = mockCategories.find((cat) => cat.id === parseInt(id))
      if (category) {
        resolve({ data: category })
      } else {
        reject(new Error('Category not found'))
      }
    }, 500)
  })
}

export const getMockProducts = (params = {}) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredProducts = [...mockProducts]

      if (params.category) {
        filteredProducts = filteredProducts.filter(
          (p) => p.category === parseInt(params.category)
        )
      }

      if (params.subcategory) {
        filteredProducts = filteredProducts.filter(
          (p) => p.subcategory === parseInt(params.subcategory)
        )
      }

      if (params.limit) {
        filteredProducts = filteredProducts.slice(0, params.limit)
      }

      resolve({ data: filteredProducts })
    }, 500)
  })
}

export const getMockProductById = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const product = mockProducts.find((p) => p.id === parseInt(id))
      if (product) {
        resolve({ data: product })
      } else {
        reject(new Error('Product not found'))
      }
    }, 500)
  })
}
