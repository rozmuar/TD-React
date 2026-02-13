document.querySelectorAll('.catalog__main-select').forEach(select => {
  const btn = select.querySelector('.select__btn');
  const list = select.querySelector('.select__list');
  const value = select.querySelector('.select__value');

  /* открытие / закрытие */
  btn.addEventListener('click', e => {
    select.classList.toggle('open');
  });

  /* выбор пункта */
  list.addEventListener('click', e => {
    const option = e.target.closest('.select__option');
    if (!option) return;

    /* меняем «текущий» текст */
    select.querySelector('.select__current').textContent = option.textContent;

    /* hidden-input для формы */
    value.value = option.dataset.value;

    /* подсветка активного */
    list.querySelectorAll('.select__option').forEach(o => o.classList.remove('active'));
    option.classList.add('active');

    /* закрываем список */
    select.classList.remove('open');
  });

  /* клик вне селекта – закрываем */
  document.addEventListener('click', e => {
    if (!select.contains(e.target)) {
      select.classList.remove('open');
    }
  });
});
document.addEventListener('DOMContentLoaded', () => {
  const gridRadio = document.getElementById('view-cards'); // «карточки»
  const listRadio = document.getElementById('view-list');  // «список»
  const list = document.querySelector('.catalog__main-list');

  // функция, которая включает/выключает класс .list-view
  const updateView = () => {
    // На экранах <768 — всегда сетка, переключатели игнорируем
    if (window.innerWidth < 768) {
      list.classList.remove('list-view');
      gridRadio.checked = true;
      return;
    }

    if (listRadio.checked) {
      list.classList.add('list-view');
    } else {
      list.classList.remove('list-view');
    }
  };

  // слушаем смену радиокнопок
  gridRadio.addEventListener('change', updateView);
  listRadio.addEventListener('change', updateView);

  // реагируем на ресайз окна
  window.addEventListener('resize', updateView);

  // запускаемся сразу при загрузке
  updateView();
});
document.addEventListener('DOMContentLoaded', () => {

  // перебираем КАЖДЫЙ слайдер-блок
  document.querySelectorAll('.hits-slider-wrapper').forEach(wrapper => {

    const swiperEl = wrapper.querySelector('.hits__swiper');           // текущий <div class="swiper ...">
    const nextBtn = wrapper.querySelector('.hits__nav--next');        // стрелка «вперёд» внутри ЭТОГО блока
    const prevBtn = wrapper.querySelector('.hits__nav--prev');        // стрелка «назад»  ───//───

    // если по какой-то причине swiperEl не найден — пропускаем
    if (!swiperEl) return;

    new Swiper(swiperEl, {
      speed: 400,
      spaceBetween: 8,
      navigation: {
        nextEl: nextBtn,
        prevEl: prevBtn,
      },
      slidesPerView: 2,
      breakpoints: {
        576: { slidesPerView: 3, spaceBetween: 16 },
        992: { slidesPerView: 4.5, spaceBetween: 37 },
      },
      watchOverflow: true      // отключает стрелки, если карточек < slidesPerView
    });

  });

});
document.addEventListener('DOMContentLoaded', () => {
  new Swiper('.hits-green__swiper', {
    speed: 400,
    spaceBetween: 8,
    navigation: {
      nextEl: '.hits-green__nav--next',
      prevEl: '.hits-green__nav--prev',
    },
    slidesPerView: 2,          // мобильный default
    breakpoints: {
      576: { slidesPerView: 3, spaceBetween: 10 },
      992: { slidesPerView: 4, spaceBetween: 10 }
    },
    watchOverflow: true        // автодеактив стрелок, если слайдов мало
  });
});
document.addEventListener('DOMContentLoaded', () => {

  /* ───── 1. mobile toggle ───── */
  const headerBtn = document.querySelector('[data-specs-toggle]');

  if (headerBtn) {                                 // есть кнопка?
    const body = document.querySelector('.specs__body');
    const arrow = headerBtn.querySelector('.specs__arrow');

    headerBtn.addEventListener('click', () => {
      if (window.innerWidth < 769) {
        body?.classList.toggle('is-open');         // body может быть null → ?
        arrow?.classList.toggle('is-open');
      }
    });
  }

  /* ───── 2. desktop “Все характеристики” ───── */
  const moreBtn = document.querySelector('[data-specs-more]');

  if (moreBtn) {                                   // есть кнопка?
    const extraRows = document.querySelectorAll('.specs__row--extra');

    moreBtn.addEventListener('click', () => {
      const opened = moreBtn.classList.toggle('is-open');
      extraRows.forEach(r => r.style.display = opened ? 'flex' : 'none');
      moreBtn.textContent = opened ? 'Скрыть' : 'Все характеристики';
    });
  }

});

document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('.product-gallery').forEach(gallery => {

    const mainEl = gallery.querySelector('.product-gallery__swiper');
    const thumbsEl = gallery.querySelector('.product-gallery__thumbs');
    const prevBtn = gallery.querySelector('.gallery-prev');
    const nextBtn = gallery.querySelector('.gallery-next');

    /* 1. создаём slider-thumbs ТОЛЬКО на десктопе */
    let thumbsSwiper = null;
    if (window.innerWidth >= 769) {
      thumbsSwiper = new Swiper(thumbsEl, {
        direction: 'vertical',
        slidesPerView: 5,
        spaceBetween: 16,
        watchSlidesProgress: true,
      });
    }

    /* 2. основной слайдер */
    new Swiper(mainEl, {
      speed: 400,
      spaceBetween: 16,
      navigation: {
        nextEl: nextBtn,
        prevEl: prevBtn,
      },
      pagination: {
        el: mainEl.querySelector('.swiper-pagination'),
        clickable: true,
      },
      thumbs: thumbsSwiper ? { swiper: thumbsSwiper } : {},  // связь только на ПК
    });

  });

});
/* переключатели цвета / памяти */
document.addEventListener('click', e => {
  const btn = e.target.closest('.product__switch');
  if (!btn) return;

  const group = btn.parentElement;           // .product__switches
  group.querySelectorAll('.product__switch').forEach(b => b.classList.remove('is-active'));
  btn.classList.add('is-active');

  /* при необходимости можно получить выбранное значение */
  // const value = btn.dataset.value;
  // const type  = group.dataset.switch; // 'color' or 'storage'
});

document.addEventListener('click', e => {
  // открыть
  const openBtn = e.target.closest('[data-filters-open]');
  if (openBtn) {
    document.querySelector('[data-filters]').classList.add('is-open');

    document.body.classList.add('no-scroll');
    return;
  }

  // закрыть
  const closeBtn = e.target.closest('[data-filters-close]');
  if (closeBtn) {
    document.querySelector('[data-filters]').classList.remove('is-open');

    document.body.classList.remove('no-scroll');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  new Swiper('.brands__slider', {
    speed: 400,
    spaceBetween: 24,
    slidesPerGroup: 5,              // листаем «по экрану» на ПК
    grid: { rows: 2, fill: 'row' }, // две строки

    navigation: {
      nextEl: '.brands__arrow--next',
      prevEl: '.brands__arrow--prev'
    },

    breakpoints: {
      // мобильный: 1 ряд, свайп пальцем, стрелок всё равно нет (скрыты в CSS)
      0: {
        slidesPerView: 2.5,
        spaceBetween: 8,
        slidesPerGroup: 2,
        grid: { rows: 1 }
      },

      // маленький планшет
      480: {
        slidesPerView: 3,
        spaceBetween: 16,
        slidesPerGroup: 3,
        grid: { rows: 1 }
      },

      // ≥768 px — 2 ряда по макету
      768: {
        slidesPerView: 4,
        spaceBetween: 20,
        slidesPerGroup: 4,
        grid: { rows: 2 }
      },

      // десктоп ≥1200 px
      1200: {
        slidesPerView: 5,
        spaceBetween: 20,
        slidesPerGroup: 5,
        grid: { rows: 2 }
      }
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  new Swiper('.reviews__slider', {
    slidesPerView: 3,
    spaceBetween: 49,
    navigation: {
      nextEl: '.reviews__arrow--next',
      prevEl: '.reviews__arrow--prev'
    },
    breakpoints: {
      0: { slidesPerView: 1, spaceBetween: 16 },
      600: { slidesPerView: 2, spaceBetween: 24 },
      1024: { slidesPerView: 3, spaceBetween: 49 }
    }
  });
});
document.addEventListener('DOMContentLoaded', () => {

  const swiper = new Swiper('.hero-slider__swiper', {
    slidesPerView: 1,
    speed: 450,

    navigation: {
      nextEl: '.hero-slider-next',
      prevEl: '.hero-slider-prev'
    },

    pagination: {
      el: '.swiper-pagination',
      clickable: true
    }
  });
});