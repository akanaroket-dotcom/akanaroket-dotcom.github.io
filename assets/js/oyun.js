/* AKANA oyun + skor tablosu. Bağımlılık yok. Firestore'u REST ile okur (SDK yüklemez). */
(function () {
    'use strict';
    var KEY = 'AIzaSyCyFUlTLx2fK1osluvp_8LRXGoDj2beOpo';
    var PROJE = 'akana-skor';
    var OYUN = 'oyun/';
    var SATIR = 20;          // her tablo yüklemesi en çok 20 okuma
    var ONBELLEK_MS = 45000; // aynı modu 45 sn içinde yeniden okuma
    var AD_ANAHTAR = 'akana_oyuncu_adi';

    var root = document.documentElement;
    var sec = document.getElementById('oyun');
    if (!sec) return;
    var $ = function (s, c) { return (c || sec).querySelector(s); };
    var $$ = function (s, c) { return Array.prototype.slice.call((c || sec).querySelectorAll(s)); };
    var lang = function () { return root.getAttribute('lang') === 'en' ? 'en' : 'tr'; };

    /* ---------- Sekmeler ---------- */
    var tabs = $$('.og-tab');
    var panels = { oyun: $('#og-p-oyun'), skor: $('#og-p-skor') };
    function sec_(ad, odak) {
        tabs.forEach(function (t) {
            var on = t.getAttribute('data-tab') === ad;
            t.setAttribute('aria-selected', String(on));
            t.tabIndex = on ? 0 : -1;
            panels[t.getAttribute('data-tab')].hidden = !on;
            if (on && odak) t.focus();
        });
        if (ad === 'skor') tabloYukle(false);
        else if (iframe) { try { iframe.contentWindow.focus(); } catch (e) {} }
    }
    tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { sec_(t.getAttribute('data-tab'), false); });
        t.addEventListener('keydown', function (e) {
            var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
            if (j < 0) return;
            e.preventDefault();
            sec_(tabs[(j + tabs.length) % tabs.length].getAttribute('data-tab'), true);
        });
    });
    $$('[data-goto]').forEach(function (b) {
        b.addEventListener('click', function () { sec_(b.getAttribute('data-goto'), false); sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    });

    /* ---------- Oyun ---------- */
    var frame = $('#og-frame'), start = $('#og-start'), fsBtn = $('#og-fs'), iframe = null;
    function basla() {
        if (iframe) return;
        iframe = document.createElement('iframe');
        iframe.title = lang() === 'en' ? 'AKANA: Asteroid Frontier game' : 'AKANA: Asteroid Frontier oyunu';
        iframe.setAttribute('allow', 'fullscreen; autoplay; gamepad');
        iframe.setAttribute('allowfullscreen', '');
        iframe.addEventListener('load', function () { try { iframe.contentWindow.focus(); } catch (e) {} });
        iframe.src = OYUN;
        frame.appendChild(iframe);
        start.hidden = true;
        fsBtn.disabled = false;
    }
    start.addEventListener('click', basla);
    fsBtn.addEventListener('click', function () {
        var rq = frame.requestFullscreen || frame.webkitRequestFullscreen;
        if (rq) { try { var p = rq.call(frame); if (p && p.catch) p.catch(function () { window.open(OYUN, '_blank', 'noopener'); }); } catch (e) { window.open(OYUN, '_blank', 'noopener'); } }
        else window.open(OYUN, '_blank', 'noopener'); // iPhone: öğe tam ekranı yok
    });

    /* ---------- Skor tablosu ---------- */
    var liste = $('#og-list'), durum = $('#og-status'), zaman = $('#og-time'), yenile = $('#og-refresh');
    var modBtn = $$('.og-modes .chip');
    var mod = 'klasik', seq = 0, onbellek = {}, anon = null;
    var MESAJ = {
        bos: ['Bu modda henüz kayıtlı skor yok. İlk rekoru sen kır.', 'No scores in this mode yet. Set the first record.'],
        hata: ['Skor tablosuna şu an ulaşılamıyor. Biraz sonra tekrar dene.', 'The leaderboard is unreachable right now. Try again shortly.']
    };
    function mesaj(k) { return lang() === 'en' ? MESAJ[k][1] : MESAJ[k][0]; }
    function benAdi() { try { return (localStorage.getItem(AD_ANAHTAR) || '').toLowerCase(); } catch (e) { return ''; } }

    function iskelet() {
        liste.textContent = '';
        for (var i = 0; i < 6; i++) {
            var li = document.createElement('li');
            li.className = 'og-row sk';
            li.innerHTML = '<span class="og-rank"></span><span class="og-pname"></span><span class="og-pts"></span>';
            liste.appendChild(li);
        }
    }
    function ciz(satirlar) {
        liste.textContent = '';
        var ben = benAdi(), fmt = lang() === 'en' ? 'en-US' : 'tr-TR';
        satirlar.forEach(function (s, i) {
            var li = document.createElement('li');
            li.className = 'og-row';
            if (i < 3) li.setAttribute('data-top', String(i + 1));
            var r = document.createElement('span'); r.className = 'og-rank'; r.textContent = String(i + 1).padStart(2, '0');
            var n = document.createElement('span'); n.className = 'og-pname'; n.textContent = s.ad;
            if (ben && s.ad.toLowerCase() === ben) {
                li.setAttribute('data-me', '1');
                var k = document.createElement('small'); k.textContent = lang() === 'en' ? 'YOU' : 'SEN'; n.appendChild(k);
            }
            var p = document.createElement('span'); p.className = 'og-pts'; p.textContent = s.skor.toLocaleString(fmt);
            li.appendChild(r); li.appendChild(n); li.appendChild(p);
            liste.appendChild(li);
        });
    }

    function sorgu() {
        return JSON.stringify({ structuredQuery: { from: [{ collectionId: 'skorlar' }], orderBy: [{ field: { fieldPath: 'skor' }, direction: 'DESCENDING' }], limit: SATIR } });
    }
    function anonToken() {
        if (!anon) {
            anon = fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + KEY, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"returnSecureToken":true}'
            }).then(function (r) { if (!r.ok) throw new Error('auth ' + r.status); return r.json(); })
              .then(function (j) { return j.idToken; })
              .catch(function (e) { anon = null; throw e; });
        }
        return anon;
    }
    function istek(m, token, sinyal) {
        var h = { 'Content-Type': 'application/json' };
        if (token) h.Authorization = 'Bearer ' + token;
        return fetch('https://firestore.googleapis.com/v1/projects/' + PROJE + '/databases/(default)/documents/modlar/' + m + ':runQuery?key=' + KEY,
            { method: 'POST', headers: h, body: sorgu(), signal: sinyal });
    }
    function ayikla(dizi) {
        var out = [];
        (dizi || []).forEach(function (x) {
            var f = x.document && x.document.fields; if (!f) return;
            var s = f.skor || {};
            var n = s.integerValue != null ? parseInt(s.integerValue, 10) : s.doubleValue != null ? Math.round(s.doubleValue) : 0;
            out.push({ ad: (f.ad && f.ad.stringValue) || '?', skor: isFinite(n) ? n : 0 });
        });
        return out;
    }
    function getir(m) {
        var ctl = typeof AbortController === 'function' ? new AbortController() : null;
        var to = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
        var sin = ctl ? ctl.signal : undefined;
        return istek(m, null, sin)
            .then(function (r) {
                // kurallar giriş istiyorsa anonim jetonla bir kez daha dene
                if (r.status === 401 || r.status === 403) return anonToken().then(function (t) { return istek(m, t, sin); });
                return r;
            })
            .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
            .then(function (j) { clearTimeout(to); return ayikla(j); })
            .catch(function (e) { clearTimeout(to); throw e; });
    }
    function saat(t) { return new Date(t).toLocaleTimeString(lang() === 'en' ? 'en-GB' : 'tr-TR', { hour: '2-digit', minute: '2-digit' }); }
    function zamanYaz(t) {
        zaman.textContent = '';
        if (!t) return;
        zaman.innerHTML = '<span class="tr-content">Güncellendi </span><span class="en-content">Updated </span>';
        zaman.appendChild(document.createTextNode(saat(t)));
    }

    function tabloYukle(zorla) {
        var m = mod, o = onbellek[m], ben = ++seq;
        if (!zorla && o && Date.now() - o.t < ONBELLEK_MS) { ciz(o.satirlar); durum.textContent = o.satirlar.length ? '' : mesaj('bos'); zamanYaz(o.t); return; }
        liste.setAttribute('aria-busy', 'true');
        durum.textContent = '';
        if (!o) iskelet();
        getir(m).then(function (satirlar) {
            if (ben !== seq) return;
            onbellek[m] = { t: Date.now(), satirlar: satirlar };
            ciz(satirlar);
            durum.textContent = satirlar.length ? '' : mesaj('bos');
            zamanYaz(onbellek[m].t);
        }).catch(function () {
            if (ben !== seq) return;
            if (o) { ciz(o.satirlar); zamanYaz(o.t); } else liste.textContent = '';
            durum.textContent = mesaj('hata');
        }).then(function () { if (ben === seq) liste.setAttribute('aria-busy', 'false'); });
    }
    modBtn.forEach(function (b) {
        b.addEventListener('click', function () {
            mod = b.getAttribute('data-mod');
            modBtn.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
            tabloYukle(false);
        });
    });
    yenile.addEventListener('click', function () {
        yenile.disabled = true;
        setTimeout(function () { yenile.disabled = false; }, 5000); // okuma kotasını koru
        tabloYukle(true);
    });
    // dil değişince sayı/saat biçimi ve etiketler yenilensin
    new MutationObserver(function () {
        var o = onbellek[mod];
        if (o) { ciz(o.satirlar); zamanYaz(o.t); if (durum.textContent) durum.textContent = o.satirlar.length ? '' : mesaj('bos'); }
    }).observe(root, { attributes: true, attributeFilter: ['lang'] });

    /* #skor ile doğrudan skor sekmesi */
    function hash() { if (location.hash === '#skor') { sec_('skor', false); sec.scrollIntoView(); } }
    window.addEventListener('hashchange', hash);
    hash();
})();