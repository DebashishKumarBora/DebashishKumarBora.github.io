/* Client Reports demo: the server side, on sample data. */
(function () {
  'use strict';
  var K = window.KIT, D = K.d, H = K.H;
  window.__BOOT__ = { mode: 'client', link: '', brand: {} };
  try { if (!localStorage.getItem('vxcr_pass')) localStorage.setItem('vxcr_pass', 'demo'); } catch (e) {}
  K.badge('left');

  var CI = 9, C = K.COMMS[CI];
  function sum(f, t) { return K.sumDays(CI, f, t); }
  function dailyRows(f, t) { return K.series(CI, f, t).map(function (x) { return [x.d, x.impr, x.clicks, Math.round(x.cost * 100) / 100, x.conv]; }); }
  function topCamp(f, t, pf, pt) {
    var best = null;
    K.camps(CI).forEach(function (k) {
      if (k.status !== 'ENABLED') return;
      var s = K.campSum(CI, k, f, t);
      if (!best || s.conv > best.s.conv) best = { k: k, s: s, p: K.campSum(CI, k, pf, pt) };
    });
    return best;
  }
  function records(f, t, n, isMonth) {
    var out = [], cur = sum(f, t), better = { conv: true, clicks: true };
    if (isMonth) {
      for (var b = 2; b <= 13; b++) { var ms = D.monthStart(f, b - 1), me = D.monthEnd(ms), x = sum(ms, me); if (x.conv >= cur.conv) better.conv = false; if (x.clicks >= cur.clicks) better.clicks = false; }
      if (better.conv) out.push({ type: 'month', metric: 'conv', months: 13 });
      else if (better.clicks) out.push({ type: 'month', metric: 'clicks', months: 13 });
    } else {
      for (var j = 1; j * n <= 390; j++) { var e = D.add(f, -1 - (j - 1) * n), s2 = D.add(e, -(n - 1)), y = sum(s2, e); if (y.conv >= cur.conv) better.conv = false; if (y.clicks >= cur.clicks) better.clicks = false; }
      if (better.conv) out.push({ type: 'period', metric: 'conv', months: 13 });
      else if (better.clicks) out.push({ type: 'period', metric: 'clicks', months: 13 });
    }
    var streak = 0; for (var d = t; d >= D.add(t, -365); d = D.add(d, -1)) { if (K.day(CI, d).conv >= 1) streak++; else break; }
    if (streak >= 10 && streak < 120) out.push({ type: 'streak', days: streak });
    var pk = null; K.series(CI, f, t).forEach(function (x) { if (!pk || x.clicks > pk.clicks) pk = x; });
    if (pk) { var top = true; K.series(CI, D.add(f, -395), D.add(f, -1)).forEach(function (x) { if (x.clicks >= pk.clicks) top = false; }); if (top) out.push({ type: 'day', date: pk.d, amount: pk.clicks, months: 13 }); }
    return out;
  }
  function devices(t) {
    var m = Math.round(t.clicks * 0.66), c = Math.round(t.clicks * 0.28);
    return [{ name: 'Mobile phones', clicks: m }, { name: 'Computers', clicks: c }, { name: 'Tablets', clicks: t.clicks - m - c }];
  }
  function period(key) {
    var f, t, pf, pt, label, compare;
    if (key === 'last30') { t = D.yesterday; f = D.add(t, -29); pt = D.add(f, -1); pf = D.add(pt, -29); label = 'Last 30 days'; compare = 'the previous 30 days'; }
    else { f = D.monthStart(D.today, 1); t = D.monthEnd(f); pf = D.monthStart(D.today, 2); pt = D.monthEnd(pf); label = D.MONF[+f.slice(5, 7) - 1]; compare = D.MONF[+pf.slice(5, 7) - 1]; }
    var T = sum(f, t), P = sum(pf, pt), top = topCamp(f, t, pf, pt);
    var share = T.conv ? Math.round(top.s.conv / T.conv * 100) : 0, tcpa = top.s.conv ? top.s.cost / top.s.conv : 0;
    return {
      label: label, compare: compare, from: f, to: t, prevFrom: pf, prevTo: pt, days: D.days(f, t),
      totals: T, prev: P, daily: dailyRows(f, t), prevDaily: dailyRows(pf, pt),
      top: { name: top.k.name, type: top.k.typeLabel, impr: top.s.impr, clicks: top.s.clicks, cost: top.s.cost, conv: top.s.conv, prev: top.p },
      highlight: 'People searching for ' + C.name + ' by name convert best: this campaign brought ' + share + '% of all conversions at ' + K.money(tcpa) + ' each.',
      devices: devices(T), records: records(f, t, D.days(f, t), key === 'lastMonth')
    };
  }
  function ads() {
    var hood = C.hood.replace(/^the /, ''), a = C.amen;
    function cap(x) { return x.replace(/(^|\s)\S/g, function (m) { return m.toUpperCase(); }); }
    return [
      { url: 'www.' + C.domain, headlines: [C.name + ' Apartments', cap(a[0]) + ' in ' + K.CITY, 'Tour This Week'], descriptions: ['Apartments in ' + hood + ' with ' + a[0] + ', ' + a[1] + ' and a ' + a[2] + '. Book a tour today.'] },
      { url: 'www.' + C.domain + '/floor-plans', headlines: ['Studios to 2 Bedrooms', cap(a[1]) + ' and ' + cap(a[3]), 'See Floor Plans'], descriptions: ['Bright homes in ' + hood + ' with in-home laundry and room to grow. See floor plans and pricing online.'] },
      { url: 'www.' + C.domain + '/amenities', headlines: [cap(hood) + ' Living', 'Pet Friendly Community', 'Schedule Your Tour'], descriptions: ['A ' + a[3] + ' out back, ' + a[0] + ' from home and a team that answers fast. Come see it in person.'] }
    ];
  }
  function searches() {
    return K.termRows(CI, D.add(D.yesterday, -29), D.yesterday).filter(function (x) { return x.theme !== 'Not a renter' && !x.sensitive && x.theme !== 'Price'; })
      .sort(function (a, b) { return b.clicks - a.clicks; }).slice(0, 5).map(function (x) { return x.term; });
  }
  function timeline() {
    var t = D.today;
    return {
      done: [
        { dateText: D.text(D.add(t, -19)), text: 'Refreshed the headlines in the main search campaign with the new lake view photos and current 2 bedroom availability.' },
        { dateText: D.text(D.add(t, -34)), text: 'Added sitelinks for floor plans, amenities and tour booking, so people land on the page they want.' },
        { dateText: D.text(D.add(t, -52)), text: 'Moved budget toward the searches that turn into tours most often.' }
      ],
      next: [
        { dateText: D.text(D.add(t, 6)), text: 'Launch a short video tour of the balconies and pool for YouTube and Demand Gen.' },
        { dateText: D.text(D.add(t, 18)), text: 'Test a new headline set built around the lake views.' }
      ]
    };
  }
  H.clientSignIn = function (pw, name, email) { return { ok: true, token: 'demo' }; };
  H.clientReport = function () {
    var y = sum(D.add(D.yesterday, -364), D.yesterday);
    var viewer = {}; try { viewer = JSON.parse(localStorage.getItem('vxcr_who') || '{}') || {}; } catch (e) {}
    return {
      name: C.name, viewer: { name: viewer.name || '' }, logo: '', updatedText: 'Today, ' + D.timeText(), stale: false, pending: false,
      sections: {}, notes: { text: 'Tours picked up as soon as the new lake view photos went live. We will keep the photo-led headlines running through the winter and share the video results next month.', atText: D.text(D.add(D.today, -6)) },
      timeline: timeline(),
      report: {
        periods: { last30: period('last30'), lastMonth: period('lastMonth') },
        ads: ads(), searches: searches(), year: { months: 12, clicks: y.clicks, conv: y.conv }, dataThroughText: D.long(D.yesterday)
      }
    };
  };
  K.delay.clientReport = 700;
  K.delay.clientSignIn = 500;
})();
