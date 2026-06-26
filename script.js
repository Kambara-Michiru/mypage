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

  /* ---------- 3b. スクロール連動ナビ（scrollspy） ---------- */
  var spyLinks = document.querySelectorAll('.nav a[href^="#"], .mobile-nav a[href^="#"]');
  var spyTargets = document.querySelectorAll('main section[id], .site-footer[id]');
  var ABOUT_CLUSTER = ['about', 'path', 'strengths', 'thesis'];

  var progressBar = document.querySelector('.scroll-progress > span');

  if (spyLinks.length && spyTargets.length) {
    var navTrigger = document.querySelector('.nav-trigger');
    var currentId = null;

    function setCurrent(id) {
      if (id === currentId) return;
      currentId = id;
      spyLinks.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-current', on);
        if (on) { a.setAttribute('aria-current', 'true'); }
        else { a.removeAttribute('aria-current'); }
      });
      if (navTrigger) {
        navTrigger.classList.toggle('is-current', ABOUT_CLUSTER.indexOf(id) >= 0);
      }
    }

    // 画面上から35%のラインを越えている最後のセクションを「現在地」とする。
    // スクロールイベント由来で算出するため、プログラム的スクロールでも確実に追従する。
    function computeCurrent() {
      var line = window.scrollY + window.innerHeight * 0.35;
      var id = spyTargets[0].id;
      spyTargets.forEach(function (t) {
        if (!t.getClientRects().length) return; // 非表示（hidden）セクションは除外
        if (t.getBoundingClientRect().top + window.scrollY <= line) id = t.id;
      });
      setCurrent(id);
    }

    // スクロール進捗（Focus+Context）：全体に対する現在位置を細いバーで示す
    function updateProgress() {
      if (!progressBar) return;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      progressBar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { computeCurrent(); updateProgress(); ticking = false; });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    computeCurrent();
    updateProgress();
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

  /* ---------- 5. ポインタ追従モーション（A: Heroパララックス / C: カードチルト） ---------- */
  // 細かいポインタを持つ端末のみ＆モーション低減OFFのときだけ有効化
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (finePointer && !reduce) {
    // --- A. ヒーローのポインタ・パララックス ---
    var hero = document.querySelector('.hero');
    var heroDeco = document.querySelector('.hero-deco');
    if (hero && heroDeco) {
      var curX = 0, curY = 0, tgtX = 0, tgtY = 0, heroRaf = null;
      var AMP = 24; // 最大変位(px)

      function heroLoop() {
        curX += (tgtX - curX) * 0.08;
        curY += (tgtY - curY) * 0.08;
        heroDeco.style.transform = 'translate(' + (curX * AMP).toFixed(2) + 'px,' + (curY * AMP).toFixed(2) + 'px)';
        if (Math.abs(tgtX - curX) > 0.0008 || Math.abs(tgtY - curY) > 0.0008) {
          heroRaf = requestAnimationFrame(heroLoop);
        } else {
          heroRaf = null;
        }
      }
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        tgtX = ((e.clientX - r.left) / r.width - 0.5) * 2;
        tgtY = ((e.clientY - r.top) / r.height - 0.5) * 2;
        if (!heroRaf) heroRaf = requestAnimationFrame(heroLoop);
      });
      hero.addEventListener('pointerleave', function () {
        tgtX = 0; tgtY = 0;
        if (!heroRaf) heroRaf = requestAnimationFrame(heroLoop);
      });
    }

    // --- C. カードのチルト / 磁力 ---
    var tiltEls = document.querySelectorAll('.link-card, .thesis-feature, .photo-frame, .illus-frame');
    var MAX_TILT = 5; // deg

    tiltEls.forEach(function (el) {
      el.classList.add('tilt-target');
      var raf = null, nx = 0, ny = 0;

      function applyTilt() {
        raf = null;
        el.style.transform =
          'perspective(820px) rotateY(' + (nx * MAX_TILT).toFixed(2) + 'deg) rotateX(' +
          (-ny * MAX_TILT).toFixed(2) + 'deg) translateY(-4px)';
      }
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        nx = (e.clientX - r.left) / r.width - 0.5;
        ny = (e.clientY - r.top) / r.height - 0.5;
        if (!raf) raf = requestAnimationFrame(applyTilt);
      });
      el.addEventListener('pointerleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        el.style.transform = '';
      });
    });

    // --- D. ヒーロー概観アンカーの Fisheye（Furnas DOI の直感：焦点に近い項目ほど拡大） ---
    var dock = document.querySelector('.hero-explore');
    if (dock) {
      var dockItems = Array.prototype.slice.call(dock.querySelectorAll('a'));
      var DOCK_RADIUS = 170;  // 焦点からの影響半径 D
      var DOCK_AMP = 0.45;    // 最大拡大率（API 相当のピーク）
      var dockRaf = null, dockX = null;

      function dockApply() {
        dockRaf = null;
        dockItems.forEach(function (it) {
          var r = it.getBoundingClientRect();
          var cx = r.left + r.width / 2;
          var d = Math.abs(dockX - cx);
          var doi = Math.max(0, 1 - d / DOCK_RADIUS);   // 関心度 = 1 − 距離/半径
          var s = 1 + DOCK_AMP * doi;
          it.style.transform = 'scale(' + s.toFixed(3) + ')';
          it.style.zIndex = doi > 0.5 ? '2' : '1';
        });
      }
      dock.addEventListener('pointermove', function (e) {
        dockX = e.clientX;
        if (!dockRaf) dockRaf = requestAnimationFrame(dockApply);
      });
      dock.addEventListener('pointerleave', function () {
        if (dockRaf) { cancelAnimationFrame(dockRaf); dockRaf = null; }
        dockItems.forEach(function (it) { it.style.transform = ''; it.style.zIndex = ''; });
      });
    }
  }
})();
