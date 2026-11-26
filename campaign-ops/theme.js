/* Sets light or dark before the page draws, so it never flashes the wrong colors.
   "system" (the default) follows the phone or computer. */
(function () {
  'use strict';
  var pick = 'system';
  try {
    pick = localStorage.getItem('campaign-ops-theme') || 'system';
  } catch (e) {
    /* storage blocked: follow the system */
  }
  var dark = pick === 'dark' || (pick !== 'light' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#0A0B14' : '#F3F4F9');
})();
