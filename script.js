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
  var ABOUT_CLUSTER = ['about', 'network', 'path', 'strengths', 'thesis'];

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

    // ヒーローのスクロール連動：緩く縮小・フェードして About へ受け渡す
    var heroInner2 = document.querySelector('.hero-inner');
    function updateHero() {
      if (!heroInner2 || reduce) return;
      var t = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.9)));
      heroInner2.style.opacity = (1 - t * 0.55).toFixed(3);
      heroInner2.style.transform = 'translateY(' + (t * -26).toFixed(1) + 'px) scale(' + (1 - t * 0.045).toFixed(4) + ')';
      heroInner2.style.transformOrigin = 'left top';
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { computeCurrent(); updateProgress(); updateHero(); ticking = false; });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    computeCurrent();
    updateProgress();
    updateHero();
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

/* ===========================================================
   6. 「私を構成する要素」フォースグラフ（自前Verlet＋SVG）
   =========================================================== */
(function () {
  'use strict';
  var section = document.getElementById('network');
  if (!section) return;
  var svg = section.querySelector('.network-svg');
  if (!svg || !('createElementNS' in document)) return;

  var SVGNS = 'http://www.w3.org/2000/svg';
  var W = 760, H = 520, PAD = 44;

  // --- データ（グラフと SR 等価リストの単一ソース） ---
  var NODES = [
    { id: 'me',        cat: 'core',     r: 24, ja: '神原みちる', en: 'Michiru Kambara', dja: '認知科学とエンジニアリングの両面から、あたたかいテクノロジーを探究しています。', den: 'Exploring warm technology from both cognitive science and engineering.' },
    { id: 'curiosity', cat: 'core',     r: 15, ja: '面白がる力', en: 'Curiosity', dja: '「面白い」と思ったことを具体化し、実行に移す原動力。', den: 'The drive to give shape to what I find interesting and carry it out.' },
    { id: 'psy',       cat: 'core',     r: 18, ja: '心理情報学', en: 'Psychoinformatics', dja: '認知科学と情報科学の交差点に立つ、私の専門。', den: 'My specialty, standing where cognitive science meets information science.' },
    { id: 'cog',       cat: 'domain',   r: 14, ja: '認知科学', en: 'Cognitive science', dja: '神経科学・認知心理学から、注意・記憶・意識といった心の仕組みを学ぶ。', den: 'Studying how the mind handles attention, memory, and consciousness.' },
    { id: 'inf',       cat: 'domain',   r: 14, ja: '情報科学', en: 'Information science', dja: '文系から理転し、工学的理解まで踏み込んでAIの内部を学ぶ。', den: 'I switched into the sciences to understand what happens inside AI.' },
    { id: 'trust',     cat: 'domain',   r: 16, ja: '人とAIの信頼', en: 'Human–AI trust', dja: '人はどんな条件でAIの助言を受け入れ、信頼するのか。', den: 'Under what conditions do people accept and trust AI advice?' },
    { id: 'trust2',    cat: 'domain',   r: 13, ja: '認知的/感情的信頼', en: 'Cognitive & affective trust', dja: '「信頼」を、論理に向く認知的信頼と情緒に向く感情的信頼に切り分ける。', den: 'Splitting trust into the cognitive and the affective.' },
    { id: 'thesis',    cat: 'domain',   r: 14, ja: '卒業研究', en: 'Thesis research', dja: '意思決定場面でのAI助言受容と信頼形成を扱う卒業研究。', den: 'My thesis on AI advice-taking and trust formation in decisions.' },
    { id: 'hri',       cat: 'domain',   r: 16, ja: 'HRI / 対人ロボット', en: 'HRI / social robots', dja: '画面を越え、身体をもつロボットとの相互作用へ。', den: 'Beyond the screen, toward interaction with embodied robots.' },
    { id: 'warm',      cat: 'value',    r: 16, ja: 'あたたかいテクノロジー', en: 'Warm technology', dja: '効率だけでなく、やすらぎとつながりを守る技術。', den: 'Technology that protects calm and connection, not only efficiency.' },
    { id: 'attn',      cat: 'value',    r: 13, ja: '注意経済への問題意識', en: 'Attention-economy critique', dja: '人の注意を奪い合う設計への危機感が、出発点。', den: 'My starting point: unease at designs that fight for our attention.' },
    { id: 'dwb',       cat: 'value',    r: 14, ja: 'デジタルウェルビーイング / LFDA', en: 'Digital wellbeing / LFDA', dja: 'テクノロジーと幸せに生きることを掲げる学生メディアを創立・運営。', den: 'I founded and run a student media outlet on digital wellbeing.' },
    { id: 'happy',     cat: 'value',    r: 12, ja: '幸福（副専攻）', en: 'Happiness studies', dja: '副専攻で心理学・社会学・哲学から「幸福とは何か」を学ぶ。', den: 'In my minor, exploring what happiness is across the humanities.' },
    { id: 'debate',    cat: 'activity', r: 13, ja: '即興型英語ディベート', en: 'Parliamentary debate', dja: '3年間続け、社会課題を構造から捉える視点を養った。', den: 'Three years of debate sharpened a structural view of social issues.' },
    { id: 'basket',    cat: 'activity', r: 12, ja: 'バスケ', en: 'Basketball', dja: '13年間。技術以上にチームワークとリーダーシップを学んだ。', den: '13 years — learning teamwork and leadership beyond skill.' },
    { id: 'create',    cat: 'activity', r: 13, ja: '創造 / ポッドキャスト', en: 'Creation / podcast', dja: 'ゆるポッドキャストなど、面白いを形にして発信する。', den: 'Giving shape to ideas — like an independent podcast.' },
    { id: 'kaira',     cat: 'activity', r: 13, ja: 'KaiRA / RAG / Agentic AI', en: 'KaiRA · RAG · Agentic AI', dja: 'KaiRAでRAG・Agentic AIを実装し、情報科学を手で確かめる。', den: 'Building RAG and agentic-AI systems hands-on at KaiRA.' },
    { id: 'abroad',    cat: 'future',   r: 13, ja: '留学 / tech policy lab', en: 'Study abroad / policy lab', dja: '留学先のtech policy labで、先端AI規制の議論に参加。', den: 'In a tech-policy lab abroad, joining debates on frontier AI regulation.' },
    { id: 's2s',       cat: 'future',   r: 15, ja: '画面から空間へ', en: 'From screen to space', dja: 'スクリーンの内側から、人の生活空間へ。', den: 'From inside the screen out into people’s lived spaces.' },
    { id: 'robot',     cat: 'future',   r: 14, ja: '対人ロボットの実装', en: 'Building social robots', dja: '配置・動線・非言語の設計で、安心とつながりを残すロボットを。', den: 'Designing robots that keep a sense of safety and connection.' },
    { id: 'trustai',   cat: 'future',   r: 14, ja: '信頼できるAIの社会実装', en: 'Trustworthy AI in society', dja: '信頼の知見を、受付・案内・介護などの社会の現場へ実装する。', den: 'Bringing trust research into real-world service settings.' }
  ];
  var LINKS = [
    ['me','curiosity','を原動力に','driven by',0.9], ['me','psy','を専門に','specializes in',0.9], ['curiosity','psy','が導く','leads to',0.5],
    ['psy','cog','は認知科学に立つ','rests on cognitive science',0.9], ['psy','inf','は情報科学に立つ','rests on information science',0.9],
    ['cog','trust','が信頼研究を支える','grounds the trust research',0.6], ['inf','trust','が信頼研究を支える','grounds the trust research',0.6],
    ['trust','trust2','を二層で捉える','seen in two layers',0.8], ['trust','thesis','を卒研で問う','asked in my thesis',0.8],
    ['thesis','hri','はHRIへ展開する','extends to HRI',0.7], ['trust2','hri','がロボットへの信頼に効く','shapes trust in robots',0.5],
    ['trust','warm','はあたたかい技術を目指す','aims at warm tech',0.6], ['attn','warm','への反動として','as a counter to',0.6],
    ['attn','dwb','に応える','answered by',0.7], ['dwb','warm','を体現する','embodies',0.6], ['happy','warm','が指針になる','guides',0.5],
    ['curiosity','happy','が幸福研究へ','turns to happiness',0.4],
    ['curiosity','debate','が議論を楽しむ','enjoys arguing',0.4], ['debate','trust','が論理と説得を鍛える','trains logic & persuasion',0.3],
    ['basket','me','がチームの私を作る','shaped the team-player in me',0.4], ['create','curiosity','が好奇心を発信する','broadcasts curiosity',0.5],
    ['kaira','inf','が情報科学の実践','practices info science',0.6], ['kaira','hri','がエージェント技術をHRIへ','carries agents toward HRI',0.4],
    ['debate','dwb','がメディア創立へ','led to founding media',0.4],
    ['hri','s2s','が空間へ向かう','heads into space',0.7], ['warm','s2s','を空間で実装する','realized in space',0.5],
    ['s2s','robot','を形にする','made concrete by',0.7], ['hri','robot','を作る','builds',0.5],
    ['trust','trustai','を社会に実装する','implemented in society',0.6], ['abroad','trustai','で政策と接続する','links to policy',0.5],
    ['dwb','abroad','が留学の問題意識','motivates studying abroad',0.3]
  ];

  var CENTERS = { core: [380, 280], domain: [430, 140], value: [165, 250], activity: [305, 425], future: [605, 235] };

  var lang = document.documentElement.lang === 'en' ? 'en' : 'ja';
  var byId = {}; NODES.forEach(function (n) { byId[n.id] = n; });
  var nbr = {}; NODES.forEach(function (n) { nbr[n.id] = {}; nbr[n.id][n.id] = 1; });
  var links = LINKS.map(function (a) {
    var l = { s: byId[a[0]], t: byId[a[1]], rja: a[2], ren: a[3], k: a[4] };
    nbr[a[0]][a[1]] = 1; nbr[a[1]][a[0]] = 1;
    return l;
  });

  // 初期配置：カテゴリ中心の近くに種をまく（意図したレイアウトに収束しやすく）
  NODES.forEach(function (n) {
    var c = CENTERS[n.cat];
    n.x = c[0] + (Math.random() - 0.5) * 70;
    n.y = c[1] + (Math.random() - 0.5) * 70;
    n.vx = 0; n.vy = 0;
  });

  // --- 力学（反発 + バネ + カテゴリ中心引力） ---
  var K_REP = 2200, K_SPRING = 0.02, K_CENTER = 0.0095, DAMP = 0.85, MIND = 20;
  function rest(l) { return 56 + (1 - l.k) * 120; }
  function step() {
    var i, j, n, m, dx, dy, d, f;
    for (i = 0; i < NODES.length; i++) {
      n = NODES[i];
      for (j = i + 1; j < NODES.length; j++) {
        m = NODES[j];
        dx = n.x - m.x; dy = n.y - m.y;
        d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        var dd = d < MIND ? MIND : d;
        f = K_REP / (dd * dd);
        var ux = dx / d, uy = dy / d;
        n.vx += ux * f; n.vy += uy * f; m.vx -= ux * f; m.vy -= uy * f;
      }
    }
    links.forEach(function (l) {
      dx = l.t.x - l.s.x; dy = l.t.y - l.s.y;
      d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      f = K_SPRING * (d - rest(l));
      var ux = dx / d, uy = dy / d;
      l.s.vx += ux * f; l.s.vy += uy * f; l.t.vx -= ux * f; l.t.vy -= uy * f;
    });
    var ke = 0;
    NODES.forEach(function (n) {
      var c = CENTERS[n.cat];
      n.vx += (c[0] - n.x) * K_CENTER; n.vy += (c[1] - n.y) * K_CENTER;
      if (n.fixed) { n.x = n.fx; n.y = n.fy; n.vx = n.vy = 0; return; }
      n.vx *= DAMP; n.vy *= DAMP; n.x += n.vx; n.y += n.vy;
      n.x = Math.max(PAD, Math.min(W - PAD, n.x));
      n.y = Math.max(PAD, Math.min(H - PAD, n.y));
      ke += n.vx * n.vx + n.vy * n.vy;
    });
    return ke;
  }
  // ロード時に同期で収束（rAFのスロットリングに依存せず安定）
  for (var s = 0; s < 600; s++) { if (step() < 0.02 && s > 140) break; }

  // --- SVG 構築 ---
  var gEdges = svg.querySelector('.nw-edges');
  var gLabels = svg.querySelector('.nw-edge-labels');
  var gNodes = svg.querySelector('.nw-nodes');
  function el(name, attrs) { var e = document.createElementNS(SVGNS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

  links.forEach(function (l) {
    l.path = el('path', { 'class': 'nw-edge' });
    gEdges.appendChild(l.path);
    l.lab = el('text', { 'class': 'nw-edge-label', 'text-anchor': 'middle' });
    gLabels.appendChild(l.lab);
  });
  NODES.forEach(function (n) {
    var g = el('g', { 'class': 'nw-node cat-' + n.cat + (n.cat === 'core' && n.id === 'me' ? ' is-core' : '') });
    n.g = g; n.circle = el('circle', { r: n.r }); g.appendChild(n.circle);
    n.label = el('text', { dy: '0.32em' }); g.appendChild(n.label);
    gNodes.appendChild(g);
    bindNode(n);
  });

  function renderLabels() {
    NODES.forEach(function (n) { n.label.textContent = n[lang]; });
    links.forEach(function (l) { l.lab.textContent = lang === 'en' ? l.ren : l.rja; });
    buildA11y();
  }
  function place() {
    NODES.forEach(function (n) { n.g.setAttribute('transform', 'translate(' + n.x.toFixed(1) + ',' + n.y.toFixed(1) + ')'); });
    links.forEach(function (l) {
      var mx = (l.s.x + l.t.x) / 2, my = (l.s.y + l.t.y) / 2;
      var dx = l.t.x - l.s.x, dy = l.t.y - l.s.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / len, ny = dx / len, off = 16;
      var cx = mx + nx * off, cy = my + ny * off;
      l.path.setAttribute('d', 'M' + l.s.x.toFixed(1) + ' ' + l.s.y.toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + l.t.x.toFixed(1) + ' ' + l.t.y.toFixed(1));
      var lx = 0.25 * l.s.x + 0.5 * cx + 0.25 * l.t.x, ly = 0.25 * l.s.y + 0.5 * cy + 0.25 * l.t.y;
      l.lab.setAttribute('x', lx.toFixed(1)); l.lab.setAttribute('y', ly.toFixed(1));
    });
  }
  renderLabels(); place();

  // --- ホバー：隣接ハイライト ---
  function focusNode(n, on) {
    if (on) {
      svg.classList.add('has-focus');
      NODES.forEach(function (m) { m.g.classList.toggle('hot', !!nbr[n.id][m.id]); });
      links.forEach(function (l) {
        var hot = (l.s.id === n.id || l.t.id === n.id);
        l.path.classList.toggle('hot', hot); l.lab.classList.toggle('hot', hot);
      });
    } else {
      svg.classList.remove('has-focus');
      NODES.forEach(function (m) { m.g.classList.remove('hot'); });
      links.forEach(function (l) { l.path.classList.remove('hot'); l.lab.classList.remove('hot'); });
    }
  }

  // --- クリック：焦点パネルに一文 ---
  var panel = section.querySelector('.network-panel');
  var selected = null;
  function renderPanel() {
    if (!panel) return;
    if (selected) {
      panel.innerHTML = '';
      var name = document.createElement('span'); name.className = 'np-name'; name.textContent = selected[lang];
      var desc = document.createElement('span'); desc.className = 'np-desc'; desc.textContent = selected[lang === 'en' ? 'den' : 'dja'];
      panel.appendChild(name); panel.appendChild(desc);
    }
  }
  function selectNode(n) { selected = n; renderPanel(); }

  // --- ドラッグ（pointer events・マウス/タッチ統一） + 操作時リヒート ---
  var raf = null;
  function loop() {
    var ke = step(); place();
    if (dragging || ke > 0.02) { raf = requestAnimationFrame(loop); } else { raf = null; }
  }
  function reheat() { if (!raf) raf = requestAnimationFrame(loop); }

  var dragging = null, moved = false;
  function bindNode(n) {
    // bound後に g が作られるので、参照は遅延
  }
  // g 構築後にイベントを付与
  NODES.forEach(function (n) {
    var g = n.g;
    g.addEventListener('pointerenter', function () { if (!dragging) focusNode(n, true); });
    g.addEventListener('pointerleave', function () { if (!dragging) focusNode(n, false); });
    g.addEventListener('pointerdown', function (e) {
      dragging = n; moved = false; n.fixed = true; n.fx = n.x; n.fy = n.y;
      try { g.setPointerCapture(e.pointerId); } catch (err) {}
      focusNode(n, true); reheat(); e.preventDefault();
    });
    g.addEventListener('pointermove', function (e) {
      if (dragging !== n) return;
      var pt = toSvg(e); n.fx = pt.x; n.fy = pt.y; moved = true; reheat();
    });
    function up(e) {
      if (dragging !== n) return;
      n.fixed = false; dragging = null;
      try { g.releasePointerCapture(e.pointerId); } catch (err) {}
      if (!moved) selectNode(n);   // ドラッグでなくタップ/クリックなら選択
      focusNode(n, false); reheat();
    }
    g.addEventListener('pointerup', up);
    g.addEventListener('pointercancel', up);
  });

  function toSvg(e) {
    var r = svg.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  }

  // --- 言語切替に追従 ---
  new MutationObserver(function () {
    var nl = document.documentElement.lang === 'en' ? 'en' : 'ja';
    if (nl === lang) return; lang = nl; renderLabels(); renderPanel();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  // --- SR 等価リスト（同データから生成。グラフは aria-hidden の enhancement） ---
  function buildA11y() {
    var box = section.querySelector('.nw-a11y'); if (!box) return;
    var catName = lang === 'en'
      ? { core: 'Core', domain: 'Fields', value: 'Values', activity: 'Activities', future: 'Future' }
      : { core: '核', domain: '専門', value: '価値観', activity: '活動', future: '未来' };
    var order = ['core', 'domain', 'value', 'activity', 'future'];
    var html = '<h3>' + (lang === 'en' ? 'What makes me — as a list' : '私を構成する要素（リスト）') + '</h3>';
    order.forEach(function (cat) {
      html += '<p><strong>' + catName[cat] + '</strong></p><ul>';
      NODES.filter(function (n) { return n.cat === cat; }).forEach(function (n) {
        html += '<li>' + n[lang] + ' — ' + n[lang === 'en' ? 'den' : 'dja'] + '</li>';
      });
      html += '</ul>';
    });
    box.innerHTML = html;
  }
})();
