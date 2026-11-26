/* The page around the Campaign Ops app in the live demo.
   It switches the app into demo mode, draws notifications the way a phone
   would, and, inside the portfolio, keeps the demo's steps out of the
   browser's back history and lets the portfolio's back button close the
   demo's own panels first. The app itself is console-ui/app.js, unchanged. */
(function () {
  'use strict';
  window.CAMPAIGN_OPS_DEMO = true;

  var html = document.documentElement;
  var framed = false;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }
  if (framed) html.classList.add('demo-framed');
  if (/[?&]embed=app(&|$)/.test(location.search)) html.classList.add('demo-in-app');
  if (framed) {
    /* Opening a change or an account would otherwise add steps to the portfolio's own back history. */
    history.pushState = function () {};
  }

  /* ---------- a notification, drawn like a phone's ---------- */
  var hideTimer = null;
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function open(url) {
    var hash = String(url || '').replace(/^[^#]*/, '');
    hide();
    if (!hash) return;
    history.replaceState(null, '', location.pathname + location.search + hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
  function hide() {
    var box = document.getElementById('demoNote');
    clearTimeout(hideTimer);
    if (box) box.classList.remove('on');
  }
  function draw(n) {
    var box = document.getElementById('demoNote');
    if (!box || !n) return;
    box.innerHTML =
      '<button type="button" class="demo-note-card' + (n.urgent ? ' urgent' : '') + '">' +
        '<img src="icons/icon-192.png" alt="" width="38" height="38">' +
        '<span class="demo-note-text">' +
          '<span class="demo-note-top"><b>Campaign Ops</b><small>now</small></span>' +
          '<b class="demo-note-title">' + esc(n.title) + '</b>' +
          '<span class="demo-note-body">' + esc(n.body) + '</span>' +
        '</span>' +
      '</button>';
    box.querySelector('button').addEventListener('click', function () { open(n.url); });
    /* the next frame, so the slide in actually animates */
    requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add('on'); }); });
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 7000);
  }

  /* ---------- the portfolio's back button ---------- */
  function shown(el) { return !!(el && el.getClientRects().length); }
  window.DKB_DEMO = {
    closeTop: function () {
      var modalX = document.querySelector('#modal [data-act="window-close"]');
      if (shown(modalX)) { modalX.click(); return true; }
      var sheetX = document.querySelector('#sheet [data-act="close-sheet"]');
      if (shown(sheetX)) { sheetX.click(); return true; }
      var back = document.querySelector('[data-act="acct-back"]');
      if (shown(back)) { back.click(); return true; }
      var home = document.querySelector('.nav [data-act="nav"][data-id="home"]');
      if (home && home.getAttribute('aria-current') !== 'page' && shown(home)) { home.click(); window.scrollTo(0, 0); return true; }
      return false;
    }
  };

  /* ---------- start: once the app has drawn, replay this morning's notification ---------- */
  function begin() {
    var engine = window.CampaignOpsDemo;
    if (!engine) return;
    engine.onNotice(draw);
    var app = document.getElementById('app');
    var started = false;
    function go() {
      if (started) return;
      started = true;
      setTimeout(function () { engine.start(); }, 900);
    }
    if (app.querySelector('.frame')) { go(); return; }
    var watch = new MutationObserver(function () {
      if (app.querySelector('.frame')) { watch.disconnect(); go(); }
    });
    watch.observe(app, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', begin);
  else begin();
})();
