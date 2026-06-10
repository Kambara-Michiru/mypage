/* ===========================================================
   Michiru Kambara Portfolio — interactions
   1) JA / EN 言語切り替え（data-ja / data-en）
   2) スクロールフェードイン（reveal）
   3) モバイルメニュー
   =========================================================== */

(function () {
  'use strict';

  /* ---------- 1. 言語切り替え ---------- */
  var STORAGE_KEY = 'mk-lang';
  var langButtons = document.querySelectorAll('.lang-toggle button');
  var i18nNodes = document.querySelectorAll('[data-ja][data-en]');

  function applyLang(lang) {
    document.documentElement.lang = lang;

    i18nNodes.forEach(function (node) {
      var text = node.getAttribute('data-' + lang);
      if (text !== null) node.innerHTML = text;
    });

    langButtons.forEach(function (btn) {
      var active = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  langButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyLang(btn.getAttribute('data-lang'));
    });
  });

  // 初期言語：保存値 → ブラウザ設定 → ja
  var initial = 'ja';
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ja' || saved === 'en') {
      initial = saved;
    } else if ((navigator.language || '').toLowerCase().indexOf('en') === 0) {
      initial = 'en';
    }
  } catch (e) {}
  applyLang(initial);

  /* ---------- 2. スクロールフェードイン ---------- */
  var reveals = document.querySelectorAll('.reveal');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 3. モバイルメニュー ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var mobileNav = document.getElementById('mobile-nav');

  if (menuBtn && mobileNav) {
    function setMenu(open) {
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      mobileNav.hidden = !open;
    }
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    mobileNav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setMenu(false);
    });
  }

  /* ---------- 4. 写真ライトボックス ---------- */
  var frames = document.querySelectorAll('.photo-frame');
  var lb = document.getElementById('lightbox');

  if (lb && frames.length) {
    var lbImg = lb.querySelector('.lightbox-img');
    var lbCap = lb.querySelector('.lightbox-cap');
    var lbClose = lb.querySelector('.lightbox-close');
    var lastFocused = null;

    function openLightbox(frame) {
      var img = frame.querySelector('img');
      var figcap = frame.parentElement.querySelector('figcaption');
      lastFocused = document.activeElement;

      lbImg.src = frame.getAttribute('data-full') || img.src;
      lbImg.alt = img.alt || '';
      lbCap.textContent = figcap ? figcap.textContent.trim() : '';

      lb.hidden = false;
      document.body.style.overflow = 'hidden';
      void lb.offsetWidth; // 強制リフローでトランジションを確実に発火
      lb.classList.add('is-open');
      lbClose.focus();
    }

    function closeLightbox() {
      lb.classList.remove('is-open');
      document.body.style.overflow = '';
      window.setTimeout(function () {
        lb.hidden = true;
        lbImg.src = '';
      }, 300);
      if (lastFocused) lastFocused.focus();
    }

    frames.forEach(function (frame) {
      frame.addEventListener('click', function () { openLightbox(frame); });
    });
    lbClose.addEventListener('click', closeLightbox);
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lightbox-figure')) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lb.hidden) closeLightbox();
    });
  }
})();
