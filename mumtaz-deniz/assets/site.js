/* Site etkileşimleri. Kütüphane yok; Web Animations API ve IntersectionObserver.
   Hareket azaltılmışsa animasyonlar atlanır, son hâl hemen gösterilir. Otomatik ses yok. */
(function () {
  'use strict';
  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };
  var azHareket = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EGRI = 'cubic-bezier(.2,.7,.2,1)';
  var animasyonVar = !azHareket && typeof Element !== 'undefined' && 'animate' in Element.prototype;
  var gozlemciVar = 'IntersectionObserver' in window;

  // Yalnız JavaScript ile çalışan denetimleri göster
  $$('[data-menu]').forEach(function (el) { el.hidden = false; });

  // ---------- Dil seçimi: ziyaretçinin seçimi hatırlanır (bkz. dil.js) ----------
  $$('[data-dil-sec]').forEach(function (a) {
    a.addEventListener('click', function () {
      try { window.localStorage.setItem('dil', a.getAttribute('data-dil-sec')); } catch (e) { /* depolama yok */ }
    });
  });

  // ---------- Üst çubuk ----------
  var ust = $('[data-ust]');
  function ustDurum() { if (ust) ust.classList.toggle('dolu', window.scrollY > 24); }
  window.addEventListener('scroll', ustDurum, { passive: true });
  ustDurum();

  // ---------- Dar ekran menüsü ----------
  var menuDugme = $('[data-menu]'), menu = $('#menu');
  function menuKapat() {
    if (!menu || !menuDugme) return;
    menu.classList.remove('acik'); ust.classList.remove('menu-acik');
    menuDugme.setAttribute('aria-expanded', 'false');
    $('[data-menu-metin]', menuDugme).textContent = menuDugme.getAttribute('data-metin-menu');
    document.body.style.overflow = '';
  }
  if (menuDugme && menu) {
    menuDugme.addEventListener('click', function () {
      var acik = menuDugme.getAttribute('aria-expanded') === 'true';
      if (acik) { menuKapat(); return; }
      menu.classList.add('acik'); ust.classList.add('menu-acik');
      menuDugme.setAttribute('aria-expanded', 'true');
      $('[data-menu-metin]', menuDugme).textContent = menuDugme.getAttribute('data-metin-kapat');
      document.body.style.overflow = 'hidden';
      var ilk = $('a', menu); if (ilk) ilk.focus();
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', menuKapat); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('acik')) { menuKapat(); menuDugme.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 860) menuKapat(); });
  }

  // ---------- Harf genişliği animasyonları: düzen kaymasız ----------
  // Her harfin son hâldeki genişliği önce sabitlenir; harf yalnız kendi kutusunda daralıp genişler.
  // Böylece satırlar ve alttaki içerik yer değiştirmez (CLS 0). Animasyon bitince sabitleme kalkar.
  var fontlarHazir = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  function harfAnimasyonu(harfler, kareler, ayar) {
    if (!animasyonVar || !harfler.length) return;
    harfler.forEach(function (h) { h.style.width = h.getBoundingClientRect().width + 'px'; });
    var bitenler = harfler.map(function (h, i) {
      return h.animate(kareler, { duration: ayar.sure, delay: ayar.gecikme + i * ayar.aralik, easing: EGRI, fill: ayar.fill || 'none' }).finished;
    });
    Promise.all(bitenler).then(function () { harfler.forEach(function (h) { h.style.width = ''; }); }, function () {});
  }

  // Giriş: adın harfleri bir kez "akort" olur. Font 1,2 sn'de gelmezse animasyon atlanır.
  var adHarfleri = $$('.giris-ad .h');
  var fontZaman = new Promise(function (r) { setTimeout(function () { r('gec'); }, 1200); });
  Promise.race([fontlarHazir.then(function () { return 'hazir'; }), fontZaman]).then(function (s) {
    if (s === 'hazir') harfAnimasyonu(adHarfleri, [{ fontStretch: '70%', opacity: 0.25 }, { fontStretch: '125%', opacity: 1 }], { sure: 1100, gecikme: 150, aralik: 32, fill: 'backwards' });
  });

  // Bölüm başlıkları: ilk görünüşte bir kez
  if (animasyonVar && gozlemciVar) {
    var baslikIO = new IntersectionObserver(function (girdiler) {
      girdiler.forEach(function (g) {
        if (!g.isIntersecting) return;
        baslikIO.unobserve(g.target);
        fontlarHazir.then(function () {
          harfAnimasyonu($$('.h', g.target), [{ fontStretch: '72%', opacity: 0.3 }, { fontStretch: '120%', opacity: 1 }], { sure: 900, gecikme: 0, aralik: 24, fill: 'backwards' });
        });
      });
    }, { threshold: 0.5 });
    $$('[data-rezonans]').forEach(function (h) { baslikIO.observe(h); });
  }

  // ---------- Chladni levhası (Müzik ve ses): dokununca titreşir, sonraki moda geçer ----------
  var levhaFig = $('[data-levha]');
  var veri = $('#mod-verisi');
  if (levhaFig && veri && window.Levha) {
    var modlar = JSON.parse(veri.textContent);
    try {
      var levha = new window.Levha($('canvas', levhaFig), { modlar: modlar, azHareket: azHareket });
      var aktif = 0;
      levha.onVurus = function () {
        aktif = (aktif + 1) % modlar.length;
        levha.modSec(aktif);
      };
      levha.baslat();
      requestAnimationFrame(function () { requestAnimationFrame(function () { levhaFig.classList.add('hazir'); }); });
    } catch (e) { /* levha yoksa poster görseli kalır */ }
  }

  // ---------- YouTube: tıklayınca oynatıcı penceresi (youtube-nocookie) ----------
  // Sayfa açılırken YouTube'a istek gitmez. Pencere kapanınca video durur ve odak karta döner.
  var pencere = $('[data-oynatici]');
  var pencereVar = !!(pencere && typeof pencere.showModal === 'function');
  var alan = pencere ? $('[data-oynatici-alan]', pencere) : null;
  var sonOdak = null;
  if (pencereVar) {
    $('[data-oynatici-kapat]', pencere).addEventListener('click', function () { pencere.close(); });
    pencere.addEventListener('close', function () { alan.innerHTML = ''; document.body.style.overflow = ''; if (sonOdak) sonOdak.focus(); });
    pencere.addEventListener('click', function (e) { if (e.target === pencere) pencere.close(); });
  }
  $$('.yt').forEach(function (k) {
    var a = $('.yt-oynat', k);
    if (!a) return;
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(k.getAttribute('data-yt')) + '?autoplay=1&rel=0';
      f.title = k.getAttribute('data-baslik') || 'YouTube';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.setAttribute('allowfullscreen', '');
      if (pencereVar) {
        sonOdak = a;
        pencere.classList.toggle('dikey', k.hasAttribute('data-kisa'));
        alan.innerHTML = '';
        alan.appendChild(f);
        document.body.style.overflow = 'hidden';
        pencere.showModal();
      } else {
        a.replaceWith(f);
        f.focus();
      }
    });
  });

  // ---------- Kısa döngü videoları: görünürken sessiz oynat; hareket azaltılmışsa denetim göster ----------
  var dongular = $$('video[data-otomatik]');
  dongular.forEach(function (v) { if (azHareket) { v.controls = true; v.removeAttribute('loop'); } });
  function oynat(v, evet) {
    if (azHareket) return;
    if (evet) { v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    else v.pause();
  }

  // ---------- Yolculuk: dönem notları kaydıkça oynatma kafası ilgili döneme atlar ----------
  // Şeritteki klipler bağlantıdır (#donem-N); kafa yalnız CSSOM transform ile taşınır (katı CSP, satır içi stil yok).
  var oturum = $('[data-oturum]');
  if (oturum) {
    var seritler = $$('[data-serit]', oturum);
    var donemler = $$('.donem', oturum);
    var klipler = $$('.klip', oturum);
    var kafaKonum = seritler.map(function (svg) {
      var harita = {};
      (svg.getAttribute('data-donem-x') || '').split(',').forEach(function (p) { var k = p.split(':'); if (k.length === 2) harita[k[0]] = k[1]; });
      return { kafa: $('[data-kafa]', svg), harita: harita };
    });
    var etkinDonem = null;
    var donemSec = function (no) {
      if (no === etkinDonem) return;
      etkinDonem = no;
      donemler.forEach(function (d) { d.classList.toggle('etkin', d.getAttribute('data-donem') === no); });
      klipler.forEach(function (k) { k.classList.toggle('etkin', k.getAttribute('data-donem') === no); });
      kafaKonum.forEach(function (k) {
        if (k.kafa && k.harita[no]) k.kafa.style.transform = 'translate(' + k.harita[no] + 'px, 0)';
      });
    };
    if (gozlemciVar) {
      var donemIO = new IntersectionObserver(function (g) {
        // Görünen dönemlerden en üsttekini seç: aynı anda birkaçı görünürse okunan ilk nottur
        var gorunen = g.filter(function (x) { return x.isIntersecting; });
        if (!gorunen.length) return;
        gorunen.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
        donemSec(gorunen[0].target.getAttribute('data-donem'));
      }, { rootMargin: '-52% 0px -38% 0px' });
      donemler.forEach(function (d) { donemIO.observe(d); });
    }
    // Yapışkan şerit notların üstünü kapatmasın: kaydırma payı şeridin gerçek yüksekliğinden
    var seritKutu = $('.oturum-serit', oturum);
    var payAyarla = function () {
      if (!seritKutu) return;
      var sabit = getComputedStyle(seritKutu).position === 'sticky';
      var pay = sabit ? (seritKutu.offsetHeight + ust.offsetHeight + 12) : (ust.offsetHeight + 20);
      donemler.forEach(function (d) { d.style.scrollMarginTop = pay + 'px'; });
    };
    payAyarla();
    window.addEventListener('resize', payAyarla);
    // İlk kare: ilk dönem etkin (HTML'de de öyle), kafa ilk dönemin başında durur
    var ilk = donemler[0];
    if (ilk) { etkinDonem = null; donemSec(ilk.getAttribute('data-donem')); }
    // Fare ya da odak klibin üstündeyken aynı dönemin öteki klipleri de parlar
    klipler.forEach(function (k) {
      var no = k.getAttribute('data-donem');
      var ac = function () { klipler.forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-donem') === no); }); };
      var kapat = function () { klipler.forEach(function (x) { x.classList.remove('on'); }); };
      k.addEventListener('mouseenter', ac); k.addEventListener('mouseleave', kapat);
      k.addEventListener('focus', ac); k.addEventListener('blur', kapat);
    });
  }

  // ---------- Issız Ada: yazılar kaydıkça görsel değişir ----------
  var ada = $('[data-ada]');
  if (ada && gozlemciVar) {
    var katlar = $$('[data-kat-ad]', ada);
    var kareler = $$('.kare', ada);
    var genis = window.matchMedia('(min-width: 900px)');
    var etkinle = function (ad) {
      kareler.forEach(function (k) { k.classList.toggle('etkin', k.getAttribute('data-medya') === ad); });
      katlar.forEach(function (el) {
        var on = el.getAttribute('data-kat-ad') === ad;
        el.classList.toggle('etkin', on);
        if (el.tagName === 'VIDEO') oynat(el, on && genis.matches);
      });
    };
    // Geniş ekranda alt yazılar görselin yanında düğmedir: tıklayınca ya da üstüne gelince kare değişir
    kareler.forEach(function (k) {
      var d = $('[data-kare-sec]', k);
      if (!d) return;
      var sec = function () { etkinle(k.getAttribute('data-medya')); };
      d.addEventListener('click', sec);
      d.addEventListener('mouseenter', function () { if (genis.matches) sec(); });
      d.addEventListener('focus', function () { if (genis.matches) sec(); });
    });
    var eskiEtkinle = etkinle;
    etkinle = function (ad) {
      eskiEtkinle(ad);
      kareler.forEach(function (k) { var d = $('[data-kare-sec]', k); if (d) d.setAttribute('aria-pressed', k.getAttribute('data-medya') === ad ? 'true' : 'false'); });
    };
    etkinle(kareler[0] && kareler[0].getAttribute('data-medya'));
    var satirVideoIO = new IntersectionObserver(function (g) {
      g.forEach(function (x) { if (!genis.matches) oynat(x.target, x.intersectionRatio > 0.5); });
    }, { threshold: [0, 0.5, 1] });
    $$('.kare-gorsel video', ada).forEach(function (v) { satirVideoIO.observe(v); });
  }

  // ---------- Vitrin: sinematik şerit — küçük resimler ve oklar sahneyi kaydırır; görünen sahne küçük resmi yakar ----------
  var ray = $('[data-ray]');
  if (ray) {
    var sahneler = $$('.sahne', ray);
    var kucukler = $$('[data-sahne-sec]');
    var oklar = $$('[data-ray-adim]');
    oklar.forEach(function (o) { o.hidden = false; });
    var etkinIndeks = function () { return Math.round(ray.scrollLeft / Math.max(ray.clientWidth, 1)); };
    var sahneyeGit = function (i) {
      i = Math.max(0, Math.min(sahneler.length - 1, i));
      ray.scrollTo({ left: sahneler[i].offsetLeft, behavior: azHareket ? 'auto' : 'smooth' });
    };
    var isaretle = function (i) {
      sahneler.forEach(function (sh, j) { sh.classList.toggle('etkin', j === i); });
      kucukler.forEach(function (k, j) { k.classList.toggle('etkin', j === i); k.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
    };
    kucukler.forEach(function (k, i) { k.addEventListener('click', function () { sahneyeGit(i); }); });
    oklar.forEach(function (o) { o.addEventListener('click', function () { sahneyeGit(etkinIndeks() + Number(o.getAttribute('data-ray-adim'))); }); });
    ray.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); sahneyeGit(etkinIndeks() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); sahneyeGit(etkinIndeks() - 1); }
    });
    if (gozlemciVar) {
      var rayIO = new IntersectionObserver(function (girdiler) {
        girdiler.forEach(function (g) { if (g.isIntersecting) isaretle(sahneler.indexOf(g.target)); });
      }, { root: ray, threshold: 0.6 });
      sahneler.forEach(function (sh) { rayIO.observe(sh); });
    } else {
      ray.addEventListener('scroll', function () { isaretle(etkinIndeks()); }, { passive: true });
    }
  }

  // ---------- Gezinme: ekranda olan bölümün bağlantısı etkin (mor-magenta alt çizgi) ----------
  var navBag = $$('.ust-nav a[href^="#"]');
  if (navBag.length && gozlemciVar) {
    var bolumler = navBag.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    var navIO = new IntersectionObserver(function (girdiler) {
      girdiler.forEach(function (g) {
        if (!g.isIntersecting) return;
        navBag.forEach(function (a) {
          var evet = a.getAttribute('href') === '#' + g.target.id;
          a.classList.toggle('etkin', evet);
          if (evet) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    bolumler.forEach(function (b) { navIO.observe(b); });
  }

})();
