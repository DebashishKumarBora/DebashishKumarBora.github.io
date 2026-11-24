/* =====================================================================
   Demo phone layer
   Makes each live demo behave like a native screen inside the
   portfolio's phone app:
   - hides the floating credit badges when the demo runs inside the app
   - adds a swipeable section bar where a dashboard hides its sidebar
   - lets the app's back button close the demo's own panels first
   - keeps the demo from adding entries to the browser history
   Built by Debashish Kumar Bora.
   ===================================================================== */
(function (W, D) {
  'use strict';
  if (W.DKB_MOBILE) return;
  var html = D.documentElement;

  /* ---------- where are we running? ---------- */
  var inApp = /[?&]embed=app(&|$)/.test(String(W.location.search || ''));
  if (!inApp) {
    try { if (W.self !== W.top && /\/m\/(index\.html)?$/.test(W.parent.location.pathname)) inApp = true; } catch (e) { /* cross origin parent */ }
  }
  if (inApp) html.classList.add('dkb-in-app');

  /* ---------- shared styles ---------- */
  var CSS = ''
    + 'html.dkb-in-app .vpg-portfolio,html.dkb-in-app .vpg-credit,html.dkb-in-app .vpg-demo-badge,html.dkb-in-app .dkb-demo,html.dkb-in-app .pfab{display:none!important}'
    + '.dkb-strip{display:none}'
    + 'html.dkb-narrow .dkb-strip{display:block;position:sticky;top:0;z-index:var(--dkb-strip-z,35);background:var(--dkb-strip-bg,#fff);border-bottom:1px solid var(--dkb-strip-line,rgba(0,0,0,.08))}'
    + '.dkb-strip-row{display:flex;gap:6px;overflow-x:auto;overscroll-behavior-x:contain;padding:8px 14px;scrollbar-width:none;-webkit-overflow-scrolling:touch}'
    + '.dkb-strip-row::-webkit-scrollbar{display:none}'
    + '.dkb-strip.fade-r .dkb-strip-row{-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 36px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 36px),transparent)}'
    + '.dkb-strip.fade-l .dkb-strip-row{-webkit-mask-image:linear-gradient(90deg,transparent,#000 36px);mask-image:linear-gradient(90deg,transparent,#000 36px)}'
    + '.dkb-strip.fade-l.fade-r .dkb-strip-row{-webkit-mask-image:linear-gradient(90deg,transparent,#000 36px,#000 calc(100% - 36px),transparent);mask-image:linear-gradient(90deg,transparent,#000 36px,#000 calc(100% - 36px),transparent)}'
    + '.dkb-chip{flex:none;-webkit-appearance:none;appearance:none;margin:0;border:1px solid var(--dkb-chip-line,rgba(0,0,0,.12));background:var(--dkb-chip-bg,transparent);color:var(--dkb-chip-fg,inherit);font-family:var(--dkb-chip-font,inherit);font-size:13px;font-weight:500;line-height:1;letter-spacing:0;padding:0 14px;height:36px;border-radius:999px;white-space:nowrap;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background-color .15s,color .15s,border-color .15s}'
    + '.dkb-chip.on{background:var(--dkb-chip-on-bg,#111);color:var(--dkb-chip-on-fg,#fff);border-color:var(--dkb-chip-on-line,transparent)}'
    + '.dkb-chip:focus-visible,.dkb-x:focus-visible{outline:2px solid var(--dkb-focus,#4d8dff);outline-offset:2px}'
    + '.dkb-chip[hidden]{display:none}'
    + '.dkb-x{display:none}'
    + 'html.dkb-narrow .dkb-x{display:grid;place-items:center;flex:none;margin-left:auto;width:40px;height:40px;padding:0;border:0;border-radius:12px;background:var(--dkb-x-bg,rgba(127,127,127,.14));color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}'
    + '.dkb-x svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2.2;stroke-linecap:round}'
    + '.dkb-tw{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}'
    + '@media (prefers-reduced-motion:reduce){.dkb-chip{transition:none}}';
  var st = D.createElement('style'); st.id = 'dkb-mobile-base'; st.textContent = CSS;
  (D.head || html).appendChild(st);

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || D).querySelectorAll(s)); }
  function shown(el) {
    if (!el || !el.isConnected) return false;
    var cs = W.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    return el.getClientRects().length > 0;
  }
  function check(t) {
    try {
      if (typeof t === 'function') return !!t();
      if (typeof t === 'string') return shown($(t));
    } catch (e) { /* treat as closed */ }
    return false;
  }
  function ready(fn) { if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', fn); else fn(); }

  var cfg = null, chips = [], strip = null, row = null, narrowMQ = null;

  function narrow() { return !!(narrowMQ && narrowMQ.matches); }
  function toTop() {
    if (!narrow()) return;
    if (cfg && cfg.scroller) { var s = $(cfg.scroller); if (s) s.scrollTop = 0; }
    W.scrollTo(0, 0);
  }

  /* ---------- back: close the top layer, then go home ---------- */
  function closeTop() {
    if (!cfg) return false;
    var layers = cfg.layers || [];
    for (var i = 0; i < layers.length; i++) {
      if (check(layers[i].open)) { try { layers[i].close(); } catch (e) { /* ignore */ } return true; }
    }
    if (cfg.home && !check(cfg.home.is)) { try { cfg.home.go(); } catch (e) { /* ignore */ } toTop(); return true; }
    return false;
  }
  W.DKB_DEMO = { closeTop: closeTop, inApp: inApp };

  /* ---------- section bar ---------- */
  function labelOf(el, n) {
    if (typeof n.label === 'function') return n.label(el);
    var src = n.label ? ($(n.label, el) || el) : el;
    return (src.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function edges() {
    if (!row || !strip) return;
    var max = row.scrollWidth - row.clientWidth;
    strip.classList.toggle('fade-l', row.scrollLeft > 4);
    strip.classList.toggle('fade-r', row.scrollLeft < max - 4);
  }
  function centre(b, smooth) {
    if (!row || !b) return;
    var x = b.offsetLeft - (row.clientWidth - b.offsetWidth) / 2;
    x = Math.max(0, Math.min(x, row.scrollWidth - row.clientWidth));
    if (row.scrollTo) row.scrollTo({ left: x, behavior: smooth ? 'smooth' : 'auto' }); else row.scrollLeft = x;
  }
  function sync(smooth) {
    if (!cfg || !cfg.nav) return;
    var n = cfg.nav, act = null;
    chips.forEach(function (c) {
      var on = n.isActive ? !!n.isActive(c.el) : c.el.classList.contains(n.activeClass || 'active');
      c.b.classList.toggle('on', on);
      if (on) { c.b.setAttribute('aria-current', 'page'); act = c.b; } else c.b.removeAttribute('aria-current');
      c.b.hidden = c.el.style.display === 'none' || c.el.hidden;
    });
    if (act) centre(act, smooth);
    edges();
  }
  function buildStrip() {
    var n = cfg.nav;
    if (!n || !n.items) return;
    var items = $$(n.items).filter(function (el) { return !(n.skip && n.skip(el)); });
    var anchor = n.after ? $(n.after) : null;
    if (!items.length || !anchor) return;
    strip = D.createElement('nav');
    strip.className = 'dkb-strip';
    strip.setAttribute('aria-label', n.aria || 'Sections');
    row = D.createElement('div'); row.className = 'dkb-strip-row';
    strip.appendChild(row);
    items.forEach(function (el) {
      var b = D.createElement('button');
      b.type = 'button'; b.className = 'dkb-chip';
      b.textContent = labelOf(el, n);
      b.addEventListener('click', function () {
        if (n.go) n.go(el); else el.click();
        toTop();
        setTimeout(function () { sync(true); }, 0);
      });
      row.appendChild(b);
      chips.push({ b: b, el: el });
    });
    anchor.parentNode.insertBefore(strip, anchor.nextSibling);
    row.addEventListener('scroll', edges, { passive: true });
    W.addEventListener('resize', function () { sync(false); });
    if (W.MutationObserver) {
      var mo = new MutationObserver(function () { sync(true); });
      items.forEach(function (el) { mo.observe(el, { attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-selected', 'aria-current'] }); });
    }
    sync(false);
  }

  /* ---------- close buttons for panels that have none on phones ---------- */
  var XSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  function addClosers() {
    (cfg.closers || []).forEach(function (c) {
      var host = $(c.into);
      if (!host || $('.dkb-x', host)) return;
      var b = D.createElement('button');
      b.type = 'button'; b.className = 'dkb-x'; b.setAttribute('aria-label', c.label || 'Close');
      b.innerHTML = XSVG;
      b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); try { c.close(); } catch (er) { /* ignore */ } });
      host.appendChild(b);
    });
  }

  /* ---------- wide tables scroll sideways inside their card ---------- */
  function wrapTables() {
    var sel = cfg.tables;
    if (!sel) return;
    function run() {
      if (!narrow()) return;
      $$(sel).forEach(function (t) {
        var p = t.parentNode;
        if (!p || (p.classList && p.classList.contains('dkb-tw'))) return;
        var w = D.createElement('div'); w.className = 'dkb-tw';
        p.insertBefore(w, t); w.appendChild(t);
      });
    }
    run();
    if (W.MutationObserver && D.body) {
      new MutationObserver(function (ms) {
        for (var i = 0; i < ms.length; i++) { if (ms[i].addedNodes.length) { run(); return; } }
      }).observe(D.body, { childList: true, subtree: true });
    }
  }

  /* ---------- scroll to top after the demo switches page ---------- */
  function wrapNav() {
    (cfg.wrap || []).forEach(function (name) {
      var f = W[name];
      if (typeof f !== 'function' || f.__dkb) return;
      var g = function () { var r = f.apply(this, arguments); toTop(); return r; };
      g.__dkb = true;
      try { W[name] = g; } catch (e) { /* read only */ }
    });
  }

  /* ---------- inside the app, the app owns the back stack ---------- */
  if (inApp) {
    try {
      var H = W.history, rep = H.replaceState;
      H.pushState = function (s, t, u) { return rep.call(H, s, t, u); };
    } catch (e) { /* ignore */ }
    W.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var h = a.getAttribute('href') || '';
      if (h.charAt(0) === '#') {
        if (a.target && a.target !== '_self') return;
        e.preventDefault();
        var t = h.length > 1 ? D.getElementById(decodeURIComponent(h.slice(1))) : null;
        if (t && t.scrollIntoView) t.scrollIntoView({ block: 'start', behavior: 'smooth' });
        return;
      }
      /* links that would replace the whole app open in a new tab instead */
      var base = D.querySelector('base[target]');
      var tgt = a.getAttribute('target') || (base ? base.getAttribute('target') : '');
      if (tgt === '_top' || tgt === '_parent') { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
    });
  }

  /* ---------- public entry ---------- */
  W.DKB_MOBILE = function (c) {
    cfg = c || {};
    var w = cfg.narrow || 760;
    narrowMQ = W.matchMedia ? W.matchMedia('(max-width: ' + w + 'px)') : null;
    function flag() { html.classList.toggle('dkb-narrow', narrow()); }
    flag();
    if (narrowMQ) { if (narrowMQ.addEventListener) narrowMQ.addEventListener('change', flag); else if (narrowMQ.addListener) narrowMQ.addListener(flag); }
    ready(function () {
      buildStrip();
      addClosers();
      wrapTables();
      wrapNav();
      if (cfg.after) { try { cfg.after(); } catch (e) { /* ignore */ } }
    });
  };
})(window, document);
