/* AKANA Roket Takımı — etkileşimler. Bağımlılık yok. */
(function () {
    'use strict';
    var root = document.documentElement;
    var $ = function (s, c) { return (c || document).querySelector(s); };
    var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function lang() { return root.getAttribute('lang') === 'en' ? 'en' : 'tr'; }

    /* ---------- Dil (orijinal mantık + alt metinleri) ---------- */
    var TITLES = {
        tr: 'AKANA Roket Takımı | Tasarımdan Üretime, Üretimden Gökyüzüne',
        en: 'AKANA Rocket Team | From Design to Production, From Production to the Sky'
    };
    function syncAlts() {
        var l = lang();
        $$('img[data-alt-tr]').forEach(function (i) { i.alt = i.getAttribute('data-alt-' + l); });
        var cap = $('#dx-cap'), on = $('.dx-img.on');
        if (cap && on) cap.textContent = on.alt;
    }
    function setLanguage(l) {
        root.setAttribute('lang', l);
        document.title = TITLES[l];
        try { localStorage.setItem('akana-lang', l); } catch (e) {}
        syncAlts();
        if (lb.open) lbShow(lb.i, true);
    }
    window.toggleLanguage = function () { setLanguage(lang() === 'tr' ? 'en' : 'tr'); };
    var lb = { open: false, i: 0, list: [] };
    try { var sv = localStorage.getItem('akana-lang'); if (sv === 'en' || sv === 'tr') { root.setAttribute('lang', sv); document.title = TITLES[sv]; } } catch (e) {}
    syncAlts();

    /* ---------- Görsel hata yedeği ---------- */
    function placeholder(label) {
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="#0e1422"/><text x="300" y="205" fill="#9aa9c0" font-family="sans-serif" font-size="22" text-anchor="middle">' + label.replace(/[<&]/g, '') + '</text></svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }
    window.addEventListener('error', function (e) {
        var el = e.target;
        if (!el || el.tagName !== 'IMG') return;
        if (el.hasAttribute('data-hide-on-error')) {
            var box = el.closest('.modal-logo-container');
            if (box) box.hidden = true; else el.hidden = true;
            return;
        }
        if (/^data:/.test(el.getAttribute('src') || '') || el.dataset.retried) return;
        el.dataset.retried = '1';
        el.removeAttribute('srcset');
        el.src = placeholder(el.alt || 'AKANA');
    }, true);

    /* ---------- Gezinme ---------- */
    var navbar = $('#navbar'), menuBtn = $('#mobile-menu'), navLinks = $('#nav-links');
    $$('li', navLinks).forEach(function (li, i) { li.style.setProperty('--i', i); });
    function setMenu(open) {
        navLinks.classList.toggle('active', open);
        navbar.classList.toggle('open', open);
        menuBtn.classList.toggle('open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
    }
    menuBtn.addEventListener('click', function () { setMenu(!navLinks.classList.contains('active')); });
    $$('a', navLinks).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && navLinks.classList.contains('active')) { setMenu(false); menuBtn.focus(); } });

    var spyMap = {};
    $$('a.nav-link', navLinks).forEach(function (a) { spyMap[a.getAttribute('href').slice(1)] = a; });
    var SPY_ALIAS = { sazakan: 'projeler', 'sazakan-inceleme': 'projeler', 'sazakan-veri': 'projeler', 'ucus-profili': 'projeler', 'rover-bolum': 'projeler', gelecek: 'basarilar', haberler: 'medya' };
    if ('IntersectionObserver' in window) {
        var spy = new IntersectionObserver(function (es) {
            es.forEach(function (en) {
                var key = SPY_ALIAS.hasOwnProperty(en.target.id) ? SPY_ALIAS[en.target.id] : en.target.id;
                if (en.isIntersecting && spyMap[key]) {
                    Object.keys(spyMap).forEach(function (k) { spyMap[k].classList.remove('active'); });
                    spyMap[key].classList.add('active');
                }
            });
        }, { rootMargin: '-40% 0px -55% 0px' });
        Object.keys(spyMap).concat(Object.keys(SPY_ALIAS)).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
    }

    /* ---------- Kaydırma: ilerleme ---------- */
    var prog = $('#progress'), hero = $('#anasayfa'), ticking = false;
    function onScroll() {
        ticking = false;
        var y = window.scrollY, max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
        var p = Math.min(1, y / max);
        navbar.classList.toggle('scrolled', y > 50);
        root.classList.toggle('past-hero', hero ? y > hero.offsetHeight * 0.8 : y > 400);
        if (prog) prog.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    /* ---------- Karo girişi + sayaç ---------- */
    function countUp(el) {
        var to = parseFloat(el.getAttribute('data-count')); if (isNaN(to)) return;
        if (reduce) { el.textContent = to; return; }
        var t0 = performance.now(), dur = 1100;
        (function step(t) {
            var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
            el.textContent = Math.round(to * e);
            if (k < 1) requestAnimationFrame(step);
        })(t0);
    }
    if ('IntersectionObserver' in window) {
        var rv = new IntersectionObserver(function (es) {
            es.forEach(function (en) {
                if (!en.isIntersecting) return;
                var el = en.target;
                el.classList.add('in');
                $$('[data-count]', el).forEach(countUp);
                rv.unobserve(el);
            });
        }, { threshold: 0.06, rootMargin: '0px 0px -4% 0px' });
        /* clip-path ile gizlenen karolar için eşik 0 (kırpılmış alan nedeniyle oran hesabı sıfır kalır) */
        var rv0 = new IntersectionObserver(function (es) {
            es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); $$('[data-count]', en.target).forEach(countUp); rv0.unobserve(en.target); } });
        }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
        var seen = new Map();
        $$('.t').forEach(function (t) {
            var top = Math.round(t.getBoundingClientRect().top + scrollY / 1);
            var key = t.parentNode;
            var n = seen.get(key) || 0; seen.set(key, n + 1);
            t.style.setProperty('--d', Math.min(n % 6, 5) * 45 + 'ms');
            (t.matches('.board > .t.ph, .board > .t.purple, .board > .t.accent') ? rv0 : rv).observe(t);
        });
        var sh = new IntersectionObserver(function (es) {
            es.forEach(function (en) { if (en.isIntersecting) { var g = en.target.querySelector('[data-shutter]'); if (g) g.classList.add('open'); sh.unobserve(en.target); } });
        }, { threshold: 0.25 });
        $$('[data-shutter]').forEach(function (g) { sh.observe(g.parentNode); });
    } else {
        $$('.t').forEach(function (t) { t.classList.add('in'); });
        $$('[data-shutter]').forEach(function (g) { g.classList.add('open'); });
        $$('[data-count]').forEach(countUp);
    }

    /* ===== V2'den taşınan hareket motoru (.x2 bölümleri) ===== */
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var mqPin = window.matchMedia ? matchMedia('(min-width: 1025px) and (min-height: 661px)') : { matches: false };
    var pinned = function () { return mqPin.matches && !reduce; };
    /* ---------- Kelime bölme (kinetik tipografi) ---------- */
    function splitWords(el) {
        var text = el.textContent.replace(/\s+/g, ' ').trim();
        el.textContent = '';
        text.split(' ').forEach(function (w, i, arr) {
            var o = document.createElement('span'); o.className = 'w';
            var n = document.createElement('span'); n.style.setProperty('--i', i); n.textContent = w; o.appendChild(n);
            el.appendChild(o);
            if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
        });
    }
    $$('.kin > span, .vis-text').forEach(splitWords);

    /* ---------- Giriş hareketleri ---------- */
    if ('IntersectionObserver' in window) {
        var map = new Map();
        var io = new IntersectionObserver(function (es) {
            es.forEach(function (en) {
                if (!en.isIntersecting) return;
                var t = en.target;
                (map.get(t) || [t]).forEach(function (el) { el.classList.add('in'); });
                io.unobserve(t);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        $$('[data-r], [data-bars], .kin').forEach(function (el) {
            var r = el.getAttribute('data-r');
            if (r === 'wipe' || r === 'clip') {
                var p = el.parentNode; if (!map.has(p)) { map.set(p, []); io.observe(p); }
                map.get(p).push(el);
            } else io.observe(el);
        });
    } else { $$('[data-r], [data-bars], .kin').forEach(function (el) { el.classList.add('in'); }); }

    /* ---------- Yardımcı: tween ---------- */
    function tween(from, to, ms, fn, done) {
        var t0 = performance.now(), id;
        (function step(t) {
            var k = clamp((t - t0) / ms, 0, 1), e = 1 - Math.pow(1 - k, 3);
            fn(from + (to - from) * e);
            if (k < 1) id = requestAnimationFrame(step); else if (done) done();
        })(t0);
        return function () { cancelAnimationFrame(id); };
    }

    /* ---------- Kaydırma motoru ---------- */
    var scene = $('[data-scene]'), flightEl = $('[data-flight]'), logEl = $('.log');
    var depthEls = $$('[data-depth]'), fillEls = $$('.vis-text');
    var ticking2 = false, flightApi = null, sceneState = { done: false, stop: null };
    function pinProgress(el) {
        var r = el.getBoundingClientRect(), total = r.height - innerHeight;
        return total > 0 ? clamp(-r.top / total, 0, 1) : 1;
    }
    function sceneFrame() {
        if (!scene) return;
        if (pinned()) {
            if (sceneState.stop) { sceneState.stop(); sceneState.stop = null; }
            sceneState.done = false;
            scene.style.setProperty('--p', pinProgress(scene).toFixed(4));
        } else if (reduce) {
            scene.style.setProperty('--p', 1);
        } else if (!sceneState.done && scene.getBoundingClientRect().top < innerHeight * 0.7) {
            sceneState.done = true;
            scene.style.setProperty('--p', 0);
            sceneState.stop = tween(0, 1, 2600, function (v) { scene.style.setProperty('--p', v.toFixed(4)); });
        }
    }
    function frame() {
        ticking2 = false;
        var y = window.scrollY, vh = innerHeight;
        var max = Math.max(1, document.documentElement.scrollHeight - vh);
        sceneFrame();
        if (flightApi) flightApi.frame();
        if (!reduce) {
            depthEls.forEach(function (el) {
                var r = el.getBoundingClientRect();
                if (r.bottom < -200 || r.top > vh + 200) return;
                var d = el.getAttribute('data-depth'), c = r.top + r.height / 2 - vh / 2;
                if (d === 'band') el.style.setProperty('--py', (clamp(c / (vh / 2 + r.height / 2), -1, 1) * 8).toFixed(2));
                else if (innerWidth > 900) el.style.transform = 'translate3d(0,' + (c * -parseFloat(d)).toFixed(1) + 'px,0)';
            });
            if (logEl) {
                var lr = logEl.getBoundingClientRect();
                logEl.style.setProperty('--p', clamp((vh * 0.65 - lr.top) / lr.height, 0, 1).toFixed(3));
            }
        } else if (logEl) logEl.style.setProperty('--p', 1);
        if (!reduce) fillEls.forEach(function (el) {
            if (!el.offsetParent) return;
            var r = el.getBoundingClientRect();
            if (r.bottom < 0 || r.top > vh) return;
            var p = clamp((vh * 0.82 - r.top) / (r.height * 0.8 + vh * 0.2), 0, 1);
            var ws = el.querySelectorAll('.w'), n = ws.length;
            for (var i = 0; i < n; i++) ws[i].style.setProperty('--o', (0.2 + 0.8 * clamp((p * (n + 5) - i) / 5, 0, 1)).toFixed(2));
        });
    }
    function req() { if (!ticking2) { ticking2 = true; requestAnimationFrame(frame); } }
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    if (mqPin.addEventListener) mqPin.addEventListener('change', function () { sceneState.done = false; req(); });

    /* ---------- Uçuş profili ---------- */
    (function () {
        var f = flightEl; if (!f) return;
        var path = $('#fl-path'), trace = $('#fl-trace'), rocket = $('#fl-rocket'), gs = $('#fl-stops');
        var steps = $$('.fl-step', f), panels = $$('.fp', f), photos = $$('.fl-ph', f), range = $('.fl-range', f);
        var L = path.getTotalLength(), N = 600, apo = 0.45, miny = 1e9, main = 0.85, i, pt;
        for (i = 0; i <= N; i++) { pt = path.getPointAtLength(L * i / N); if (pt.y < miny) { miny = pt.y; apo = i / N; } }
        for (i = Math.round(apo * N); i <= N; i++) { pt = path.getPointAtLength(L * i / N); if (pt.y >= 420) { main = i / N; break; } }
        var th = [0, 0.035, apo - 0.04, apo + 0.035, main];
        var marks = [0, 0.16, apo, apo + 0.07, 0.985];
        var targets = [0, 0.13, apo, apo + 0.075, 1];
        var offs = [[16, -16, 'start'], [16, 4, 'start'], [0, -26, 'middle'], [18, -8, 'start'], [-18, -16, 'end']];
        var stopEls = [];
        marks.forEach(function (m, k) {
            var p = path.getPointAtLength(L * m);
            var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('class', 'stop'); c.setAttribute('r', 9); c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); gs.appendChild(c); stopEls.push(c);
            var lab = steps[k].querySelector('span:last-child');
            ['tr', 'en'].forEach(function (lg) {
                var src = lab.querySelector('.' + lg + '-content');
                var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                t.setAttribute('class', 'sl ' + lg + '-content'); t.setAttribute('x', p.x + offs[k][0]); t.setAttribute('y', p.y + offs[k][1]); t.setAttribute('text-anchor', offs[k][2]);
                t.textContent = src ? src.textContent : lab.textContent; gs.appendChild(t);
            });
        });
        trace.style.strokeDasharray = L;
        var cur = -1, curPhase = -1, auto = false, stopTw = null;
        function phaseOf(p) { var k = 0; th.forEach(function (t, j) { if (p >= t) k = j; }); return k; }
        function draw(p) {
            p = clamp(p, 0, 1);
            if (Math.abs(p - cur) < 0.0004) return; cur = p;
            trace.style.strokeDashoffset = L * (1 - p);
            var a = path.getPointAtLength(L * p), b = path.getPointAtLength(Math.min(L, L * p + 1));
            rocket.setAttribute('transform', 'translate(' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ') rotate(' + (Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90).toFixed(1) + ')');
            var ph = phaseOf(p);
            stopEls.forEach(function (c, k) { c.classList.toggle('done', p >= marks[k] - 0.002); c.classList.toggle('on', k === ph); });
            range.value = Math.round(p * 1000);
            if (ph !== curPhase) {
                curPhase = ph;
                steps.forEach(function (s, k) { s.setAttribute('aria-selected', String(k === ph)); });
                panels.forEach(function (pn, k) { pn.classList.toggle('on', k === ph); });
                photos.forEach(function (el) { el.classList.toggle('on', (' ' + el.getAttribute('data-step') + ' ').indexOf(' ' + ph + ' ') > -1); });
            }
        }
        function pinnedY(p) {
            var r = f.getBoundingClientRect(), top = r.top + window.scrollY;
            return top + (p / 1.06) * (f.offsetHeight - innerHeight);
        }
        function goTo(p, ms) {
            if (stopTw) { stopTw(); stopTw = null; }
            if (pinned()) { window.scrollTo({ top: pinnedY(p), behavior: reduce ? 'auto' : 'smooth' }); return; }
            if (reduce || !ms) { draw(p); return; }
            stopTw = tween(cur < 0 ? 0 : cur, p, ms, draw);
        }
        steps.forEach(function (s, k) { s.addEventListener('click', function () { auto = true; goTo(targets[k], 800); }); });
        range.addEventListener('input', function () {
            auto = true; var p = range.value / 1000;
            if (pinned()) window.scrollTo({ top: pinnedY(p), behavior: 'auto' }); else { if (stopTw) { stopTw(); stopTw = null; } draw(p); }
        });
        draw(0);
        flightApi = { frame: function () { if (pinned()) draw(clamp(pinProgress(f) * 1.06, 0, 1)); } };
        if (!pinned() && 'IntersectionObserver' in window && !reduce) {
            var fo = new IntersectionObserver(function (es) {
                if (es[0].isIntersecting) { fo.disconnect(); if (!auto && !pinned()) goTo(apo, 3200); }
            }, { threshold: 0.45 });
            fo.observe($('.fl-mid', f));
        }
    })();

    /* ---------- Roket anatomisi ---------- */
    (function () {
        var an = $('[data-anatomy]'); if (!an) return;
        var svgs = $$('.rk', an), tabs = $$('.zt', an), panels = $$('.zp', an), hs = $$('.hs', an), btn = $('#rk-explode');
        function sel(z, focus) {
            svgs.forEach(function (s) { s.setAttribute('data-active', z); });
            hs.forEach(function (h) { h.classList.toggle('sel', h.getAttribute('data-zone') === z); });
            tabs.forEach(function (t) { var on = t.getAttribute('data-zone') === z; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
            panels.forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-zone') === z); });
        }
        function setExplode(on) {
            svgs.forEach(function (s) { s.classList.toggle('explode', on); });
            btn.setAttribute('aria-pressed', String(on));
        }
        hs.forEach(function (h) {
            var z = h.getAttribute('data-zone');
            h.addEventListener('click', function () { sel(z); });
            h.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sel(z); } });
        });
        tabs.forEach(function (t, i) {
            t.addEventListener('click', function () { sel(t.getAttribute('data-zone')); });
            t.addEventListener('keydown', function (e) {
                var n = tabs.length, k = -1;
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') k = (i + 1) % n;
                else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') k = (i - 1 + n) % n;
                else if (e.key === 'Home') k = 0; else if (e.key === 'End') k = n - 1;
                if (k > -1) { e.preventDefault(); sel(tabs[k].getAttribute('data-zone'), true); }
            });
        });
        btn.addEventListener('click', function () { setExplode(btn.getAttribute('aria-pressed') !== 'true'); });
        sel('nose');
        if (!reduce && 'IntersectionObserver' in window) {
            var ao = new IntersectionObserver(function (es) {
                if (es[0].isIntersecting) {
                    ao.disconnect();
                    setTimeout(function () { if (btn.getAttribute('aria-pressed') !== 'true') { setExplode(true); setTimeout(function () { setExplode(false); }, 3200); } }, 600);
                }
            }, { threshold: 0.4 });
            ao.observe($('.rk-draw', an));
        }
    })();

    /* ---------- Departman ağı ---------- */
    (function () {
        var dx = $('[data-dx-root]'); if (!dx) return;
        var nodes = $$('.nd', dx), tabs = $$('.dx-tab', dx), panels = $$('.dx-panel', dx), imgs = $$('.dx-img', dx), edges = $$('.ed', dx), graph = $('.dx-graph', dx);
        var cur = 0, busy;
        function paint(i) {
            graph.classList.add('has-sel');
            edges.forEach(function (e) {
                var a = +e.getAttribute('data-a'), b = +e.getAttribute('data-b');
                e.classList.toggle('hl', a === i || b === i);
            });
            var nb = {};
            edges.forEach(function (e) { var a = +e.getAttribute('data-a'), b = +e.getAttribute('data-b'); if (a === i) nb[b] = 1; if (b === i) nb[a] = 1; });
            nodes.forEach(function (n, k) { n.classList.toggle('sel', k === i); n.classList.toggle('nbr', !!nb[k]); });
        }
        function select(i, o) {
            o = o || {};
            if (i === cur && panels[i].classList.contains('on') && !o.force) { paint(i); return; }
            var old = imgs[cur], nw = imgs[i];
            tabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
            panels.forEach(function (p, k) { p.classList.toggle('on', k === i); });
            imgs.forEach(function (m) { m.classList.remove('prev'); });
            if (old && old !== nw) { old.classList.remove('on'); old.classList.add('prev'); }
            if (nw) {
                if (!reduce) { nw.classList.remove('prev'); nw.classList.add('enter'); void nw.offsetWidth; nw.classList.remove('enter'); nw.classList.add('on'); }
                else { nw.classList.remove('prev'); nw.classList.add('on'); }
                clearTimeout(busy); busy = setTimeout(function () { imgs.forEach(function (m) { m.classList.remove('prev'); }); }, 800);
            }
            cur = i; paint(i);
            if (o.focus) tabs[i].focus();
            if (o.scroll) panels[i].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        }
        nodes.forEach(function (n, i) {
            n.addEventListener('click', function () { select(i); });
            n.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(i); } });
            n.addEventListener('mouseenter', function () { paint(i); });
            n.addEventListener('mouseleave', function () { paint(cur); });
        });
        tabs.forEach(function (t, i) {
            t.addEventListener('click', function () { select(i); });
            t.addEventListener('keydown', function (e) {
                var n = tabs.length, k = -1;
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') k = (i + 1) % n;
                else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') k = (i - 1 + n) % n;
                else if (e.key === 'Home') k = 0; else if (e.key === 'End') k = n - 1;
                if (k > -1) { e.preventDefault(); select(k, { focus: true }); }
            });
        });
        $$('.nb', dx).forEach(function (b) { b.addEventListener('click', function () { select(+b.getAttribute('data-dx')); }); });
        paint(0);
        function fromHash() {
            var m = /^#dept-(\d\d)$/.exec(location.hash);
            if (m) { var i = +m[1] - 1; if (panels[i]) select(i, { scroll: true, force: true }); }
        }
        window.addEventListener('hashchange', fromHash);
        $$('a[href^="#dept-"]').forEach(function (a) { a.addEventListener('click', function () { setTimeout(fromHash, 0); }); });
        fromHash();
    })();


    frame();
    /* ===== /V2 ===== */


    /* ---------- Galeri: sürükle, filtrele ---------- */
    var row = $('#g-row'), items = [];
    function buildGallery(cat) {
        var vis = items.filter(function (it) { return cat === 'all' || it.dataset.cat === cat; });
        row.textContent = '';
        var i = 0, h = row.clientHeight || 500;
        function ar(it) { return parseFloat(it.style.getPropertyValue('--ar')) || 1.5; }
        function mod(cls, kids, w) {
            var d = document.createElement('div'); d.className = 'gm ' + cls;
            d.style.setProperty('--w', w);
            kids.forEach(function (k) { d.appendChild(k); });
            row.appendChild(d);
        }
        while (i < vis.length) {
            var a = vis[i], r = ar(a);
            if (r < 0.9) { mod('tall', [a], 'calc(var(--gh) * ' + r + ')'); i++; }
            else if (vis[i + 1] && ar(vis[i + 1]) >= 0.9 && r < 1.9 && ar(vis[i + 1]) < 1.9) {
                var b = vis[i + 1], rb = ar(b);
                /* iki kare üst üste: genişlik, ikisi de kırpılmadan sığacak en küçük değer */
                var wd = Math.min(r, rb);
                var w2 = 'calc((var(--gh) - var(--gg)) / 2 * ' + wd + ')';
                a.style.removeProperty('width'); b.style.removeProperty('width');
                mod('pair', [a, b], w2);
                a.style.aspectRatio = ''; b.style.aspectRatio = '';
                a.style.setProperty('--ar', r); b.style.setProperty('--ar', rb);
                a.style.width = '100%'; b.style.width = '100%';
                a.style.height = 'auto'; b.style.height = 'auto';
                i += 2;
            } else { mod('wide', [a], 'calc(var(--gh) * ' + r + ')'); i++; }
        }
        var c = $('#g-count'); if (c) c.textContent = vis.length;
        row.scrollLeft = 0;
        lb.list = vis;
    }
    if (row) {
        items = $$('.g-item', row);
        var chips = $$('.chip[data-filter]');
        chips.forEach(function (c) {
            c.addEventListener('click', function () {
                chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
                buildGallery(c.getAttribute('data-filter'));
            });
        });
        lb.list = items;
        buildGallery('all');
        /* fare ile sürükleme */
        var down = false, sx = 0, sl = 0, moved = 0;
        row.addEventListener('pointerdown', function (e) {
            if (e.pointerType !== 'mouse' || e.button !== 0) return;
            down = true; moved = 0; sx = e.clientX; sl = row.scrollLeft;
        });
        window.addEventListener('pointermove', function (e) {
            if (!down) return;
            var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
            if (moved > 5) { row.classList.add('drag'); row.scrollLeft = sl - dx; }
        });
        window.addEventListener('pointerup', function () {
            if (!down) return; down = false;
            if (moved > 5) setTimeout(function () { row.classList.remove('drag'); }, 0);
        });
        row.addEventListener('keydown', function (e) {
            if (e.target !== row) return;
            if (e.key === 'ArrowRight') { row.scrollBy({ left: 360, behavior: 'smooth' }); e.preventDefault(); }
            if (e.key === 'ArrowLeft') { row.scrollBy({ left: -360, behavior: 'smooth' }); e.preventDefault(); }
        });
        row.addEventListener('wheel', function (e) {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; /* dikey kaydırmayı sayfaya bırak */
        }, { passive: true });
    }

    /* ---------- Işık kutusu ---------- */
    var box = $('#lightbox'), lbImg = $('#lb-img'), lbCap = $('#lb-cap'), lbCount = $('#lb-count');
    var lbFrom = null, lbTrig = null;
    function lbList() { return lb.list; }
    function triggerLabel(el) { return (el.querySelector('img') || {}).alt || ''; }
    function lbShow(i, quiet) {
        var list = lbList(); if (!list.length) return;
        lb.i = (i + list.length) % list.length;
        var el = list[lb.i], im = el.querySelector('img');
        lbImg.src = el.getAttribute('data-full') || (im && im.src);
        lbImg.alt = im ? im.alt : '';
        lbCap.textContent = im ? im.alt : '';
        lbCount.textContent = (lb.i + 1) + ' / ' + list.length;
        lbTrig = el;
        if (!quiet) { lbImg.style.opacity = '0'; lbImg.onload = function () { lbImg.style.transition = 'opacity .25s'; lbImg.style.opacity = '1'; }; }
        [list[(lb.i + 1) % list.length], list[(lb.i - 1 + list.length) % list.length]].forEach(function (n) {
            var u = n.getAttribute('data-full'); if (u) { var p = new Image(); p.src = u; }
        });
    }
    function lbOpen(el, listOverride) {
        var all = listOverride || (items.indexOf(el) > -1 ? lb.list : [el]);
        if (all.indexOf(el) < 0) all = [el];
        lb.list = all; lb.open = true; lbFrom = document.activeElement;
        lbShow(all.indexOf(el), true);
        lbImg.style.opacity = '1';
        box.classList.add('active'); box.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        /* kaynak küçük resimden büyüme (FLIP) */
        var im = el.querySelector('img');
        if (im && !reduce && lbImg.animate) {
            var r1 = im.getBoundingClientRect();
            requestAnimationFrame(function () {
                var r2 = lbImg.getBoundingClientRect();
                if (!r2.width) return;
                var dx = r1.left + r1.width / 2 - (r2.left + r2.width / 2), dy = r1.top + r1.height / 2 - (r2.top + r2.height / 2), s = Math.max(0.2, r1.width / r2.width);
                lbImg.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')' }, { transform: 'none' }], { duration: 360, easing: 'cubic-bezier(0.23,1,0.32,1)' });
            });
        }
        $('#lb-close').focus();
    }
    function lbClose() {
        if (!lb.open) return;
        lb.open = false;
        box.classList.remove('active'); box.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (!items.length || (lbTrig && !lbTrig.isConnected)) lbTrig = null;
        var back = lbTrig && lbTrig.isConnected ? lbTrig : lbFrom;
        if (back && back.focus) back.focus({ preventScroll: false });
    }
    var galleryStrip = function () { return items; };
    document.addEventListener('click', function (e) {
        var el = e.target.closest('[data-lb]');
        if (!el) return;
        if (row && row.classList.contains('drag')) return;
        e.preventDefault();
        lbOpen(el, items.indexOf(el) > -1 ? lb.list : null);
    });
    $('#lb-close').addEventListener('click', lbClose);
    $('#lb-prev').addEventListener('click', function () { lbShow(lb.i - 1); });
    $('#lb-next').addEventListener('click', function () { lbShow(lb.i + 1); });
    box.addEventListener('click', function (e) { if (e.target === box || e.target.classList.contains('lb-fig')) lbClose(); });
    var tx = null, ty = 0;
    box.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    box.addEventListener('touchend', function (e) {
        if (tx === null) return;
        var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) lbShow(lb.i + (dx < 0 ? 1 : -1));
        else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) lbClose();
    }, { passive: true });

    /* ---------- Modal ---------- */
    var lastFocus = null, openModalId = null;
    window.openModal = function (id, trigger) {
        var m = document.getElementById(id); if (!m) return;
        lastFocus = trigger || document.activeElement;
        m.classList.add('active'); m.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; openModalId = id;
        var c = $('.modal-close', m); if (c) c.focus();
    };
    window.closeModal = function (id) {
        var m = document.getElementById(id); if (!m) return;
        m.classList.remove('active'); m.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = ''; openModalId = null;
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    $$('.modal-overlay').forEach(function (m) {
        m.addEventListener('click', function (e) { if (e.target === m) window.closeModal(m.id); });
    });

    /* ---------- Klavye: Esc, oklar, odak tuzağı ---------- */
    document.addEventListener('keydown', function (e) {
        if (lb.open) {
            if (e.key === 'Escape') lbClose();
            else if (e.key === 'ArrowRight') lbShow(lb.i + 1);
            else if (e.key === 'ArrowLeft') lbShow(lb.i - 1);
            else if (e.key === 'Tab') trap(e, box);
            return;
        }
        if (openModalId) {
            var m = document.getElementById(openModalId);
            if (e.key === 'Escape') window.closeModal(openModalId);
            else if (e.key === 'Tab') trap(e, m);
        }
    });
    function trap(e, ctx) {
        var f = $$('button,a[href],input,[tabindex]:not([tabindex="-1"])', ctx).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
        if (!f.length) return;
        var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }

    /* ---------- İstanbul saati ---------- */
    var clock = $('#clock');
    if (clock) {
        var fmt;
        try { fmt = new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); } catch (e) {}
        var tick = function () { if (fmt) clock.textContent = fmt.format(new Date()); };
        tick(); setInterval(tick, 1000);
    }

    /* ---------- Instagram gömme (haberler görünür olunca) ---------- */
    var hb = $('#haberler');
    if (hb) {
        var done = false, load = function () {
            if (done) return; done = true;
            var s = document.createElement('script'); s.async = true; s.src = 'https://www.instagram.com/embed.js'; document.body.appendChild(s);
        };
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { load(); o.disconnect(); } }, { rootMargin: '400px' }).observe(hb);
        } else load();
    }
    /* ===== V3: karo başlıklarında kelime maskesi + fare tepkisi ===== */
    $$('.t .h-title > span, .t .t-h > span').forEach(splitWords);
    if (window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
        var pt = null, pend = false;
        document.addEventListener('pointermove', function (e) {
            var t = e.target.closest && e.target.closest('.t'); if (!t) return;
            pt = { t: t, x: e.clientX, y: e.clientY };
            if (pend) return; pend = true;
            requestAnimationFrame(function () {
                pend = false; if (!pt) return;
                var r = pt.t.getBoundingClientRect(), x = pt.x - r.left, y = pt.y - r.top;
                pt.t.style.setProperty('--mx', x + 'px'); pt.t.style.setProperty('--my', y + 'px');
                pt.t.style.setProperty('--px', (x / r.width * 2 - 1).toFixed(3)); pt.t.style.setProperty('--py', (y / r.height * 2 - 1).toFixed(3));
            });
        }, { passive: true });
    }
})();
