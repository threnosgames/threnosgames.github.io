/* İlk açılışta dil seçimi (yalnız Türkçe ana sayfada yüklenir).
   - Adreste ?dil=tr varsa Türkçe kalır ve seçim hatırlanır.
   - Daha önce bir dil seçildiyse ona uyulur.
   - Seçim yoksa tarayıcı dili Türkçe değilse İngilizce sayfaya geçilir.
   Depolama kapalıysa (gizli pencere) yalnız tarayıcı diline bakılır. */
(function () {
  'use strict';
  var al = function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } };
  var koy = function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* depolama yok */ } };
  if (/[?&]dil=tr(&|$)/.test(window.location.search)) { koy('dil', 'tr'); return; }
  var secim = al('dil');
  if (secim === 'tr') return;
  var hedef = 'en/' + window.location.hash;
  if (secim === 'en') { window.location.replace(hedef); return; }
  var diller = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || 'tr'];
  var turkce = false;
  for (var i = 0; i < diller.length; i++) { if (/^tr\b/i.test(diller[i] || '')) { turkce = true; break; } }
  if (!turkce) window.location.replace(hedef);
})();
