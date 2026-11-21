/* =====================================================================
   Demo kit
   Stands in for the Google Apps Script server so each tool runs in the
   browser on sample data. Every community, person, number and website
   here is fictional. Built by Debashish Kumar Bora.
   ===================================================================== */
(function (W) {
  'use strict';
  var KIT = W.KIT = {};

  /* ---------------- server stand in: google.script.run ---------------- */
  var H = KIT.H = {};
  KIT.delay = {};
  function clone(v) { return v === undefined || v === null ? v : JSON.parse(JSON.stringify(v)); }
  KIT.clone = clone;
  function runner() {
    var ok = null, fail = null, uo;
    var base = {
      withSuccessHandler: function (f) { ok = f; return p; },
      withFailureHandler: function (f) { fail = f; return p; },
      withUserObject: function (o) { uo = o; return p; }
    };
    var p = new Proxy(base, {
      get: function (t, k) {
        if (k in t) return t[k];
        if (typeof k !== 'string') return undefined;
        return function () {
          var a = [].slice.call(arguments), h = H[k], ms = KIT.delay[k] !== undefined ? KIT.delay[k] : 240;
          if (typeof ms === 'function') ms = ms.apply(null, a);
          setTimeout(function () {
            var r;
            try {
              if (!h) throw new Error('This action is turned off in the demo.');
              r = h.apply(null, a);
            } catch (e) { if (fail) fail(e, uo); else if (W.console) console.error(e); return; }
            Promise.resolve(r).then(function (v) { if (ok) ok(clone(v), uo); }, function (e) { if (fail) fail(e, uo); });
          }, ms * (0.85 + Math.random() * 0.3));
        };
      }
    });
    return p;
  }
  var gs = {
    url: { getLocation: function (cb) { var q = {}; String(W.location.search || '').replace(/^\?/, '').split('&').forEach(function (kv) { if (!kv) return; var i = kv.indexOf('='); q[decodeURIComponent(i < 0 ? kv : kv.slice(0, i))] = decodeURIComponent(i < 0 ? '' : kv.slice(i + 1)); }); setTimeout(function () { cb({ parameter: q, parameters: {}, hash: '' }); }, 0); } },
    history: { replace: function () {}, push: function () {}, setChangeHandler: function () {} },
    host: { close: function () {}, setHeight: function () {}, setWidth: function () {}, editor: { focus: function () {} } }
  };
  Object.defineProperty(gs, 'run', { get: runner });
  W.google = W.google || {};
  W.google.script = gs;

  /* ---------------- dates ---------------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dnum(iso) { var p = iso.split('-'); return Math.floor(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000); }
  function fromNum(n) { var d = new Date(n * 86400000); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  function add(iso, n) { return fromNum(dnum(iso) + n); }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONF = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var TODAY = isoOf(new Date()), TNUM = dnum(TODAY), YDAY = add(TODAY, -1);
  KIT.d = {
    today: TODAY, yesterday: YDAY, add: add, num: dnum, fromNum: fromNum, MON: MON, MONF: MONF,
    text: function (iso, year) { return MON[+iso.slice(5, 7) - 1] + ' ' + (+iso.slice(8, 10)) + (year ? ', ' + iso.slice(0, 4) : ''); },
    long: function (iso) { return MONF[+iso.slice(5, 7) - 1] + ' ' + (+iso.slice(8, 10)) + ', ' + iso.slice(0, 4); },
    monthLabel: function (ym) { return MONF[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4); },
    monthStart: function (iso, back) { var y = +iso.slice(0, 4), m = +iso.slice(5, 7) - 1 - (back || 0); while (m < 0) { m += 12; y--; } return y + '-' + pad(m + 1) + '-01'; },
    monthEnd: function (iso) { var y = +iso.slice(0, 4), m = +iso.slice(5, 7); return fromNum(Math.floor(Date.UTC(y, m, 1) / 86400000) - 1); },
    days: function (a, b) { return dnum(b) - dnum(a) + 1; },
    dow: function (iso) { return new Date(dnum(iso) * 86400000).getUTCDay(); },
    nowText: function () { var d = new Date(), h = d.getHours(), m = d.getMinutes(); return KIT.d.text(TODAY, true) + ' at ' + ((h % 12) || 12) + ':' + pad(m) + ' ' + (h < 12 ? 'AM' : 'PM'); },
    timeText: function () { var d = new Date(), h = d.getHours(), m = d.getMinutes(); return ((h % 12) || 12) + ':' + pad(m) + ' ' + (h < 12 ? 'AM' : 'PM'); }
  };
  KIT.range = function (period, from, to) {
    var y = YDAY, f = y, e = y;
    if (period === 'custom' && from && to) return { from: from, to: to };
    if (period === 'thisMonth') { f = KIT.d.monthStart(TODAY, 0); if (f > y) { f = KIT.d.monthStart(TODAY, 1); e = KIT.d.monthEnd(f); } }
    else if (period === 'lastMonth') { f = KIT.d.monthStart(TODAY, 1); e = KIT.d.monthEnd(f); }
    else { var n = { yesterday: 1, last7: 7, last14: 14, last30: 30, last90: 90 }[period] || 30; f = add(y, -(n - 1)); }
    return { from: f, to: e };
  };
  KIT.prevRange = function (r, compare) {
    if (compare === 'year') return { from: add(r.from, -364), to: add(r.to, -364) };
    var n = KIT.d.days(r.from, r.to);
    return { from: add(r.from, -n), to: add(r.from, -1) };
  };

  /* ---------------- deterministic noise ---------------- */
  function hr(a, b) {
    var t = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0;
    t = Math.imul(t ^ (t >>> 13), 1274126177); t ^= t >>> 16;
    return (t >>> 0) / 4294967296;
  }
  KIT.hr = hr;
  KIT.pick = function (list, seed) { return list[Math.floor(hr(seed, 7) * list.length) % list.length]; };

  /* ---------------- the fictional portfolio ----------------
     16 apartment communities in a made up city, Riverton. */
  var CITY = 'Riverton';
  KIT.CITY = CITY;
  KIT.BRAND = 'Vertex';
  var C = [
    ['3184027761', 'Harbor Commons', 'the riverfront', 312, 7200, 1.62, 0.046, 0.128, 0.22, 0.12, ['rooftop terrace', 'riverfront trail', 'fitness studio', 'heated parking']],
    ['5527413908', 'The Linden', 'Old Town', 276, 6400, 1.88, 0.041, 0.104, 0.10, 0.06, ['saltwater pool', 'coworking lounge', 'pet spa', 'in-unit laundry']],
    ['2049618835', 'Cedar Row', 'Northgate', 198, 5100, 1.71, 0.044, 0.112, 0.06, 0.02, ['townhome layouts', 'private patios', 'dog run', 'garage parking']],
    ['7390251146', 'Willow Park Flats', 'Willow Park', 164, 4300, 1.55, 0.038, 0.118, 0.14, 0.09, ['park views', 'bike storage', 'resident lounge', 'package lockers']],
    ['6612980437', 'The Merritt', 'Midtown', 240, 4800, 2.05, 0.036, 0.094, 0.04, -0.03, ['skyline views', 'fitness center', 'clubroom', 'concierge']],
    ['4471039952', 'Aster Yards', 'the Arts District', 220, 4600, 1.94, 0.039, 0.101, 0.12, 0.05, ['art studio', 'rooftop deck', 'EV charging', 'pet spa']],
    ['8803316624', 'Brookline Lofts', 'Brookline', 132, 3500, 1.48, 0.043, 0.122, 0.02, 0.04, ['exposed brick', 'tall ceilings', 'courtyard', 'bike room']],
    ['1958274403', 'The Calloway', 'Lakeside', 188, 3900, 1.79, 0.040, 0.109, 0.08, 0.10, ['lake access', 'sauna', 'fitness studio', 'heated parking']],
    ['3365091278', 'Fenwick Place', 'Fenwick', 150, 3200, 1.66, 0.037, 0.098, -0.05, -0.08, ['walk-in closets', 'business center', 'grill stations', 'playground']],
    ['9014473365', 'Lakeview Terrace', 'Lakeside', 210, 3600, 1.58, 0.045, 0.131, 0.10, 0.18, ['lake views', 'balconies', 'pool', 'fire pits']],
    ['2287765019', 'The Hartley', 'Downtown', 260, 3300, 2.21, 0.034, 0.087, 0.16, -0.06, ['downtown views', 'sky lounge', 'fitness center', 'pet park']],
    ['5530192846', 'Orchard House', 'Eastwood', 120, 2700, 1.44, 0.042, 0.126, 0.03, 0.07, ['garden plots', 'community room', 'bike storage', 'quiet layouts']],
    ['7716204583', 'Birch Hollow', 'Southridge', 180, 3000, 1.69, 0.040, 0.108, 0, 0, ['wooded trails', 'private garages', 'pool', 'dog park'], 330],
    ['4108863327', 'The Wren', 'Midtown', 154, 2800, 1.83, 0.038, 0.099, 0, 0, ['rooftop lounge', 'coworking', 'pet spa', 'smart locks'], 250],
    ['6629940185', 'Copperfield', 'Northgate', 140, 2300, 1.52, 0.041, 0.115, -0.02, 0.05, ['big floor plans', 'heated parking', 'fitness room', 'playground']],
    ['3841157702', 'The Ellery', 'Old Town', 96, 1600, 1.74, 0.036, 0.097, -0.10, -0.04, ['historic building', 'courtyard', 'bike room', 'storage'], null, 52]
  ];
  var MONTHF = [0.86, 0.88, 0.95, 1.04, 1.12, 1.16, 1.15, 1.10, 1.02, 0.96, 0.90, 0.86];
  var WDF = [0.80, 1.08, 1.07, 1.05, 1.02, 0.96, 0.82];
  KIT.COMMS = C.map(function (r, i) {
    var name = r[1], short = name.replace(/^The /, '');
    var dom = short.toLowerCase().replace(/[^a-z]/g, '') + '.example';
    return {
      i: i, id: r[0], name: name, short: short, hood: r[2], units: r[3], spend: r[4], cpc: r[5], ctr: r[6], cvr: r[7],
      growth: r[8], eff: r[9], amen: r[10], start: r[11] || null, stop: r[12] || null, domain: dom, url: 'https://www.' + dom,
      occ: Math.round((0.9 + hr(i, 31) * 0.08) * 1000) / 1000
    };
  });
  KIT.byName = function (n) { n = String(n || '').toLowerCase(); return KIT.COMMS.filter(function (c) { return c.name.toLowerCase() === n; })[0] || null; };
  KIT.byId = function (id) { return KIT.COMMS.filter(function (c) { return c.id === String(id); })[0] || null; };
  KIT.fmtId = function (id) { return String(id).replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3'); };

  /* one account, one day: impressions, clicks, cost, conversions */
  var CACHE = {};
  function day(ci, iso) {
    var key = ci + '|' + iso; if (CACHE[key]) return CACHE[key];
    var c = KIT.COMMS[ci], n = dnum(iso), ago = TNUM - n, out = { impr: 0, clicks: 0, cost: 0, conv: 0 };
    if ((c.start && ago > c.start) || (c.stop && ago < c.stop) || ago < 1) { CACHE[key] = out; return out; }
    var mo = +iso.slice(5, 7) - 1, wd = new Date(n * 86400000).getUTCDay();
    var trend = Math.pow(1 + c.growth, -ago / 365), eff = Math.pow(1 + c.eff, -ago / 365);
    if (c.start) trend *= Math.min(1, 0.55 + (c.start - ago) / 120);
    var cost = c.spend / 30.4 * MONTHF[mo] * WDF[wd] * trend * (0.86 + hr(ci * 7 + 1, n) * 0.28);
    var cpc = c.cpc * (0.9 + hr(ci * 7 + 2, n) * 0.2) * (1 + 0.04 * Math.sin(n / 40));
    var clicks = cost / cpc;
    var ctr = c.ctr * Math.pow(1.07, -ago / 365) * (0.92 + hr(ci * 7 + 3, n) * 0.16);
    var conv = clicks * c.cvr * eff * MONTHF[mo] * (0.72 + hr(ci * 7 + 4, n) * 0.56);
    /* the stories the alerts and the chat pick up */
    if (c.name === 'The Merritt' && ago <= 9) conv *= 0.06;
    if (c.name === 'Aster Yards' && ago <= 14) { cost *= 1.28; clicks *= 1.22; conv *= 0.78; }
    if (c.name === 'Cedar Row' && ago <= 30) { cost *= 0.92; }
    if (c.name === 'Lakeview Terrace' && ago <= 30) { conv *= 1.18; }
    out = { impr: Math.round(clicks / ctr), clicks: Math.round(clicks), cost: Math.round(cost * 100) / 100, conv: Math.round(conv * 10) / 10 };
    CACHE[key] = out; return out;
  }
  KIT.day = day;
  KIT.sumDays = function (ci, from, to) {
    var t = { impr: 0, clicks: 0, cost: 0, conv: 0 };
    for (var n = dnum(from), e = dnum(to); n <= e; n++) { var x = day(ci, fromNum(n)); t.impr += x.impr; t.clicks += x.clicks; t.cost += x.cost; t.conv += x.conv; }
    t.cost = Math.round(t.cost * 100) / 100; t.conv = Math.round(t.conv * 10) / 10;
    return t;
  };
  KIT.series = function (ci, from, to) { var out = []; for (var n = dnum(from), e = dnum(to); n <= e; n++) { var iso = fromNum(n), x = day(ci, iso); out.push({ d: iso, impr: x.impr, clicks: x.clicks, cost: x.cost, conv: x.conv }); } return out; };
  KIT.derive = function (t) {
    return {
      impr: t.impr, clicks: t.clicks, cost: t.cost, conv: t.conv,
      ctr: t.impr ? t.clicks / t.impr : null, cvr: t.clicks ? t.conv / t.clicks : null,
      cpa: t.conv >= 0.5 ? t.cost / t.conv : null, cpc: t.clicks ? t.cost / t.clicks : null
    };
  };
  /* impression share, steady per account with small drift */
  KIT.share = function (ci, from) {
    var c = KIT.COMMS[ci], n = dnum(from), lb = 0.06 + hr(ci, 91) * 0.16, lr = 0.12 + hr(ci, 92) * 0.18;
    if (c.name === 'Cedar Row') lb = 0.38;
    if (c.name === 'Harbor Commons') lb = 0.03;
    lb = Math.max(0.01, lb + Math.sin(n / 60 + ci) * 0.03); lr = Math.max(0.05, lr + Math.cos(n / 70 + ci) * 0.03);
    return { is: Math.max(0.2, 1 - lb - lr), isB: lb, isR: lr };
  };

  /* ---------------- campaigns, ad groups, keywords ---------------- */
  var TYPES = {
    SEARCH: 'Search', PERFORMANCE_MAX: 'Performance Max', DISPLAY: 'Display', DEMAND_GEN: 'Demand Gen', VIDEO: 'Video'
  };
  KIT.TYPES = TYPES;
  var CAMPS = {};
  KIT.camps = function (ci) {
    if (CAMPS[ci]) return CAMPS[ci];
    var c = KIT.COMMS[ci], s = c.short, id0 = +c.id.slice(-6);
    var list = [
      { key: 'brand', name: s + ' | Brand Search', type: 'SEARCH', share: 0.17, cpaF: 0.42, ctrF: 2.4, groups: [['Brand Name', ['"' + c.name.toLowerCase() + '"', '[' + s.toLowerCase() + ' apartments]']], ['Brand + Apartments', ['"' + s.toLowerCase() + ' ' + CITY.toLowerCase() + '"']]] },
      { key: 'generic', name: s + ' | Apartments in ' + CITY, type: 'SEARCH', share: 0.33, cpaF: 1.12, ctrF: 0.9, groups: [['Apartments Near Me', ['apartments near me', '"apartments for rent near me"']], ['Apartments in ' + CITY, ['"apartments in ' + CITY.toLowerCase() + '"', '[' + CITY.toLowerCase() + ' apartments]']], ['Luxury Apartments', ['"luxury apartments ' + CITY.toLowerCase() + '"']]] },
      { key: 'bed', name: s + ' | Bedroom Local Search', type: 'SEARCH', share: 0.14, cpaF: 1.2, ctrF: 1.0, groups: [['Studio', ['"studio apartments ' + CITY.toLowerCase() + '"']], ['1 Bedroom', ['"1 bedroom apartments ' + CITY.toLowerCase() + '"']], ['2 Bedroom', ['"2 bedroom apartments ' + CITY.toLowerCase() + '"']]] },
      { key: 'pmax', name: s + ' | Performance Max', type: 'PERFORMANCE_MAX', share: 0.24, cpaF: 0.92, ctrF: 0.6, assets: ['All Floor Plans', 'Move-in Ready'] },
      { key: 'display', name: s + ' | Display Remarketing', type: 'DISPLAY', share: 0.07, cpaF: 1.7, ctrF: 0.25, groups: [['Site Visitors', []]] },
      { key: 'dg', name: s + ' | Demand Gen', type: 'DEMAND_GEN', share: 0.05, cpaF: 2.3, ctrF: 0.4, groups: [['Lookalike Renters', []]] }
    ];
    if (ci % 3 === 2) list[2].status = 'PAUSED';
    var wConv = 0, wClick = 0, wImpr = 0;
    list.forEach(function (k) { var on = k.status !== 'PAUSED' ? 1 : 0.02; k.w = k.share * on; wConv += k.w / k.cpaF; wClick += k.w * Math.sqrt(k.ctrF); wImpr += k.w / Math.sqrt(k.ctrF); });
    list.forEach(function (k, j) {
      k.id = String(20000000000 + id0 * 10 + j);
      k.status = k.status || 'ENABLED';
      k.typeLabel = TYPES[k.type];
      k.fc = k.w / wConv / k.cpaF; k.fk = k.w * Math.sqrt(k.ctrF) / wClick; k.fi = k.w / Math.sqrt(k.ctrF) / wImpr; k.fs = k.w / list.reduce(function (a, x) { return a + x.w; }, 0);
      k.adGroups = (k.groups || []).map(function (g, gi) { return { id: String(150000000000 + id0 * 100 + j * 10 + gi), name: g[0], status: k.key === 'bed' && gi === 0 && ci % 2 ? 'PAUSED' : 'ENABLED', keywords: g[1] }; });
      k.assetGroups = (k.assets || []).map(function (a, ai) { return { id: String(6500000000 + id0 * 10 + ai), name: a, status: 'ENABLED' }; });
    });
    CAMPS[ci] = list; return list;
  };
  KIT.campSum = function (ci, k, from, to) {
    var t = KIT.sumDays(ci, from, to);
    var wob = 0.9 + hr(ci * 13 + (+k.id.slice(-1)), dnum(from)) * 0.2;
    return { impr: Math.round(t.impr * k.fi), clicks: Math.round(t.clicks * k.fk), cost: Math.round(t.cost * k.fs * 100) / 100, conv: Math.round(t.conv * k.fc * wob * 10) / 10 };
  };

  /* ---------------- search terms ---------------- */
  var TERMS = {};
  KIT.terms = function (ci) {
    if (TERMS[ci]) return TERMS[ci];
    var c = KIT.COMMS[ci], city = CITY.toLowerCase(), hood = c.hood.replace(/^the /, '').toLowerCase(), nm = c.name.toLowerCase(), sh = c.short.toLowerCase();
    var T = [
      [nm, 'Brand', 'brand', 0, 0.16, 2.2],
      [sh + ' apartments', 'Brand', 'brand', 1, 0.07, 2.0],
      [sh + ' ' + city + ' reviews', 'Brand', 'brand', 1, 0.02, 0.8],
      ['apartments in ' + city, 'Location', 'generic', 1, 0.08, 1.0],
      ['apartments near ' + hood, 'Location', 'generic', 0, 0.05, 1.1],
      [hood + ' apartments for rent', 'Location', 'generic', 1, 0.045, 1.0],
      ['apartments near me', 'Location', 'generic', 0, 0.06, 0.7],
      ['luxury apartments ' + city, 'Amenities', 'generic', 2, 0.035, 0.9],
      ['apartments with ' + c.amen[0], 'Amenities', 'generic', 2, 0.02, 1.2],
      [c.amen[1] + ' apartments ' + city, 'Amenities', 'generic', 2, 0.015, 0.9],
      ['2 bedroom apartments ' + city, '2 bedroom', 'bed', 2, 0.05, 1.1],
      ['2 bed 2 bath apartment ' + hood, '2 bedroom', 'bed', 2, 0.02, 1.0],
      ['1 bedroom apartment ' + city, '1 bedroom', 'bed', 1, 0.045, 1.05],
      ['studio apartments ' + city, 'Studio', 'bed', 0, 0.03, 0.8],
      ['pet friendly apartments ' + city, 'Pets', 'generic', 1, 0.03, 1.0],
      ['dog friendly apartments ' + hood, 'Pets', 'generic', 1, 0.015, 0.9],
      ['cheap apartments ' + city, 'Price', 'generic', 1, 0.03, 0.15],
      ['apartments under 1000 ' + city, 'Price', 'generic', 0, 0.025, 0.05],
      [city + ' apartments move in special', 'Price', 'generic', 0, 0.015, 0.9],
      ['short term rentals ' + city, 'Not a renter', 'generic', 0, 0.02, 0],
      ['apartment jobs ' + city, 'Not a renter', 'generic', 1, 0.012, 0],
      ['how to break a lease', 'Not a renter', 'generic', 0, 0.01, 0],
      ['houses for sale ' + hood, 'Not a renter', 'generic', 2, 0.018, 0],
      ['wheelchair accessible apartments ' + city, 'Accessibility', 'generic', 1, 0.006, 0.4],
      ['apartments for seniors ' + city, 'Age', 'generic', 0, 0.008, 0.3]
    ];
    TERMS[ci] = T.map(function (t, j) {
      var w = t[4] * (0.7 + hr(ci, 200 + j) * 0.6);
      return { term: t[0], theme: t[1], camp: t[2], group: t[3], w: w, cvrF: t[5] * (t[5] ? (0.7 + hr(ci, 300 + j) * 0.6) : 0), sensitive: /Accessibility|Age/.test(t[1]) };
    });
    var tw = TERMS[ci].reduce(function (a, x) { return a + x.w; }, 0), tc = TERMS[ci].reduce(function (a, x) { return a + x.w * x.cvrF; }, 0);
    TERMS[ci].forEach(function (x) { x.fc = x.w / tw; x.fv = tc ? x.w * x.cvrF / tc : 0; });
    return TERMS[ci];
  };
  /* terms with numbers for a range: search campaigns only (about 64% of clicks) */
  KIT.termRows = function (ci, from, to) {
    var t = KIT.sumDays(ci, from, to), srch = 0.64, cpcK = t.clicks ? t.cost / t.clicks : 0;
    return KIT.terms(ci).map(function (x, j) {
      var clicks = Math.round(t.clicks * srch * x.fc * (0.85 + hr(ci + j, dnum(from)) * 0.3));
      var cost = Math.round(clicks * cpcK * (x.camp === 'brand' ? 0.55 : 1.12) * 100) / 100;
      var conv = Math.round(t.conv * 0.66 * x.fv * 10) / 10;
      return { term: x.term, theme: x.theme, camp: x.camp, group: x.group, clicks: clicks, impr: Math.round(clicks / (x.camp === 'brand' ? 0.21 : 0.055)), cost: cost, conv: conv, sensitive: x.sensitive };
    }).filter(function (x) { return x.clicks > 0; });
  };

  KIT.money = function (n) { n = Number(n) || 0; return '$' + n.toLocaleString('en-US', { minimumFractionDigits: Math.abs(n) >= 1000 ? 0 : 2, maximumFractionDigits: Math.abs(n) >= 1000 ? 0 : 2 }); };
  KIT.int = function (n) { return Math.round(Number(n) || 0).toLocaleString('en-US'); };
  KIT.pct = function (f, d) { return (f * 100).toFixed(d === undefined ? 1 : d) + '%'; };
  KIT.chg = function (a, b) { return b ? (a - b) / Math.abs(b) : null; };
  KIT.round = function (n, d) { var k = Math.pow(10, d || 0); return Math.round(n * k) / k; };

  /* ---------------- fonts and the demo badge ---------------- */
  var here = (function () { var s = document.currentScript && document.currentScript.src; return s ? s.replace(/[^\/]*$/, '') : 'kit/'; })();
  var css = '@font-face{font-family:"EB Garamond";font-style:normal;font-weight:400;font-display:swap;src:url(' + here + 'fonts/eb-garamond-latin-400-normal.woff2) format("woff2")}'
    + '@font-face{font-family:"EB Garamond";font-style:normal;font-weight:500;font-display:swap;src:url(' + here + 'fonts/eb-garamond-latin-500-normal.woff2) format("woff2")}'
    + '@font-face{font-family:"EB Garamond";font-style:italic;font-weight:400;font-display:swap;src:url(' + here + 'fonts/eb-garamond-latin-400-italic.woff2) format("woff2")}'
    + '@font-face{font-family:"Carlito";font-style:normal;font-weight:400;font-display:swap;src:url(' + here + 'fonts/carlito-latin-400-normal.woff2) format("woff2")}'
    + '@font-face{font-family:"Carlito";font-style:normal;font-weight:700;font-display:swap;src:url(' + here + 'fonts/carlito-latin-700-normal.woff2) format("woff2")}'
    + '.dkb-demo{position:fixed;z-index:2147483000;right:14px;bottom:14px;display:flex;align-items:center;gap:8px;max-width:calc(100vw - 28px);padding:7px 8px 7px 12px;border-radius:999px;background:rgba(17,17,17,.92);color:#fff;font:500 12px/1.3 "Carlito","Segoe UI",Arial,sans-serif;letter-spacing:.01em;box-shadow:0 8px 24px -10px rgba(0,0,0,.5);transition:opacity .4s,transform .4s}'
    + '.dkb-demo a{color:#fff;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.35);white-space:nowrap}'
    + '.dkb-demo b{font-weight:700;color:#CDA176;white-space:nowrap}'
    + '.dkb-demo button{all:unset;cursor:pointer;width:22px;height:22px;display:grid;place-items:center;border-radius:50%;color:#bbb;font-size:15px;line-height:1}'
    + '.dkb-demo button:hover{background:rgba(255,255,255,.12);color:#fff}'
    + '.dkb-demo.left{right:auto;left:14px}' + '.dkb-demo.mini{padding:6px 8px 6px 11px}.dkb-demo.mini>span,.dkb-demo.mini>a{display:none}' + '.dkb-demo.off{opacity:0;transform:translateY(10px);pointer-events:none}'
    + '@media(max-width:760px){.dkb-demo,.dkb-demo.left{left:auto;right:10px;bottom:10px;font-size:11px;padding:6px 6px 6px 10px}.dkb-demo .lg{display:none}}'
    + '@media print{.dkb-demo{display:none}}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);
  KIT.badge = function (where) {
    function put() {
      if (document.querySelector('.dkb-demo')) return;
      var b = document.createElement('div'); b.className = 'dkb-demo' + (where === 'left' ? ' left' : ''); b.setAttribute('role', 'note');
      b.innerHTML = '<b>Demo</b><span>Sample data, fictional communities<span class="lg">. Built by </span></span><a class="lg" href="https://debashishkumarbora.github.io/" target="_top" rel="noopener">Debashish Kumar Bora</a><button type="button" aria-label="Hide this note">×</button>';
      b.querySelector('button').onclick = function () { b.classList.add('off'); };
      document.body.appendChild(b);
      setTimeout(function () { b.classList.add('mini'); }, 7000);
      b.addEventListener('mouseenter', function () { b.classList.remove('mini'); });
      b.addEventListener('mouseleave', function () { b.classList.add('mini'); });
    }
    if (document.body) put(); else document.addEventListener('DOMContentLoaded', put);
  };
})(window);
