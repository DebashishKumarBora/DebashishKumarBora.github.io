/* Ads Intelligence demo, part 2: alerts, audit and the Explore tools. */
(function () {
  'use strict';
  var K = window.KIT, D = K.d, E = window.ENG, T = window.TOOLS2 = {};
  var CITY = K.CITY;
  function N(n) { return K.byName(n); }
  function cap(x) { return String(x).replace(/(^|\s)\S/g, function (m) { return m.toUpperCase(); }); }
  var LINK = 'https://ads.google.com/';
  T.TEAM = [{ email: E.ME, name: 'You' }, { email: 'morgan@vertex.example', name: 'Morgan Reyes' }, { email: 'taylor@vertex.example', name: 'Taylor Brooks' }, { email: 'casey@vertex.example', name: 'Casey Lin' }];

  /* ---------------- Fair Housing and policy line checks ---------------- */
  var FH = [
    [/\bfamil(y|ies)[- ]friendly\b|\bperfect for families\b|\bgreat for families\b/i, 'Familial status: describe the home, not who should live in it.'],
    [/\byoung professionals?\b|\bstudents? only\b|\bmature\b|\bseniors?\b|\bretirees?\b|\bempty nesters?\b|\badults? only\b|\bno kids\b|\bsingles?\b|\bcouples?\b/i, 'Age or familial status: this reads as a preference for who lives here.'],
    [/\bchristian\b|\bchurch\b|\bjewish\b|\bmuslim\b/i, 'Religion: never describe residents or the area by religion.'],
    [/\bhandicapped\b|\bable[- ]bodied\b|\bno wheelchairs\b/i, 'Disability: describe accessible features instead.'],
    [/\bexclusive\b|\bsafe neighborhood\b|\bsafest\b|\bprivate community\b/i, 'Steering risk: can read as who is welcome. Describe features instead.', 'warn']
  ];
  T.check = function (text, lim, hopa) {
    var issues = [], len = String(text || '').length;
    if (!len) issues.push({ level: 'block', term: '', why: 'Empty line.' });
    if (lim && len > lim) issues.push({ level: 'block', term: '', why: 'Too long: ' + len + ' of ' + lim + ' characters.' });
    FH.forEach(function (f) { var m = f[0].exec(text || ''); if (m && !(hopa && /senior|retiree|mature/i.test(m[0]))) issues.push({ level: f[2] || 'block', term: m[0], why: f[1] }); });
    if (/!!|\?\?/.test(text)) issues.push({ level: 'warn', term: '', why: 'Google limits repeated punctuation.' });
    if (/\b[A-Z]{5,}\b/.test(text) && !/\bVERTEX\b/.test(text)) issues.push({ level: 'warn', term: '', why: 'Google limits words in all capitals.' });
    return issues;
  };
  function line(text, lim, extra) { var o = { text: text, len: text.length, limit: lim, issues: T.check(text, lim), pin: 0 }; for (var k in (extra || {})) o[k] = extra[k]; return o; }

  /* ---------------- copy pools ---------------- */
  function pools(c) {
    var a = c.amen, hood = c.hood.replace(/^the /, ''), H = cap(hood), s = c.short, n = c.name;
    return {
      h: [n, s + ' Apartments', 'Apartments in ' + CITY, 'Tour ' + s + ' Today', cap(a[0]), cap(a[1]), cap(a[2]), cap(a[3]), 'Studios to 2 Bedrooms', 'Pet Friendly Apartments', 'Book a Tour Today', 'Now Leasing in ' + H, 'Move-In Ready Homes', 'Modern Apartment Homes', 'In-Home Laundry', H + ' Apartments', 'See Floor Plans Online', 'Schedule a Self Tour', 'Spacious Floor Plans', 'Apply Online in Minutes', 'Find Your Place in ' + CITY, 'Steps From ' + H, 'Homes With ' + cap(a[0]), 'Tour This Week', 'Fast Replies, Easy Tours', 'Bright, Open Layouts', 'Live in ' + H, 'Check Availability Now'],
      d: ['Modern apartments in ' + hood + ' with ' + a[0] + ', ' + a[1] + ' and a ' + a[2] + '. Book a tour today.', 'Studios to 2 bedrooms with in-home laundry and room to grow. See floor plans and pricing online.', 'A ' + a[3] + ', ' + a[0] + ' and a team that answers fast. Come see ' + n + ' in person.', 'Live near the best of ' + CITY + '. Tour ' + n + ' this week and find the floor plan that fits.', 'Pet friendly homes with ' + a[1] + '. Schedule an in-person or self-guided tour today.', 'Bright homes in ' + hood + ', minutes from shops and dining. Check availability and apply online.', 'See every floor plan, compare prices and book a tour in a few clicks. We reply fast.'],
      lh: ['Modern apartments in ' + hood + ' with ' + a[0] + ' and ' + a[1], 'Tour ' + n + ': studios to 2 bedrooms in ' + CITY, 'Find your next home in ' + hood + ', with ' + a[2] + ' and ' + a[3], n + ': bright homes, easy tours and fast replies', 'Apartments in ' + CITY + ' with ' + a[0] + '. Book your tour today'],
      cta: ['Book a tour', 'Learn more', 'Apply now', 'See plans', 'Sign up']
    };
  }
  function fill(list, n, lim, start) { var out = [], seen = {}; for (var i = 0; out.length < n && i < list.length * 2; i++) { var t = list[(i + (start || 0)) % list.length]; if (t.length <= lim && !seen[t.toLowerCase()]) { seen[t.toLowerCase()] = 1; out.push(t); } } return out; }
  var SPEC = {
    search: { label: 'Search', editor: 'Responsive search ad', paths: true, biz: false, spec: [{ k: 'h', label: 'Headlines', n: 15, max: 30, pins: 3 }, { k: 'd', label: 'Descriptions', n: 4, max: 90, pins: 2 }, { k: 'lh', label: 'Long headlines to reuse', n: 5, max: 90, extra: true, tip: 'For Performance Max, Display and YouTube, since search ads do not use long headlines' }] },
    pmax: { label: 'Performance Max', editor: 'Asset group', paths: false, biz: true, spec: [{ k: 'h', label: 'Headlines', n: 15, max: 30 }, { k: 'lh', label: 'Long headlines', n: 5, max: 90 }, { k: 'd', label: 'Descriptions', n: 5, max: 90 }] },
    display: { label: 'Display', editor: 'Responsive display ad', paths: false, biz: true, spec: [{ k: 'h', label: 'Headlines', n: 5, max: 30 }, { k: 'lh', label: 'Long headline', n: 1, max: 90 }, { k: 'd', label: 'Descriptions', n: 5, max: 90 }] },
    demandgen: { label: 'Demand Gen', editor: 'Demand Gen ad', paths: false, biz: true, spec: [{ k: 'h', label: 'Headlines', n: 5, max: 40 }, { k: 'lh', label: 'Long headlines', n: 5, max: 90 }, { k: 'd', label: 'Descriptions', n: 5, max: 90 }] },
    video: { label: 'YouTube video', editor: 'Video ad', paths: false, biz: true, spec: [{ k: 'h', label: 'Short headlines', n: 5, max: 15 }, { k: 'lh', label: 'Long headlines', n: 5, max: 90 }, { k: 'd', label: 'Descriptions', n: 5, max: 70 }, { k: 'cta', label: 'Calls to action', n: 5, max: 10 }] }
  };
  var ANGLES = [['Amenities first', 0], ['Location first', 6], ['Tour and availability first', 11]];
  T.adCopy = function (o) {
    var c = N(o.account) || K.COMMS[0], S = SPEC[o.type] || SPEC.search, P = pools(c), n = Math.max(1, Math.min(3, o.count || 1)), r = K.range(o.period || 'last90', o.from, o.to);
    var short = { h: P.h.concat(['Tours Daily', 'Pet Friendly', 'Apply Today', 'Lake Views', 'New Homes', 'See Plans', 'Book Now', 'Move In Soon']) };
    var ads = [];
    for (var a = 0; a < n; a++) {
      var parts = {}, kept = 0, fresh = 0;
      S.spec.forEach(function (sp) {
        var src = sp.k === 'h' ? (sp.max <= 15 ? short.h : P.h) : (sp.k === 'd' ? P.d : (sp.k === 'lh' ? P.lh : P.cta));
        var texts = fill(src, sp.n, sp.max, ANGLES[a][1] + (sp.k === 'd' ? a : 0));
        parts[sp.k] = texts.map(function (t, i) {
          var keep = o.mode === 'refresh' && sp.k === 'h' && i < 4 && a === 0;
          if (keep) kept++; else fresh++;
          var l = line(t, sp.max, { keep: keep, why: keep ? 'Rated Best by Google over the last 90 days' : (i === 0 && sp.k === 'h' ? 'Your community name, pinned so every ad leads with it' : '') });
          if (sp.k === 'h' && i === 0 && sp.pins) l.pin = 1;
          return l;
        });
      });
      ads.push({ name: n > 1 ? ANGLES[a][0] : (o.mode === 'refresh' ? 'Refreshed ad' : 'New ad'), angle: ANGLES[a][0] === 'Amenities first' ? 'Leads with ' + c.amen[0] + ' and ' + c.amen[1] + '.' : (a === 1 ? 'Leads with ' + c.hood + ' and ' + CITY + '.' : 'Leads with tours and availability.'), fresh: o.mode === 'scratch' ? undefined : fresh, kept: kept, parts: parts, business: c.name.length > 25 ? c.short : c.name, path1: 'Apartments', path2: o.adGroupName && /bed|studio/i.test(o.adGroupName) ? o.adGroupName.replace(/\s+/g, '-').slice(0, 15) : 'Tour' });
    }
    var tr = K.termRows(c.i, r.from, r.to).filter(function (x) { return x.conv > 0; }).sort(function (x, y) { return y.clicks - x.clicks; }).slice(0, 10);
    return {
      ok: true, account: c.name, type: o.type || 'search', typeLabel: S.label, mode: o.mode, range: E.rangeText(r), url: o.url || c.url + (o.adGroupName && /bed|studio/i.test(o.adGroupName) ? '/floor-plans' : ''), domain: c.domain, pageOk: true, pageBlocked: false,
      summary: o.mode === 'refresh' ? 'Kept the four headlines Google rates Best, replaced the weak ones with lines built on real searches, and checked every line for length, policy and Fair Housing.' : (o.mode === 'new' ? 'A new ad built from the searches that convert in this ad group and the landing page, with every line checked.' : 'Fresh copy from the community facts and the landing page, with every line checked.'),
      insights: ['People searching for ' + c.amen[0] + ' and ' + c.amen[1] + ' convert above the account average, so both lead.', 'The landing page mentions floor plans and tours above the fold, so the ad promises the same.', 'No line describes who should live here. Every line describes the home.'],
      asked: n, ads: ads, spec: S.spec, biz: S.biz, paths: S.paths, editor: S.editor, hopa: false, brief: c.name,
      assets: o.mode === 'scratch' ? [] : P.h.slice(0, 8).map(function (t, i) { return { text: t, kind: 'h', label: ['BEST', 'BEST', 'GOOD', 'GOOD', 'GOOD', 'LOW', 'LEARNING', 'LOW'][i], impressions: Math.round(9000 / (i + 1)), ctr: 6.4 - i * 0.5, conversions: Math.round(80 / (i + 1.4)) }; }),
      terms: tr.map(function (x) { return { text: x.term, clicks: x.clicks, conversions: x.conv }; })
    };
  };
  T.adCopyLine = function (o) {
    var c = N(o.brief) || K.COMMS[0], P = pools(c), src = o.kind === 'h' ? P.h : (o.kind === 'd' ? P.d : (o.kind === 'lh' ? P.lh : P.cta));
    var taken = {}; (o.others || []).forEach(function (t) { taken[String(t).toLowerCase()] = 1; });
    var opts = src.filter(function (t) { return t.length <= o.limit && !taken[t.toLowerCase()]; }).slice(0, 3);
    var why = ['built on a converting search', 'leads with an amenity', 'adds a clear next step'];
    return { ok: true, options: opts.map(function (t, i) { return { text: t, len: t.length, limit: o.limit, issues: T.check(t, o.limit), why: why[i] }; }) };
  };
  T.assets = function (o) {
    var c = N(o.account) || K.COMMS[0], a = c.amen, u = c.url;
    function L(t, lim) { return { text: t, len: t.length, issues: T.check(t, lim) }; }
    var links = [['Floor Plans', '/floor-plans'], ['Amenities', '/amenities'], ['Schedule a Tour', '/tour'], ['Pet Policy', '/pets'], ['Neighborhood', '/neighborhood'], ['Apply Online', '/apply'], ['Photo Gallery', '/gallery'], ['Contact Us', '/contact']].map(function (x) { return { text: x[0], url: u + x[1] }; });
    var sl = [['Floor Plans', 'Studios to 2 bedrooms', 'See layouts and pricing', '/floor-plans'], ['Schedule a Tour', 'In person or self-guided', 'Pick a time that suits you', '/tour'], ['Amenities', cap(a[0]) + ' and ' + a[1], 'Everything included here', '/amenities'], ['Pet Policy', 'Pet friendly homes', 'See pet rules and fees', '/pets'], ['Neighborhood', 'Life in ' + c.hood.replace(/^the /, ''), 'Shops, dining and parks', '/neighborhood'], ['Apply Online', 'Apply in a few minutes', 'Secure online application', '/apply']];
    return { ok: true, account: c.name, url: u, pageOk: true, pageBlocked: false, links: links,
      existing: { sitelinks: ['Floor Plans', 'Contact Us'], callouts: ['Pet Friendly'] },
      sitelinks: sl.map(function (x) { return { text: L(x[0], 25), d1: L(x[1], 35), d2: L(x[2], 35), url: u + x[3], urlOk: true }; }),
      callouts: ['In-Home Laundry', 'Pet Friendly', cap(a[0]), cap(a[1]), 'Self-Guided Tours', 'Apply Online', 'Fast Replies', 'Flexible Lease Terms'].filter(function (t) { return t.length <= 25; }).slice(0, 8).map(function (t) { return L(t, 25); }),
      snippet: { values: a.map(cap).concat(['In-Home Laundry', 'Package Lockers']).filter(function (t) { return t.length <= 25; }).slice(0, 6).map(function (t) { return L(t, 25); }) } };
  };
  T.recap = function (o) {
    var c = N(o.account) || K.COMMS[0], ms = o.month + '-01', me = D.monthEnd(ms), pm = D.monthStart(ms, 1), pe = D.monthEnd(pm);
    var a = K.derive(K.sumDays(c.i, ms, me)), b = K.derive(K.sumDays(c.i, pm, pe)), mon = D.MONF[+ms.slice(5, 7) - 1], pmon = D.MONF[+pm.slice(5, 7) - 1];
    if (!a.clicks) return { ok: false, account: c.name, error: 'No ads ran in ' + mon + '.' };
    var hi = (o.recipient ? 'Hi ' + o.recipient + ',' : 'Hi,');
    var cmpLine = b.conv ? (a.conv >= b.conv ? 'That is ' + Math.round((a.conv - b.conv) / b.conv * 100) + '% more conversions than ' + pmon + '.' : 'Conversions were ' + Math.round(a.conv) + ' against ' + Math.round(b.conv) + ' in ' + pmon + ', in line with the season.') : '';
    var body = hi + '\n\nHere is how ' + c.name + '’s Google Ads did in ' + mon + '.\n\nYour ads were shown ' + K.int(a.impr) + ' times and brought ' + K.int(a.clicks) + ' visits to the website. They produced ' + K.int(a.conv) + ' conversions at ' + K.money(a.cpa) + ' each. ' + cmpLine
      + '\n\nWhat worked: searches for ' + c.amen[0] + ' and ' + c.amen[1] + ' kept converting well, and the brand campaign stayed the most efficient at the lowest cost per lead.'
      + (o.notes ? '\n\nAlso this month: ' + o.notes.trim() : '')
      + '\n\nWhat is next: we will keep the strongest headlines running, test a new set built around ' + c.hood.replace(/^the /, '') + ', and move budget toward the searches that turn into tours.\n\nThank you,\nThe Vertex marketing team';
    return { ok: true, account: c.name, month: mon + ' ' + ms.slice(0, 4), subject: c.name + ': your ' + mon + ' Google Ads recap', body: body, unverified: [] };
  };

  /* ---------------- Why did it change ---------------- */
  var MK = { cpa: ['Cost per conversion', 'money', -1], conversions: ['Conversions', 'num', 1], cost: ['Cost', 'money', 0], clicks: ['Clicks', 'int', 1], avg_cpc: ['Average CPC', 'money', -1], ctr: ['Click through rate', 'pct', 1], conv_rate: ['Conversion rate', 'pct', 1], impressions: ['Impressions', 'int', 1] };
  function mval(t, m) {
    if (m === 'cpa') return t.conv >= 0.5 ? t.cost / t.conv : null; if (m === 'avg_cpc') return t.clicks ? t.cost / t.clicks : null;
    if (m === 'ctr') return t.impr ? t.clicks / t.impr * 100 : null; if (m === 'conv_rate') return t.clicks ? t.conv / t.clicks * 100 : null;
    return { conversions: t.conv, cost: t.cost, clicks: t.clicks, impressions: t.impr }[m];
  }
  var RATIO = { cpa: ['cost', 'conv'], avg_cpc: ['cost', 'clicks'], ctr: ['clicks', 'impr', 100], conv_rate: ['conv', 'clicks', 100] };
  function changesFor(accts, from, to) {
    var t = D.today, L = [];
    function add(daysAgo, acct, text, camp, who, impact) { var d = D.add(t, -daysAgo); if (d >= from && d <= to && accts.indexOf(acct) > -1) L.push({ date: d, account: acct, text: text, campaign: camp, who: who, impact: impact || '' }); }
    K.COMMS.forEach(function (c, i) {
      var s = c.short;
      add(3 + i % 5, c.name, 'Budget changed from ' + K.money(Math.round(c.spend / 30)) + ' to ' + K.money(Math.round(c.spend / 30 * 1.1)) + ' a day', s + ' | Apartments in ' + CITY, 'morgan@vertex.example');
      add(21 + i % 7, c.name, '4 negative keywords added', s + ' | Apartments in ' + CITY, 'taylor@vertex.example');
      add(33 + i % 4, c.name, 'New responsive search ad added', s + ' | Brand Search', 'casey@vertex.example');
      add(47, c.name, 'Images added to the asset group', s + ' | Performance Max', 'taylor@vertex.example');
    });
    add(14, 'Aster Yards', 'Keywords changed from phrase match to broad match, bidding moved to Maximize conversions', 'Aster Yards | Apartments in ' + CITY, 'morgan@vertex.example', 'high');
    add(9, 'The Merritt', 'Conversion goal settings edited: lead form action set to secondary after the website change', 'All campaigns', 'automated rule', 'high');
    add(28, 'Cedar Row', 'Target CPA lowered from $18 to $14', 'Cedar Row | Apartments in ' + CITY, 'morgan@vertex.example', 'high');
    return L.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  }
  T.why = function (o) {
    var accts = E.accounts(o.accounts), names = accts.map(function (c) { return c.name; }), m = MK[o.metric] ? o.metric : 'cpa', mk = MK[m];
    var r = K.range(o.period, o.from, o.to), pr = K.prevRange(r, o.compare || 'previous');
    function tot(rg) { var t = { impr: 0, clicks: 0, cost: 0, conv: 0 }; accts.forEach(function (c) { var x = K.sumDays(c.i, rg.from, rg.to); t.impr += x.impr; t.clicks += x.clicks; t.cost += x.cost; t.conv += x.conv; }); return t; }
    var A = tot(r), B = tot(pr), before = mval(B, m), after = mval(A, m), change = before ? (after - before) / Math.abs(before) * 100 : null;
    var kpis = Object.keys(MK).map(function (k) { var b = mval(B, k), a = mval(A, k); return { key: k, label: MK[k][0], before: b, after: a, change: b ? (a - b) / Math.abs(b) * 100 : null, good: MK[k][2], kind: MK[k][1] }; });
    function dayRows(rg) { var out = []; for (var n = D.num(rg.from), e = D.num(rg.to); n <= e; n++) { var iso = D.fromNum(n), t = { d: iso, impressions: 0, clicks: 0, cost: 0, conversions: 0 }; accts.forEach(function (c) { var x = K.day(c.i, iso); t.impressions += x.impr; t.clicks += x.clicks; t.cost += x.cost; t.conversions += x.conv; }); out.push(t); } return out; }
    var dims = ['campaign', 'ad_group', 'keyword', 'search_term', 'device'], drivers = {};
    dims.forEach(function (dm) {
      var cu = E.crunch(accts, [dm], r), pv = E.crunch(accts, [dm], pr), pm = {}, all = {};
      pv.forEach(function (x) { pm[x.key[0]] = x; all[x.key[0]] = 1; }); cu.forEach(function (x) { all[x.key[0]] = 1; });
      var cmap = {}; cu.forEach(function (x) { cmap[x.key[0]] = x; });
      var list = Object.keys(all).map(function (k) {
        var a = cmap[k] || { impr: 0, clicks: 0, cost: 0, conv: 0 }, b = pm[k] || { impr: 0, clicks: 0, cost: 0, conv: 0 }, contrib;
        if (RATIO[m]) { var R = RATIO[m], mul = R[2] || 1, num = A[R[0]] - a[R[0]] + b[R[0]], den = A[R[1]] - a[R[1]] + b[R[1]]; contrib = den ? after - num / den * mul : 0; }
        else contrib = (mval(a, m) || 0) - (mval(b, m) || 0);
        return { name: k, prev: mval(b, m), cur: mval(a, m), prevCost: b.cost, curCost: a.cost, prevConv: b.conv, curConv: a.conv, contribution: contrib, isNew: !pm[k] && a.cost > 0, gone: !cmap[k] && b.cost > 0 };
      }).filter(function (x) { return x.curCost + x.prevCost > 1; }).sort(function (x, y) { return Math.abs(y.contribution) - Math.abs(x.contribution); }).slice(0, 8);
      drivers[dm] = list;
    });
    var parts = [];
    if (RATIO[m]) {
      var R = RATIO[m], mul = R[2] || 1, nb = B[R[0]], db = B[R[1]], na = A[R[0]], da = A[R[1]];
      var lab = { cost: 'Cost', conv: 'Conversions', clicks: 'Clicks', impr: 'Impressions' };
      var unit = { cost: 'money', conv: 'num', clicks: 'int', impr: 'int' };
      if (db && da) { var e1 = (na / db - nb / db) * mul, e2 = (na / da - na / db) * mul; parts = [{ label: lab[R[0]], value: e1, from: nb, to: na, unit: unit[R[0]] }, { label: lab[R[1]], value: e2, from: db, to: da, unit: unit[R[1]] }]; }
    } else {
      var byType = {}; E.crunch(accts, ['campaign_type'], r).forEach(function (x) { byType[x.key[0]] = { a: mval(x, m) || 0, b: 0 }; }); E.crunch(accts, ['campaign_type'], pr).forEach(function (x) { (byType[x.key[0]] = byType[x.key[0]] || { a: 0, b: 0 }).b = mval(x, m) || 0; });
      var tp = Object.keys(byType).map(function (k) { return { label: k, value: byType[k].a - byType[k].b, from: byType[k].b, to: byType[k].a, unit: mk[1] }; }).sort(function (x, y) { return Math.abs(y.value) - Math.abs(x.value); });
      parts = tp.slice(0, 3); if (tp.length > 3) { var rest = tp.slice(3).reduce(function (s, x) { return { v: s.v + x.value, f: s.f + x.from, t: s.t + x.to }; }, { v: 0, f: 0, t: 0 }); parts.push({ label: 'Everything else', value: rest.v, from: rest.f, to: rest.t, unit: mk[1] }); }
    }
    var changes = changesFor(names, pr.from, r.to).map(function (c) { c.period = c.date >= r.from ? 'this' : 'before'; return c; });
    var merritt = names.indexOf('The Merritt') > -1 && r.to >= D.add(D.today, -9), aster = names.indexOf('Aster Yards') > -1 && r.to >= D.add(D.today, -14);
    var conv = [['Lead form submit', 'Submit lead form', 0.45, true], ['Calls from ads', 'Phone call lead', 0.25, true], ['Tour scheduled', 'Book appointment', 0.30, true], ['Floor plans page view', 'Page view', 0, false]];
    function ca(t, rg, broken) { return conv.map(function (x) { var v = x[3] ? t.conv * x[2] : t.clicks * 0.18; if (broken && x[0] === 'Lead form submit') v *= 0.1; return v; }); }
    var ab = ca(B, pr, false), aa = ca(A, r, false);
    var convActions = conv.map(function (x, i) { return { name: x[0], category: x[1], before: Math.round(ab[i] * 10) / 10, after: Math.round(aa[i] * 10) / 10, primary: x[3] }; });
    var sh0 = { share: 0, lostBudget: 0, lostRank: 0 }, sh1 = { share: 0, lostBudget: 0, lostRank: 0 }, w0 = 0, w1 = 0;
    accts.forEach(function (c) { var s0 = K.share(c.i, pr.from), s1 = K.share(c.i, r.from), x0 = K.sumDays(c.i, pr.from, pr.to).cost, x1 = K.sumDays(c.i, r.from, r.to).cost; w0 += x0; w1 += x1; sh0.share += s0.is * x0; sh0.lostBudget += s0.isB * x0; sh0.lostRank += s0.isR * x0; sh1.share += s1.is * x1; sh1.lostBudget += s1.isB * x1; sh1.lostRank += s1.isR * x1; });
    ['share', 'lostBudget', 'lostRank'].forEach(function (k) { sh0[k] = w0 ? sh0[k] / w0 * 100 : 0; sh1[k] = w1 ? sh1[k] / w1 * 100 : 0; });
    var tc = [], tp2 = []; accts.forEach(function (c) { tc = tc.concat(K.termRows(c.i, r.from, r.to).map(function (x) { x.account = c.name; return x; })); tp2 = tp2.concat(K.termRows(c.i, pr.from, pr.to)); });
    var waste = tc.filter(function (x) { return x.conv < 0.5 && x.cost >= 20; }).sort(function (a, b) { return b.cost - a.cost; });
    var good = mk[2], better = change === null ? 0 : (good === 0 ? 0 : (change * good > 0 ? 1 : -1));
    var topC = drivers.campaign[0], topT = drivers.search_term[0];
    function f(v, kind) { return kind === 'money' ? K.money(v) : (kind === 'pct' ? v.toFixed(2) + '%' : E.num(v)); }
    var headline = mk[0] + ' ' + (change === null ? 'has no earlier data to compare' : (change > 0 ? 'rose ' : 'fell ') + E.abs(change) + ', from ' + f(before, mk[1]) + ' to ' + f(after, mk[1]));
    var story = '';
    if (m === 'cpa' && parts.length) story = 'Cost moved ' + (A.cost >= B.cost ? 'up ' : 'down ') + E.abs((A.cost - B.cost) / B.cost * 100) + ' and conversions moved ' + (A.conv >= B.conv ? 'up ' : 'down ') + E.abs((A.conv - B.conv) / B.conv * 100) + '. ' + (Math.abs(parts[1].value) > Math.abs(parts[0].value) ? 'The change in conversions did more to move cost per conversion than the change in spend.' : 'The change in spend did more to move cost per conversion than the change in conversions.');
    else story = 'The biggest single driver was ' + (topC ? topC.name : 'the main search campaign') + '. ' + (topT ? 'Among searches, "' + topT.name + '" moved the most.' : '');
    if (merritt) story += ' At The Merritt, clicks held steady while lead form conversions nearly stopped right after the conversion goal edit, which points to tracking, not demand.';
    if (aster) story += ' At Aster Yards, the switch to broad match brought in wider, costlier searches.';
    var helped = [], hurt = [];
    drivers.campaign.forEach(function (x) { var g = good === 0 ? 0 : (x.contribution * good > 0 ? 1 : -1); var p = { point: x.name, evidence: 'Cost ' + K.money(x.prevCost) + ' to ' + K.money(x.curCost) + ', conversions ' + E.num(x.prevConv) + ' to ' + E.num(x.curConv) + '. Effect on the total ' + mk[0].toLowerCase() + ': ' + (x.contribution > 0 ? '+' : '-') + f(Math.abs(x.contribution), mk[1]) + '.' }; if (g > 0 && helped.length < 3) helped.push(p); if (g < 0 && hurt.length < 3) hurt.push(p); });
    var actions = [];
    if (merritt) actions.push({ title: 'Set the lead form back to a primary conversion at The Merritt', why: 'It was switched to secondary in the website change, so Smart Bidding stopped counting real leads.', priority: 'high' });
    if (aster) actions.push({ title: 'Add negatives for the broad match searches at Aster Yards', why: 'Searches like "' + (waste.filter(function (w) { return w.account === 'Aster Yards'; })[0] || { term: 'short term rentals' }).term + '" spent without converting after the switch.', priority: 'high' });
    if (waste.length) actions.push({ title: 'Exclude ' + Math.min(10, waste.length) + ' searches that spent with no conversions', why: K.money(waste.slice(0, 10).reduce(function (s, w) { return s + w.cost; }, 0)) + ' went to searches that never converted in this period.', priority: 'medium' });
    actions.push({ title: 'Keep the strongest campaign fully funded', why: (helped[0] ? helped[0].point : 'The brand campaign') + ' is producing the cheapest conversions.', priority: 'low' });
    return {
      ok: true, metric: m, label: mk[0], kind: mk[1], good: good, before: before, after: after, change: change, accounts: names,
      range: { text: E.rangeText(r), prevText: E.rangeText(pr), compareLabel: o.compare === 'year' ? 'same period last year' : 'previous period' },
      kpis: kpis, daily: { cur: dayRows(r), prev: dayRows(pr) }, parts: parts, drivers: drivers, dims: dims, changes: changes,
      story: { headline: headline + '.', story: story.trim(), helped: helped, hurt: hurt, missed: sh1.lostBudget > 10 ? [{ point: 'Budget ran out before the day ended', evidence: Math.round(sh1.lostBudget) + '% of eligible searches were missed because of budget' }] : [], actions: actions, changes: changes.filter(function (c) { return c.impact === 'high'; }).map(function (c) { return { when: D.text(c.date), what: c.account + ': ' + c.text, likely_effect: /broad/.test(c.text) ? 'More reach, at a higher cost per conversion' : (/secondary/.test(c.text) ? 'Lead forms stopped counting as conversions' : 'Fewer auctions won at the lower target') }; }) },
      unverified: [], convActions: convActions, share: { before: sh0, after: sh1 }, missed: sh1.lostBudget > 10 ? { clicks: Math.round(A.clicks * sh1.lostBudget / Math.max(20, sh1.share)), conversions: Math.round(A.conv * sh1.lostBudget / Math.max(20, sh1.share) * 10) / 10 } : null,
      terms: { fresh: { count: 4 + accts.length, cost: Math.round(A.cost * 0.04), conversions: Math.round(A.conv * 0.03) }, gone: { count: 2 + Math.floor(accts.length / 2), cost: Math.round(B.cost * 0.02), conversions: Math.round(B.conv * 0.015) }, wasteCost: Math.round(waste.reduce(function (s, w) { return s + w.cost; }, 0)), wasteCount: waste.length, threshold: 20, waste: waste.slice(0, 10).map(function (w) { return { term: w.term, cost: w.cost, clicks: w.clicks }; }) },
      skipped: []
    };
  };

  /* ---------------- search terms, keywords ---------------- */
  T.terms = function (o) {
    var accts = E.accounts(o.accounts), r = K.range(o.period, o.from, o.to), th = {}, total = { terms: 0, cost: 0, conversions: 0 };
    accts.forEach(function (c) {
      K.termRows(c.i, r.from, r.to).forEach(function (x) {
        total.terms++; total.cost += x.cost; total.conversions += x.conv;
        var t = th[x.theme] || (th[x.theme] = { name: x.theme, count: 0, cost: 0, conversions: 0, waste: 0, sensitive: x.sensitive, terms: [] });
        t.count++; t.cost += x.cost; t.conversions += x.conv; if (x.conv < 0.5) t.waste += x.cost;
        t.terms.push([x.term, c.name, x.clicks, Math.round(x.cost * 100) / 100, x.conv]);
      });
    });
    var themes = Object.keys(th).map(function (k) { var t = th[k]; t.share = total.cost ? t.cost / total.cost * 100 : 0; t.cpa = t.conversions >= 0.5 ? t.cost / t.conversions : null; t.terms.sort(function (a, b) { return b[3] - a[3]; }); t.terms = t.terms.slice(0, 25); return t; }).sort(function (a, b) { return b.cost - a.cost; });
    total.cpa = total.conversions ? total.cost / total.conversions : null;
    return { ok: true, range: E.rangeText(r), total: total, themes: themes };
  };
  T.keywords = function (o) {
    var c = N(o.account) || K.COMMS[0], r = K.range(o.period, o.from, o.to), minConv = Number(o.minConv) || 1, wasteAt = Number(o.waste) || 20;
    var camps = K.camps(c.i), rows = K.termRows(c.i, r.from, r.to);
    if (o.campaignId) { var ck = camps.filter(function (k) { return k.id === o.campaignId; })[0]; if (ck) rows = rows.filter(function (x) { return ck.key === x.camp; }); }
    function campOf(x) { return camps.filter(function (k) { return k.key === x.camp; })[0]; }
    var adds = rows.filter(function (x) { return x.conv >= minConv && x.camp !== 'brand' && x.theme !== 'Brand'; }).map(function (x) { var k = campOf(x), g = k.adGroups[x.group] || k.adGroups[0]; return { term: x.term, campaign: k.name, adGroup: g ? g.name : '', clicks: x.clicks, conversions: x.conv, cpa: x.conv ? x.cost / x.conv : null, sensitive: x.sensitive }; }).filter(function (x) { return !x.sensitive; }).sort(function (a, b) { return b.conversions - a.conversions; });
    var negatives = rows.filter(function (x) { return x.conv < 0.5 && x.cost >= wasteAt && !x.sensitive && x.theme !== 'Brand'; }).map(function (x) { return { term: x.term, campaign: campOf(x).name, clicks: x.clicks, cost: x.cost }; }).sort(function (a, b) { return b.cost - a.cost; });
    var words = [['cheap', 'Price'], ['jobs', 'Not a renter'], ['for sale', 'Not a renter'], ['short term', 'Not a renter'], ['break a lease', 'Not a renter'], ['under 1000', 'Price']];
    var phrases = words.map(function (w) { var hit = rows.filter(function (x) { return x.term.indexOf(w[0]) > -1 && x.conv < 0.5; }); return { word: w[0], terms: hit.length, cost: Math.round(hit.reduce(function (s, x) { return s + x.cost; }, 0) * 100) / 100, examples: hit.map(function (x) { return x.term; }), campaigns: hit.map(function (x) { return campOf(x).name; }).filter(function (v, i, a) { return a.indexOf(v) === i; }) }; }).filter(function (p) { return p.terms; });
    var prot = rows.filter(function (x) { return x.sensitive && x.conv < 0.5 && x.cost > 0; }).map(function (x) { return { term: x.term, cost: x.cost }; });
    return { ok: true, account: c.name, range: E.rangeText(r), terms: rows.length, waste: wasteAt, wasteTotal: negatives.reduce(function (s, x) { return s + x.cost; }, 0), adds: adds, negatives: negatives, phrases: phrases, protected: prot };
  };

  /* ---------------- budget pacing ---------------- */
  T.pacing = function (o) {
    var ms = (o.month || D.today.slice(0, 7)) + '-01', me = D.monthEnd(ms), current = ms.slice(0, 7) === D.today.slice(0, 7), through = current ? D.yesterday : me;
    var days = D.days(ms, me), elapsed = current ? Math.max(0, D.days(ms, D.yesterday)) : days, left = days - elapsed;
    var rows = K.COMMS.filter(function (c) { return !c.stop; }).map(function (c) {
      var spent = elapsed ? K.sumDays(c.i, ms, through).cost : 0, last7 = K.sumDays(c.i, D.add(through, -6), through).cost / 7;
      var budget = Math.round(c.spend * (current ? 1.02 : 1) * (0.94 + K.hr(c.i, 77) * 0.14) / 50) * 50;
      if (c.name === 'Aster Yards') budget = Math.round(budget * 0.88 / 50) * 50;
      if (c.name === 'Cedar Row') budget = Math.round(budget * 0.98 / 50) * 50;
      var projected = current ? spent + last7 * left : spent, pace = budget ? Math.round(projected / budget * 100) : null;
      return { property: c.name, account: c.name, budget: budget, spent: spent, projected: projected, pacePct: pace, status: pace > 108 ? 'Over pace' : (pace < 92 ? 'Under pace' : 'On pace'), dailyAvg: last7, dailyNeeded: current && left ? Math.max(0, (budget - spent) / left) : null, occ: c.occ, vacant: Math.round(c.units * (1 - c.occ)) };
    }).sort(function (a, b) { return b.pacePct - a.pacePct; });
    var t = rows.reduce(function (s, x) { s.budget += x.budget; s.spent += x.spent; s.projected += x.projected; return s; }, { budget: 0, spent: 0, projected: 0 });
    t.pacePct = t.budget ? Math.round(t.projected / t.budget * 100) : null;
    return { ok: true, monthLabel: D.monthLabel(ms.slice(0, 7)), through: D.text(through), left: left, current: current, totals: t, rows: rows, elapsed: elapsed, days: days, sheet: 'Budget Overview', sheetUrl: 'https://docs.google.com/spreadsheets/', unmatched: [] };
  };

  /* ---------------- landing pages ---------------- */
  T.landing = function (o) {
    var accts = E.accounts(o.accounts), rows = [], r = K.range('last30');
    accts.filter(function (c) { return !c.stop; }).forEach(function (c) {
      var cost = K.sumDays(c.i, r.from, r.to).cost;
      [['', 0.55], ['/floor-plans', 0.3], ['/specials', 0.15]].forEach(function (p, j) {
        var x = { url: c.url + p[0], account: c.name, visit: 'ok', status: 200, google: 'Phone score ' + Math.round(62 + K.hr(c.i, j + 5) * 33), cost: Math.round(cost * p[1] * 100) / 100, issues: [] };
        if (c.name === 'Copperfield' && p[0] === '/specials') { x.visit = 'broken'; x.status = 404; x.google = 'Not found'; x.issues.push({ level: 'critical', text: 'Page not found (404). The ads keep paying for clicks that land on an error.' }); }
        if ((c.name === 'The Linden' || c.name === 'Willow Park Flats') && j === 0) { x.visit = 'blocked'; x.status = 403; x.issues.push({ level: 'info', text: 'A website firewall turned our automated visit away. Google’s own test loaded it fine.' }); }
        if (c.name === 'The Hartley' && j === 1) { x.google = 'Phone score 38'; x.issues.push({ level: 'medium', text: 'Slow on phones: about 6.8 seconds before the page is usable.' }); }
        if (c.name === 'Fenwick Place' && j === 2) { x.url = x.url.replace('https://', 'http://'); x.issues.push({ level: 'high', text: 'Not secure: the page loads over http, so browsers warn visitors.' }); }
        if (c.name === 'Aster Yards' && j === 2) { x.issues.push({ level: 'low', text: 'The page has no tour or contact button above the fold.' }); }
        rows.push(x);
      });
    });
    var broken = rows.filter(function (x) { return x.visit === 'broken'; }).length, blocked = rows.filter(function (x) { return x.visit === 'blocked'; }).length;
    rows.sort(function (a, b) { return b.cost - a.cost; });
    return { ok: true, checked: rows.length, broken: broken, blocked: blocked, ok200: rows.filter(function (x) { return x.visit === 'ok' && !x.issues.length; }).length, quota: false, rows: rows };
  };

  /* ---------------- takeaways ---------------- */
  T.takeaway = function (title, f) {
    if (/Search Term/.test(title)) { var th = f.themes.slice().sort(function (a, b) { return b.waste - a.waste; }); return { ok: true, headline: K.money(th.reduce(function (s, x) { return s + x.waste; }, 0)) + ' went to searches that never converted, most of it in ' + th[0].name.toLowerCase() + ' and ' + th[1].name.toLowerCase() + '.', points: ['Brand searches convert at the lowest cost and should stay fully funded.', 'Searches from people who are not renters (jobs, homes for sale, short term stays) are the cleanest negatives.', 'Leave accessibility and age related searches running: excluding them could look like steering under Fair Housing.'], actions: [{ title: 'Add the non-renter searches as negatives', why: 'They spend every week with no leads.', priority: 'high' }, { title: 'Review price searches monthly', why: 'A few convert, most do not.', priority: 'medium' }] }; }
    if (/Pacing/.test(title)) { var over = f.communities.filter(function (x) { return x.status === 'Over pace'; }), under = f.communities.filter(function (x) { return x.status === 'Under pace'; }); return { ok: true, headline: over.length + ' communities are on track to overspend and ' + under.length + ' to underspend this month.', points: over.slice(0, 2).map(function (x) { return x.community + ' is projected at ' + x.pace_pct + '% of budget.'; }).concat(under.slice(0, 1).map(function (x) { return x.community + ' is projected at ' + x.pace_pct + '%, leaving room for more reach.'; })), actions: over.slice(0, 2).map(function (x) { return { title: 'Lower the daily budget at ' + x.community, why: 'Projected ' + x.pace_pct + '% of the monthly budget.', priority: 'high' }; }) }; }
    if (/Heatmap/.test(title)) return { ok: true, headline: 'Most accounts improved, with two clear exceptions.', points: ['The Merritt: conversions fell while clicks held, a tracking pattern.', 'Aster Yards: cost per conversion climbed after the broad match change.', 'Lakeview Terrace leads on cost per conversion.'], actions: [{ title: 'Check conversion tracking at The Merritt', why: 'Clicks steady, conversions near zero.', priority: 'high' }] };
    if (/Landing/.test(title)) return { ok: true, headline: 'One page is broken and one is not secure. Everything else loads.', points: ['Copperfield’s specials page returns a 404 while ads still send people there.', 'Fenwick Place has a page on http, which shows a browser warning.', 'Two firewall blocks are not errors: Google’s own test loaded those pages.'], actions: [{ title: 'Point Copperfield’s specials ads at the floor plans page', why: 'Until the page is fixed.', priority: 'high' }, { title: 'Move the Fenwick Place page to https', why: 'Browsers warn visitors on http pages.', priority: 'medium' }] };
    return { ok: true, headline: 'Clear negatives and a few keywords worth adding.', points: ['The converting searches are not exact match keywords yet.', 'Non-renter searches are the cleanest negatives.'], actions: [{ title: 'Add the top converting searches as exact match', why: 'They convert below the account average cost.', priority: 'medium' }] };
  };

  /* ---------------- alerts ---------------- */
  T.alerts = function (win) {
    win = win || 30;
    var r = K.range('last' + (win === 90 ? 90 : 30)), items = [];
    var y = D.yesterday;
    function last(ci, n, off) { return K.sumDays(ci, D.add(y, -(n - 1) - (off || 0)), D.add(y, -(off || 0))); }
    function add(o) { o.key = o.id + ':' + o.accountId; o.link = LINK; o.steps = o.steps || []; o.days = o.days || 1; items.push(o); }
    var M = N('The Merritt'), m7 = last(M.i, 7), m7p = last(M.i, 7, 7);
    add({ id: 'conv_drop', severity: 'critical', category: 'Tracking', issue: 'Conversions stopped while clicks held steady', title: 'Conversions nearly stopped while clicks held steady', account: M.name, accountId: M.id, detail: 'The last 7 days brought ' + K.int(m7.clicks) + ' clicks (the week before: ' + K.int(m7p.clicks) + ') but only ' + K.int(m7.conv) + ' conversions (the week before: ' + K.int(m7p.conv) + '). It started 9 days ago, the same day the conversion goals were edited.', why: 'Smart Bidding learns from conversions. With none coming in, it starts bidding blind within days.', steps: ['Open Goals and check the lead form action is still a primary conversion.', 'Submit a test lead on the website and confirm Google Ads records it within a few hours.', 'If the website tag changed, re-install the Google tag on the thank you page.'], impact: Math.round(m7.cost), isNew: false, days: 9, tool: 'why', cols: ['Conversion action', 'Last 7 days', 'Week before'], items: [['Lead form submit', '1', String(Math.round(m7p.conv * 0.45))], ['Calls from ads', String(Math.round(m7.conv * 0.6)), String(Math.round(m7p.conv * 0.25))], ['Tour scheduled', '0', String(Math.round(m7p.conv * 0.3))]] });
    var A = N('Aster Yards'), a7 = last(A.i, 7), a7p = last(A.i, 7, 14);
    add({ id: 'cpa_jump', severity: 'high', category: 'Performance', issue: 'Cost per conversion jumped', title: 'Cost per conversion up ' + Math.round((a7.cost / a7.conv) / (a7p.cost / a7p.conv) * 100 - 100) + '% in two weeks', account: A.name, accountId: A.id, detail: 'Cost per conversion is ' + K.money(a7.cost / a7.conv) + ' over the last 7 days, against ' + K.money(a7p.cost / a7p.conv) + ' before the keywords moved to broad match.', why: 'Broad match reaches wider searches. Without new negatives, some of that reach never converts.', steps: ['Review the search terms since the change.', 'Add negatives for searches that spent with no conversions.', 'Keep the best performing keywords on phrase or exact match.'], impact: Math.round(a7.cost - a7.conv * a7p.cost / a7p.conv), isNew: false, days: 6, tool: 'why' });
    var Cr = N('Cedar Row'), cs = K.share(Cr.i, D.add(y, -29)), c30 = last(Cr.i, 30);
    add({ id: 'lost_budget', severity: 'high', category: 'Budget', issue: 'Losing searches to budget', title: 'Missing ' + Math.round(cs.isB * 100) + '% of searches because the budget runs out', account: Cr.name, accountId: Cr.id, detail: 'Search campaigns convert at ' + K.money(c30.cost / c30.conv) + ', below the portfolio average, but stop showing early most days.', why: 'These are the cheapest leads in the account. Every missed search is a lead that went to a competitor.', steps: ['Raise the daily budget on the main search campaign by 20%.', 'Or move budget from Display Remarketing, which converts at twice the cost.'], impact: 0, isNew: false, days: 24 });
    ['Harbor Commons', 'The Linden', 'Aster Yards', 'Fenwick Place', 'The Hartley'].forEach(function (n, j) {
      var c = N(n), tr = K.termRows(c.i, r.from, r.to).filter(function (x) { return x.conv < 0.5 && x.cost >= 15 && !x.sensitive; }), w = tr.reduce(function (s, x) { return s + x.cost; }, 0);
      if (!w) return;
      add({ id: 'term_waste', severity: j < 2 ? 'high' : 'medium', category: 'Wasted spend', issue: 'Search terms spending with no conversions', title: tr.length + ' searches spent ' + K.money(w) + ' with no conversions', account: c.name, accountId: c.id, detail: 'In the last ' + win + ' days these searches cost ' + K.money(w) + ' and produced no conversions. Most are people looking for jobs, homes to buy or short stays.', why: 'Negative keywords stop paying for searches that will never become a lease.', steps: ['Download the list.', 'Add the non-renter searches as exact negatives.', 'Leave any search that mentions a protected class running.'], impact: Math.round(w), isNew: j === 4, days: j === 4 ? 1 : 12 - j, tool: 'keywords', cols: ['Search', 'Clicks', 'Cost'], items: tr.slice(0, 8).map(function (x) { return [x.term, String(x.clicks), K.money(x.cost)]; }) });
    });
    var Ha = N('The Hartley');
    add({ id: 'fh_copy', severity: 'high', category: 'Fair Housing', issue: 'Ad copy that reads as a preference', title: 'A headline says "Perfect for Young Professionals"', account: Ha.name, accountId: Ha.id, detail: 'One responsive search ad in the brand campaign includes the headline "Perfect for Young Professionals". Google may restrict it, and it reads as a preference by age under Fair Housing rules.', why: 'Housing ads must describe the home and the area, never who should live there.', steps: ['Replace the headline with a feature, for example "Sky Lounge and Fitness Center".', 'Check the other ads in the account for similar wording.'], impact: 0, isNew: true, days: 1, tool: 'adcopy' });
    var Co = N('Copperfield'), co30 = last(Co.i, 30);
    add({ id: 'page_down', severity: 'critical', category: 'Landing pages', issue: 'Landing page not loading', title: 'The specials page returns a 404', account: Co.name, accountId: Co.id, detail: 'Ads in one ad group send people to ' + Co.url + '/specials, which returns "page not found". About ' + K.money(co30.cost * 0.15) + ' of spend in the last 30 days went to that page.', why: 'Every click on these ads lands on an error page.', steps: ['Point the ads at the floor plans page until the specials page is back.', 'Ask the web team to restore or redirect the page.'], impact: Math.round(co30.cost * 0.15), isNew: true, days: 1 });
    var W = N('Willow Park Flats');
    add({ id: 'ga4_reach', severity: 'medium', category: 'Website analytics', issue: 'Clicks not reaching the website', title: 'Only 61% of ad clicks show up as visits', account: W.name, accountId: W.id, detail: 'Google Analytics recorded visits for 61% of ad clicks in the last ' + win + ' days. Most communities sit above 80%.', why: 'A slow page, a redirect or a missing tag can lose visits between the click and the page.', steps: ['Check the Google tag fires on the landing page.', 'Test the page speed on a phone.'], impact: 0, isNew: false, days: 5 });
    var El = N('The Ellery');
    add({ id: 'paused', severity: 'info', category: 'Account', issue: 'Account paused', title: 'Every campaign is paused', account: El.name, accountId: El.id, detail: 'No campaigns have run for 52 days. That matches the note that the community is fully leased.', why: 'Just a heads up, in case it should be running again.', steps: ['Turn campaigns back on when homes become available.'], impact: 0, isNew: false, days: 52 });
    var Bk = N('Brookline Lofts');
    add({ id: 'low_is', severity: 'low', category: 'Performance', issue: 'Impression share slipping on brand searches', title: 'Brand impression share dropped to 82%', account: Bk.name, accountId: Bk.id, detail: 'A competitor started bidding on the community name. Brand impression share fell from 94% to 82% this month.', why: 'People searching the name are the most likely to lease.', steps: ['Raise the brand campaign target impression share to 95%.'], impact: 0, isNew: false, days: 3 });
    var overview = K.COMMS.map(function (c) {
      var yd = K.day(c.i, y).cost, a7 = last(c.i, 7, 1).cost / 7, cv7 = last(c.i, 7).conv, cvp = last(c.i, 7, 7).conv, clicksW = K.sumDays(c.i, r.from, r.to).clicks, clicksP = K.sumDays(c.i, D.add(r.from, -win), D.add(r.from, -1)).clicks;
      var reach = c.name === 'Willow Park Flats' ? 61 : (c.stop ? null : 78 + K.hr(c.i, 51) * 17), paid = reach === null ? 0 : Math.round(clicksW * reach / 100);
      var pg = c.name === 'Copperfield' ? { url: c.url + '/specials', state: 'broken', text: 'Page not found', score: null } : ((c.name === 'The Linden' || c.name === 'Willow Park Flats') ? { url: c.url, state: 'blocked', text: 'Firewall turned our check away', score: Math.round(70 + K.hr(c.i, 9) * 20) } : { url: c.url, state: c.stop ? 'none' : 'ok', text: 'Loads', score: c.stop ? null : Math.round(62 + K.hr(c.i, 5) * 33), field: c.name === 'The Hartley' ? 'SLOW' : '' });
      return { accountId: c.id, account: c.name, yesterday: yd, avg7: a7, conv7: cv7, convPrev7: cvp, cost7: last(c.i, 7).cost, ga: c.stop ? null : { paid: paid, paidPrev: Math.round(clicksP * reach / 100), reach: reach }, pages: [pg], counts: { critical: 0, high: 0 } };
    });
    return { win: win, through: D.text(y, true), atText: D.text(D.today) + ' at 6:12 AM Central', firstCheck: false, prevCheck: D.add(D.today, -1), items: items, overview: overview,
      resolved: [{ account: 'Orchard House', title: 'Conversion tracking tag missing on the tour page', first: D.add(D.today, -6) }, { account: 'The Calloway', title: 'Ad disapproved: destination not working', first: D.add(D.today, -3) }, { account: 'Lakeview Terrace', title: 'Budget limited on the brand campaign', first: D.add(D.today, -9) }],
      ga4: { on: true, ready: true }, psiQuota: false, failed: [], range: { text: E.rangeText(r) } };
  };

  /* ---------------- audit ---------------- */
  var FT = [
    ['tracking_dup', 'high', 'Tracking', 'Two conversion actions count the same lead', 'A lead form and a thank you page view are both primary conversions, so each lead counts twice and cost per conversion looks half of what it is.', 'Set the page view action to secondary in Goals.', ['Conversion action', 'Category', 'Counted as'], [['Lead form submit', 'Submit lead form', 'Primary'], ['Thank you page view', 'Page view', 'Primary']]],
    ['kw_qs', 'medium', 'Keywords', 'Keywords with a Quality Score of 4 or less', 'These keywords pay more per click because the ad and landing page do not match the search closely.', 'Write an ad that repeats the keyword in a headline, or move the keyword to a closer ad group.', ['Keyword', 'Quality Score', 'Cost, 30 days'], null],
    ['one_ad', 'medium', 'Ads', 'Ad groups with only one responsive search ad', 'Google needs at least two ads to learn which message works.', 'Add a second ad with a different angle, for example amenities first and location first.', ['Ad group', 'Ads'], null],
    ['ad_strength', 'low', 'Ads', 'Responsive search ads with Poor ad strength', 'These ads have too few unique headlines, so Google cannot test combinations.', 'Add headlines until each ad has at least 10 unique ones.', ['Ad', 'Ad strength'], null],
    ['manual_cpc', 'low', 'Bidding', 'Campaign still on Manual CPC', 'This campaign has enough conversions for Smart Bidding to set better bids.', 'Test Maximize conversions with a target CPA near the current cost per conversion.', ['Campaign', 'Bidding', 'Conversions, 30 days'], null],
    ['tcpa_low', 'medium', 'Bidding', 'Target CPA set well below actual cost', 'The target is far below what conversions cost, so the campaign wins fewer auctions.', 'Raise the target to within 20% of the actual cost per conversion.', ['Campaign', 'Target CPA', 'Actual cost per conversion'], null],
    ['age_target', 'high', 'Fair Housing', 'Audience exclusions by age are turned on', 'Housing ads cannot target or exclude by age, gender, parental status or postal code under Google’s housing policy.', 'Remove the age exclusion from the campaign audience settings.', ['Campaign', 'Setting'], null],
    ['slow_page', 'medium', 'Landing pages', 'Slow landing page on phones', 'The main landing page takes more than 5 seconds to become usable on a phone.', 'Compress the hero images and defer the chat widget script.', ['Page', 'Phone score'], null]
  ];
  T.audit = function (when) {
    var findings = [], accounts = {}, r = K.range('last30');
    function addF(c, sev, cat, title, detail, fix, impact, cols, items, id) { findings.push({ key: (id || cat) + ':' + c.id + ':' + findings.length, severity: sev, category: cat, title: title, account: c.name, accountId: c.id, detail: detail, fix: fix, impact: impact || 0, itemColumns: cols || [], items: items || [], itemCount: (items || []).length, link: LINK }); }
    var M = N('The Merritt'); addF(M, 'critical', 'Tracking', 'Lead form conversions stopped recording', 'The lead form conversion action recorded almost nothing for 9 days while clicks held steady. It was set to secondary during the website change.', 'Set the lead form action back to primary in Goals, then submit a test lead.', Math.round(K.sumDays(M.i, D.add(D.yesterday, -8), D.yesterday).cost), ['Conversion action', 'Last 9 days'], [['Lead form submit', '1'], ['Calls from ads', String(Math.round(K.sumDays(M.i, D.add(D.yesterday, -8), D.yesterday).conv))]], 'conv_stop');
    var Co = N('Copperfield'); addF(Co, 'critical', 'Landing pages', '1 landing page does not load', Co.url + '/specials returns a 404, and one ad group still sends people there.', 'Point the ads at the floor plans page, then restore or redirect the specials page.', Math.round(K.sumDays(Co.i, r.from, r.to).cost * 0.15), ['Page', 'Status'], [[Co.url + '/specials', '404 Not found']], 'page404');
    var Ha = N('The Hartley'); addF(Ha, 'critical', 'Fair Housing', 'Ad text that reads as a preference', 'A headline says "Perfect for Young Professionals", which describes who should live here instead of the home.', 'Replace it with a feature, such as "Sky Lounge and Fitness Center".', 0, ['Ad', 'Line'], [['Brand Search, ad 2', 'Perfect for Young Professionals']], 'fh_copy');
    var Cr = N('Cedar Row'); addF(Cr, 'high', 'Budget', 'Search campaign limited by budget', 'The main search campaign missed ' + Math.round(K.share(Cr.i, r.from).isB * 100) + '% of eligible searches because its budget ran out, while converting below the account average cost.', 'Raise the daily budget by 20%, funded from Display Remarketing.', 0, [], [], 'budget');
    var A = N('Aster Yards'); addF(A, 'high', 'Keywords', 'Broad match keywords without a negative list', 'Generic keywords moved to broad match 14 days ago with no new negatives. Cost per conversion has risen since.', 'Add a shared negative list and review search terms weekly.', 0, [], [], 'broad');
    K.COMMS.forEach(function (c) {
      if (c.stop) return;
      var tr = K.termRows(c.i, r.from, r.to).filter(function (x) { return x.conv < 0.5 && x.cost >= 20 && !x.sensitive; });
      if (tr.length) addF(c, tr.reduce(function (s, x) { return s + x.cost; }, 0) > 120 ? 'high' : 'medium', 'Wasted spend', tr.length + ' search terms spent with no conversions', 'These searches cost ' + K.money(tr.reduce(function (s, x) { return s + x.cost; }, 0)) + ' in the last 30 days and produced no conversions.', 'Add them as exact negatives, except any that mention a protected class.', Math.round(tr.reduce(function (s, x) { return s + x.cost; }, 0)), ['Search', 'Cost'], tr.slice(0, 6).map(function (x) { return [x.term, K.money(x.cost)]; }), 'waste');
      FT.forEach(function (t, j) {
        if (K.hr(c.i, j + 400) > (c.name === 'Lakeview Terrace' || c.name === 'Orchard House' ? 0.12 : 0.55)) return;
        var camps = K.camps(c.i), items = t[7];
        if (!items) {
          if (t[0] === 'kw_qs') items = [[camps[1].adGroups[0].keywords[0], '4', K.money(K.sumDays(c.i, r.from, r.to).cost * 0.04)], [camps[2].adGroups[2].keywords[0], '3', K.money(K.sumDays(c.i, r.from, r.to).cost * 0.02)]];
          else if (t[0] === 'one_ad') items = [[camps[2].adGroups[1].name, '1'], [camps[1].adGroups[2].name, '1']];
          else if (t[0] === 'ad_strength') items = [[camps[0].name + ', ad 1', 'Poor']];
          else if (t[0] === 'manual_cpc') items = [[camps[2].name, 'Manual CPC', String(Math.round(K.sumDays(c.i, r.from, r.to).conv * 0.1))]];
          else if (t[0] === 'tcpa_low') items = [[camps[1].name, '$14.00', K.money(K.sumDays(c.i, r.from, r.to).cost / Math.max(1, K.sumDays(c.i, r.from, r.to).conv) * 1.1)]];
          else if (t[0] === 'age_target') items = [[camps[5].name, 'Age 18 to 24 excluded']];
          else items = [[c.url, String(Math.round(30 + K.hr(c.i, 3) * 20))]];
        }
        addF(c, t[1], t[2], t[3], t[4], t[5], 0, t[6], items, t[0]);
      });
    });
    var sevW = { critical: 30, high: 12, medium: 5, low: 2 };
    K.COMMS.forEach(function (c) {
      if (c.stop) return;
      var mine = findings.filter(function (f) { return f.accountId === c.id; }), counts = { critical: 0, high: 0, medium: 0, low: 0 }, pen = 0;
      mine.forEach(function (f) { counts[f.severity]++; pen += sevW[f.severity]; });
      accounts[c.id] = { id: c.id, name: c.name, score: Math.max(4, Math.min(100, 100 - pen)), counts: counts };
    });
    findings.sort(function (a, b) { return ['critical', 'high', 'medium', 'low'].indexOf(a.severity) - ['critical', 'high', 'medium', 'low'].indexOf(b.severity) || b.impact - a.impact; });
    var hist = {}, yd = {}, td = {};
    Object.keys(accounts).forEach(function (id, i) { td[id] = accounts[id].score; yd[id] = Math.max(0, Math.min(100, accounts[id].score + (i % 4 === 0 ? -6 : (i % 5 === 0 ? 4 : 0)))); });
    hist[D.add(D.today, -1)] = yd; hist[D.today] = td;
    return { audit: { atText: when || (D.text(D.today) + ' at 6:00 AM Central'), accounts: accounts, findings: findings, failed: [] }, history: hist };
  };
})();
