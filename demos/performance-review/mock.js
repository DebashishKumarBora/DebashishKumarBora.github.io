/* Performance Review demo: the server side, on sample data. */
(function () {
  'use strict';
  var K = window.KIT, D = K.d, H = K.H;
  K.badge();
  var ME = 'you@vertex.example';
  var TIERN = ['Tier 1', 'Tier 2', 'Tier 3'];
  var MONTH = D.MONF, MON = D.MON;

  /* ---------------- stored state: context, notes, ideas ---------------- */
  var t0 = D.today;
  function cid(n) { return K.byName(n).id; }
  var EVENTS = [
    { id: 'e1', date: D.add(t0, -9), acct: cid('The Merritt'), text: 'Website tag container replaced during the site redesign' },
    { id: 'e2', date: D.add(t0, -14), acct: cid('Aster Yards'), text: 'Generic search keywords switched to broad match with Smart Bidding' },
    { id: 'e3', date: D.add(t0, -48), acct: 'all', text: 'New lake and skyline photo sets added to every Performance Max asset group' },
    { id: 'e4', date: D.add(t0, -96), acct: cid('Lakeview Terrace'), text: 'Headlines rewritten around lake views and balconies' },
    { id: 'e5', date: D.add(t0, -170), acct: cid('Cedar Row'), text: 'Daily budget held flat while search demand rose' },
    { id: 'e6', date: D.add(t0, -250), acct: cid('The Wren'), text: 'Account launched for the lease-up' },
    { id: 'e7', date: D.add(t0, -232), acct: 'all', text: 'Spring lease-up push: budgets raised 15% for April and May' },
    { id: 'e8', date: D.add(t0, -330), acct: cid('Birch Hollow'), text: 'Account launched for the lease-up' },
    { id: 'e9', date: D.add(t0, -52), acct: cid('The Ellery'), text: 'Campaigns paused: the community is fully leased' }
  ];
  var NOTES = {};
  NOTES[cid('Fenwick Place')] = { text: 'Two buildings have been under renovation since June, so fewer homes were available to lease and the budget was trimmed on purpose.', at: D.text(D.add(t0, -40), true), by: 'Morgan Reyes' };
  var IDEAS = [
    { id: 'i1', title: 'Spring 2 bedroom push', detail: 'Raise budgets on the bedroom campaigns in March, when 2 bedroom searches climb fastest.', month: 3, cat: 'Budget', acct: 'all', by: 'Morgan Reyes' },
    { id: 'i2', title: 'Holiday tour special', detail: 'A small move-in offer for tours booked in the first two weeks of December.', month: 11, cat: 'Campaign', acct: 'all', by: 'Taylor Brooks' },
    { id: 'i3', title: 'Lake view video for Demand Gen', detail: 'Cut the balcony and pool footage into a 15 second video.', month: 5, cat: 'Creative', acct: cid('Lakeview Terrace'), by: 'Taylor Brooks' },
    { id: 'i4', title: 'New tag container audit', detail: 'Check every conversion action after each site update, starting with the communities that changed hosting.', month: 0, cat: 'Tracking', acct: 'all', by: 'Morgan Reyes' }
  ];
  var DEF = null;

  /* ---------------- helpers ---------------- */
  function sumC(ci, f, t) { var x = K.sumDays(ci, f, t), sh = K.share(ci, f); var o = K.derive(x); o.spend = x.cost; o.is = sh.is; o.isB = sh.isB; o.isR = sh.isR; o.per1k = x.cost ? x.conv / x.cost * 1000 : null; return o; }
  function agg(list) {
    var t = { spend: 0, impr: 0, clicks: 0, conv: 0, isw: 0, isB: 0, isR: 0, is: 0 };
    list.forEach(function (o) { t.spend += o.spend; t.impr += o.impr; t.clicks += o.clicks; t.conv += o.conv; if (o.spend) { t.is += o.is * o.spend; t.isB += o.isB * o.spend; t.isR += o.isR * o.spend; t.isw += o.spend; } });
    return {
      spend: t.spend, impr: t.impr, clicks: t.clicks, conv: t.conv,
      ctr: t.impr ? t.clicks / t.impr : null, cvr: t.clicks ? t.conv / t.clicks : null,
      cpa: t.conv >= 0.5 ? t.spend / t.conv : null, cpc: t.clicks ? t.spend / t.clicks : null,
      per1k: t.spend ? t.conv / t.spend * 1000 : null,
      is: t.isw ? t.is / t.isw : null, isB: t.isw ? t.isB / t.isw : null, isR: t.isw ? t.isR / t.isw : null
    };
  }
  function chg(a, b) { return (a === null || b === null || b === undefined || a === undefined || !b) ? null : (a - b) / Math.abs(b); }
  function chgs(c, p) { var o = {}; ['spend', 'impr', 'clicks', 'conv', 'ctr', 'cvr', 'cpa', 'cpc', 'per1k'].forEach(function (k) { o[k] = chg(c[k], p[k]); }); return o; }
  function money(n) { return n === null ? 'n/a' : '$' + Math.round(n).toLocaleString('en-US'); }
  function money2(n) { return n === null ? 'n/a' : '$' + n.toFixed(2); }
  function num(n) { return Math.round(n).toLocaleString('en-US'); }
  function rate(f) { if (f === null) return 'n/a'; var v = f * 100; return (v < 10 ? v.toFixed(2) : v.toFixed(1)) + '%'; }
  function pc(f) { var v = Math.abs(f * 100); return (v < 10 ? (Math.round(v * 10) / 10) : Math.round(v)) + '%'; }
  function lbl(a, b) { return D.text(a, true) + ' – ' + D.text(b, true); }
  function shiftYear(s, n) { var y = +s.slice(0, 4) + n, m = s.slice(5, 7), d = s.slice(8, 10); if (m === '02' && d === '29') d = '28'; return y + '-' + m + '-' + d; }
  function monthsBetween(f, t) { var out = [], m = f.slice(0, 7); while (m <= t.slice(0, 7)) { out.push(m); var y = +m.slice(0, 4), mo = +m.slice(5, 7) + 1; if (mo > 12) { mo = 1; y++; } m = y + '-' + (mo < 10 ? '0' : '') + mo; } return out; }
  function clip(m, f, t) { var a = m + '-01', b = D.monthEnd(a); return { from: a < f ? f : a, to: b > t ? t : b, partial: a < f || b > t }; }

  function ranges(q) {
    var s = q.start, e = q.end, cs, ce, cmpName;
    if (q.compare === 'prev') { var n = D.days(s, e); ce = D.add(s, -1); cs = D.add(ce, -(n - 1)); cmpName = 'Period before'; }
    else if (q.compare === 'custom') { cs = q.cmpStart; ce = q.cmpEnd; cmpName = 'Comparison'; }
    else { cs = shiftYear(s, -1); ce = shiftYear(e, -1); cmpName = 'Year before'; }
    return { start: s, end: e, cs: cs, ce: ce, curName: 'This period', cmpName: cmpName, curLabel: lbl(s, e), cmpLabel: lbl(cs, ce) };
  }

  function communityRows(r) {
    var curAll = K.COMMS.map(function (c) { return sumC(c.i, r.start, r.end); });
    var order = K.COMMS.map(function (c) { return c.i; }).sort(function (a, b) { return curAll[b].spend - curAll[a].spend; });
    var tiers = {}; order.forEach(function (ci, k) { tiers[ci] = k < 6 ? 1 : (k < 11 ? 2 : 3); });
    var recentStart = D.add(D.yesterday, -29);
    return K.COMMS.map(function (c) {
      var cur = curAll[c.i], cmp = sumC(c.i, r.cs, r.ce), ch = chgs(cur, cmp), recent = K.sumDays(c.i, recentStart, D.yesterday).cost;
      var status;
      if (cur.spend < 1 && cmp.spend < 1) status = null;
      else if (cmp.spend < 1) status = 'new';
      else if (recent < 1 && r.end >= recentStart) status = 'ended';
      else if ((ch.conv !== null && ch.conv < -0.1) || (ch.cpa !== null && ch.cpa > 0.15)) status = 'attention';
      else if ((ch.conv !== null && ch.conv > 0.1) || (ch.cpa !== null && ch.cpa < -0.1)) status = 'improved';
      else status = 'steady';
      return { c: c, cur: cur, cmp: cmp, chg: ch, tier: tiers[c.i], status: status };
    }).filter(function (x) { return x.status; });
  }
  var SLABEL = { improved: 'Improved', steady: 'Steady', 'new': 'New this period', attention: 'Needs attention', ended: 'Not running now' };

  function drivers(x) {
    var d = [], ch = x.chg;
    if (x.status === 'new') return [{ text: 'New this period, so there is nothing to compare with yet. ' + num(x.cur.conv) + ' conversions at ' + money2(x.cur.cpa) + ' each.', good: true }];
    if (ch.conv !== null && Math.abs(ch.conv) > 0.04) d.push({ text: 'Conversions ' + (ch.conv > 0 ? 'up ' : 'down ') + pc(ch.conv) + ' to ' + num(x.cur.conv), good: ch.conv > 0, bad: ch.conv < 0 });
    if (ch.cpa !== null && Math.abs(ch.cpa) > 0.04) d.push({ text: 'Cost per conversion ' + (ch.cpa < 0 ? 'down ' : 'up ') + pc(ch.cpa) + ' to ' + money2(x.cur.cpa), good: ch.cpa < 0, bad: ch.cpa > 0 });
    if (ch.spend !== null && Math.abs(ch.spend) > 0.08) d.push({ text: 'Spend ' + (ch.spend > 0 ? 'up ' : 'down ') + pc(ch.spend) + ' to ' + money(x.cur.spend) });
    if (ch.ctr !== null && Math.abs(ch.ctr) > 0.06) d.push({ text: 'Click-through rate ' + (ch.ctr > 0 ? 'rose' : 'fell') + ' from ' + rate(x.cmp.ctr) + ' to ' + rate(x.cur.ctr), good: ch.ctr > 0, bad: ch.ctr < 0 });
    if (x.cur.isB > 0.25) d.push({ text: Math.round(x.cur.isB * 100) + '% of eligible search impressions were missed because the daily budget ran out', bad: true });
    if (x.c.name === 'The Merritt') d.push({ text: 'Conversions nearly stopped in the last 9 days, right after the website tag change', bad: true });
    return d.slice(0, 5);
  }
  function campRows(x, r) {
    return K.camps(x.c.i).map(function (k) {
      var a = K.campSum(x.c.i, k, r.start, r.end), b = K.campSum(x.c.i, k, r.cs, r.ce);
      return { name: k.name, typeLabel: k.typeLabel, status: k.status, cur: { spend: a.cost, conv: a.conv, cpa: a.conv >= 0.5 ? a.cost / a.conv : null }, cmp: { spend: b.cost, conv: b.conv, cpa: b.conv >= 0.5 ? b.cost / b.conv : null } };
    }).filter(function (k) { return k.cur.spend >= 1 || k.cmp.spend >= 1; }).sort(function (a, b) { return b.cur.spend - a.cur.spend; });
  }
  function eventsIn(r, acct) {
    return EVENTS.filter(function (e) { return e.date >= r.cs && e.date <= r.end && (!acct || e.acct === acct || e.acct === 'all'); })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; })
      .map(function (e) { return { id: e.id, dateLabel: D.text(e.date, true), community: e.acct === 'all' ? 'All communities' : K.byId(e.acct).name, text: e.text }; });
  }

  function report(q) {
    var r = ranges(q), all = communityRows(r), list = all;
    var tierLabel = 'All communities';
    if (/^[123]$/.test(q.tier)) { list = all.filter(function (x) { return String(x.tier) === q.tier; }); tierLabel = TIERN[+q.tier - 1]; }
    else if (/^a\d+$/.test(q.tier || '')) { list = all.filter(function (x) { return 'a' + x.c.id === q.tier; }); tierLabel = list[0] ? list[0].c.name : 'One community'; }
    var cur = agg(list.map(function (x) { return x.cur; })), cmp = agg(list.map(function (x) { return x.cmp; })), ch = chgs(cur, cmp);
    var st = { improved: 0, steady: 0, 'new': 0, attention: 0, ended: 0 }; list.forEach(function (x) { st[x.status]++; });

    /* months */
    var curM = monthsBetween(r.start, r.end), cmpM = monthsBetween(r.cs, r.ce), n = Math.max(curM.length, cmpM.length), months = [];
    function mrow(m, f, t) {
      if (!m) return null; var w = clip(m, f, t), o = agg(list.map(function (x) { return sumC(x.c.i, w.from, w.to); }));
      return { m: m, spend: o.spend, conv: o.conv, cpa: o.cpa, clicks: o.clicks, impr: o.impr, ctr: o.ctr, cvr: o.cvr, partial: w.partial };
    }
    for (var i = 0; i < n; i++) months.push({ cur: mrow(curM[i], r.start, r.end), cmp: mrow(cmpM[i], r.cs, r.ce) });

    /* mix by campaign type */
    var mixT = {};
    list.forEach(function (x) {
      K.camps(x.c.i).forEach(function (k) {
        var a = K.campSum(x.c.i, k, r.start, r.end), b = K.campSum(x.c.i, k, r.cs, r.ce), m = mixT[k.typeLabel] || (mixT[k.typeLabel] = { label: k.typeLabel, cur: { spend: 0, conv: 0 }, cmp: { spend: 0, conv: 0 } });
        m.cur.spend += a.cost; m.cur.conv += a.conv; m.cmp.spend += b.cost; m.cmp.conv += b.conv;
      });
    });
    var mix = Object.keys(mixT).map(function (k) { var m = mixT[k]; m.cur.cpa = m.cur.conv >= 0.5 ? m.cur.spend / m.cur.conv : null; m.cmp.cpa = m.cmp.conv >= 0.5 ? m.cmp.spend / m.cmp.conv : null; m.curShare = cur.spend ? m.cur.spend / cur.spend : 0; m.cmpShare = cmp.spend ? m.cmp.spend / cmp.spend : 0; return m; }).sort(function (a, b) { return b.cur.spend - a.cur.spend; });

    /* tiers always cover the portfolio */
    var tiers = [1, 2, 3].map(function (t) {
      var xs = all.filter(function (x) { return x.tier === t; }), a = agg(xs.map(function (x) { return x.cur; })), b = agg(xs.map(function (x) { return x.cmp; }));
      return { tier: t, count: xs.length, names: xs.map(function (x) { return x.c.name; }), cur: a, cmp: b, chg: chgs(a, b) };
    });

    /* movers */
    var withDelta = list.map(function (x) { return { name: x.c.name, delta: x.cur.conv - x.cmp.conv, cur: x.cur.conv, cmp: x.cmp.conv, acct: x.c.id }; });
    var up = withDelta.filter(function (m) { return m.delta > 0; }).sort(function (a, b) { return b.delta - a.delta; }).slice(0, 5);
    var down = withDelta.filter(function (m) { return m.delta < 0; }).sort(function (a, b) { return a.delta - b.delta; }).slice(0, 4);

    /* quarters */
    var quarters = null;
    if (months.length >= 4) {
      var qmap = {}, qorder = [];
      months.forEach(function (m) {
        if (!m.cur) return; var y = m.cur.m.slice(0, 4), qn = Math.floor((+m.cur.m.slice(5, 7) - 1) / 3) + 1, key = 'Q' + qn + ' ' + y;
        if (!qmap[key]) { qmap[key] = { label: key, cur: { spend: 0, conv: 0 }, cmp: { spend: 0, conv: 0 }, n: 0, partial: false }; qorder.push(key); }
        var o = qmap[key]; o.cur.spend += m.cur.spend; o.cur.conv += m.cur.conv; if (m.cmp) { o.cmp.spend += m.cmp.spend; o.cmp.conv += m.cmp.conv; } o.n++; if (m.cur.partial) o.partial = true;
      });
      quarters = qorder.map(function (k) { var o = qmap[k]; if (o.n < 3) o.partial = true; o.cur.cpa = o.cur.conv ? o.cur.spend / o.cur.conv : null; o.cmp.cpa = o.cmp.conv ? o.cmp.spend / o.cmp.conv : null; o.chg = { spend: chg(o.cur.spend, o.cmp.spend), conv: chg(o.cur.conv, o.cmp.conv), cpa: chg(o.cur.cpa, o.cmp.cpa) }; return o; });
    }

    /* devices */
    var DV = [['Mobile phones', 0.63, 0.59, 1.0], ['Computers', 0.31, 0.34, 1.18], ['Tablets', 0.06, 0.07, 0.8]];
    var device = DV.map(function (d) {
      return { label: d[0], curShare: d[1], cmpShare: d[2], cur: { conv: cur.conv * d[1], cvr: cur.cvr * d[3] * (d[0] === 'Mobile phones' ? 1.03 : 1), spend: cur.spend * (d[1] + 0.02) }, cmp: { conv: cmp.conv * d[2], cvr: cmp.cvr * d[3] } };
    });

    /* stories */
    var byConvPct = list.filter(function (x) { return x.status !== 'new' && x.cmp.conv > 20 && x.chg.conv !== null; }).sort(function (a, b) { return b.chg.conv - a.chg.conv; });
    function winCard(x) {
      return { scope: 'Community', title: x.c.name, metric: (x.chg.conv > 0 ? '+' : '') + Math.round(x.chg.conv * 100) + '%', metricLabel: 'conversions',
        detail: 'Conversions up ' + pc(x.chg.conv) + ' to ' + num(x.cur.conv) + (x.chg.cpa !== null && x.chg.cpa < 0 ? ', and each one cost ' + pc(x.chg.cpa) + ' less' : '') + '.',
        why: drivers(x).filter(function (d) { return d.good; }).slice(1, 3).map(function (d) { return d.text + '.'; }), acct: x.c.id };
    }
    var glance = [];
    if (ch.ctr !== null && ch.ctr > 0.02) glance.push({ scope: 'Portfolio', title: 'Ads earned more clicks per impression', metric: rate(cur.ctr), metricLabel: 'click-through rate', detail: 'Click-through rate rose from ' + rate(cmp.ctr) + ' to ' + rate(cur.ctr) + ' across ' + list.length + ' communities.', why: [] });
    else glance.push({ scope: 'Portfolio', title: 'More conversions for the budget', metric: cur.per1k ? cur.per1k.toFixed(1) : 'n/a', metricLabel: 'conversions per $1,000', detail: 'Every $1,000 of spend produced ' + (cur.per1k ? cur.per1k.toFixed(1) : 'n/a') + ' conversions, against ' + (cmp.per1k ? cmp.per1k.toFixed(1) : 'n/a') + ' before.', why: [] });
    byConvPct.filter(function (x) { return x.chg.conv > 0; }).slice(0, 2).forEach(function (x) { glance.push(winCard(x)); });
    var wins = byConvPct.filter(function (x) { return x.chg.conv > 0.05; }).slice(0, 4).map(winCard);
    var newOnes = list.filter(function (x) { return x.status === 'new'; });
    if (newOnes.length && wins.length < 4) wins.push({ scope: 'New communities', title: newOnes.map(function (x) { return x.c.name; }).join(' and '), metric: num(newOnes.reduce(function (s, x) { return s + x.cur.conv; }, 0)), metricLabel: 'conversions', detail: 'Launched during this period for lease-up and already producing leads at ' + money2(agg(newOnes.map(function (x) { return x.cur; })).cpa) + ' each.', why: [] });
    var att = list.filter(function (x) { return x.status === 'attention'; }).sort(function (a, b) { return (b.cur.spend * (b.chg.cpa || 0)) - (a.cur.spend * (a.chg.cpa || 0)); });
    var NEXT = {
      'The Merritt': 'Check that every conversion action still fires after the tag container change, then compare a test lead form with what Google Ads records.',
      'Aster Yards': 'Review the search terms since the broad match switch, add negatives for the searches that never convert, and keep exact match on the best performers.',
      'The Hartley': 'Refresh the headlines and test a new offer line. Click-through rate has slipped against similar communities.',
      'Fenwick Place': 'Keep spend aligned with the homes available during the renovation, then step it back up as buildings reopen.',
      'Cedar Row': 'Raise the daily budget on the search campaigns, which convert well but stop showing early in the day.'
    };
    var limits = att.slice(0, 3).map(function (x) {
      var extra = x.chg.cpa !== null && x.chg.cpa > 0 ? x.cur.spend - x.cur.conv * x.cmp.cpa : 0;
      return { scope: 'Community', title: x.c.name, headline: (x.chg.conv !== null && x.chg.conv < 0 ? 'Conversions down ' + pc(x.chg.conv) : 'Conversions ' + (x.chg.conv >= 0 ? 'up ' : 'down ') + pc(x.chg.conv || 0)) + (x.chg.cpa !== null ? ', cost per conversion ' + (x.chg.cpa > 0 ? 'up ' : 'down ') + pc(x.chg.cpa) : ''),
        detail: 'Spend was ' + money(x.cur.spend) + ' against ' + money(x.cmp.spend) + ' in the ' + r.cmpName.toLowerCase() + ', and produced ' + num(x.cur.conv) + ' conversions.',
        why: drivers(x).filter(function (d) { return d.bad; }).map(function (d) { return d.text + '.'; }).slice(0, 3),
        next: NEXT[x.c.name] || 'Review search terms, ads and landing pages for this community, and confirm conversion tracking is recording every lead.',
        impactText: extra > 50 ? 'About ' + money(extra) + ' of spend came in above last period’s cost per conversion.' : '', acct: x.c.id };
    });
    var cedar = all.filter(function (x) { return x.c.name === 'Cedar Row'; })[0];
    var recs = [
      { title: 'Fund the communities that run out of budget first', detail: (cedar ? 'Cedar Row converts at ' + money2(cedar.cur.cpa) + ' but missed ' + Math.round(cedar.cur.isB * 100) + '% of eligible searches because its budget ran out. ' : '') + 'Move budget from the least efficient campaigns to the ones losing impressions to budget.', impactText: cedar ? 'Recovering half of the missed searches could add about ' + num(cedar.cur.conv * cedar.cur.isB / Math.max(0.2, cedar.cur.is) * 0.5) + ' conversions a year.' : '' },
      { title: 'Check tracking after every website change', detail: 'The Merritt shows how one site update can silence conversion tracking. A short checklist after each release keeps the numbers honest.', impactText: '' },
      { title: 'Pair broad match with a weekly negative review', detail: 'Broad match found new searches at Aster Yards, but also paid for searches that never converted. A weekly negative keyword review keeps the reach without the waste.', impactText: '' },
      { title: 'Plan the spring lease-up in January', detail: 'Conversions peak from April to August. Raising budgets two weeks before the curve, not after, captures the early searches at lower cost.', impactText: '' },
      { title: 'Refresh creative every quarter', detail: 'The communities that rotated new photos and headlines held higher click-through rates through the year.', impactText: '' }
    ];
    var reasons = {
      wins: [
        { title: 'New photo-led headlines lifted click-through rate', detail: 'Communities that rewrote headlines around their best views saw higher click-through rates in the months that followed.', evidence: ['Lakeview Terrace headlines rewritten ' + D.text(D.add(t0, -96), true), 'Portfolio click-through rate ' + rate(cmp.ctr) + ' to ' + rate(cur.ctr)], impactText: '', accts: [cid('Lakeview Terrace')] },
        { title: 'Performance Max found cheaper conversions', detail: 'Performance Max produced conversions below the portfolio average once the new photo sets were added.', evidence: ['New asset photos added ' + D.text(D.add(t0, -48), true)], impactText: '', accts: [] },
        { title: 'Two new communities joined at healthy costs', detail: 'The Wren and Birch Hollow launched during the period and reached a steady cost per conversion within weeks.', evidence: ['Launch dates in the Context log'], impactText: '', accts: [cid('The Wren'), cid('Birch Hollow')] }
      ],
      limits: [
        { title: 'A tracking gap after a site update', detail: 'Conversions at The Merritt nearly stopped after the tag container changed, while clicks held steady. The numbers point to tracking, not demand.', evidence: ['Tag container replaced ' + D.text(D.add(t0, -9), true), 'Clicks steady, conversions down sharply in the same days'], impactText: '', accts: [cid('The Merritt')] },
        { title: 'Broad match reached costlier searches', detail: 'After the switch to broad match at Aster Yards, spend rose faster than conversions as the ads matched wider searches.', evidence: ['Match type change ' + D.text(D.add(t0, -14), true)], impactText: '', accts: [cid('Aster Yards')] },
        { title: 'Budget limits during peak demand', detail: 'Cedar Row stopped showing for a large share of searches each day once its budget ran out.', evidence: ['Budget held flat ' + D.text(D.add(t0, -170), true)], impactText: '', accts: [cid('Cedar Row')] }
      ]
    };

    var communities = list.map(function (x) {
      var cm = []; for (var j = 0; j < n; j++) { var a = curM[j] ? clip(curM[j], r.start, r.end) : null, b = cmpM[j] ? clip(cmpM[j], r.cs, r.ce) : null; cm.push({ cur: a ? { conv: K.sumDays(x.c.i, a.from, a.to).conv, spend: K.sumDays(x.c.i, a.from, a.to).cost } : null, cmp: b ? { conv: K.sumDays(x.c.i, b.from, b.to).conv, spend: K.sumDays(x.c.i, b.from, b.to).cost } : null }); }
      return { id: x.c.id, name: x.c.name, tier: x.tier, tierSet: 'auto', status: x.status, statusLabel: SLABEL[x.status], cur: x.cur, cmp: x.cmp, chg: x.chg, note: NOTES[x.c.id] || null, drivers: drivers(x), months: cm, camps: campRows(x, r), events: eventsIn(r, x.c.id).filter(function (e) { return e.community === x.c.name; }), warn: [] };
    }).sort(function (a, b) { return b.cur.spend - a.cur.spend; });

    var cu = ch.conv, cp = ch.cpa;
    var headline = 'Our ads delivered ' + num(cur.conv) + ' conversions' + (cu !== null ? ', ' + (cu >= 0 ? 'up ' : 'down ') + pc(cu) : '') + (cp !== null ? ', while cost per conversion ' + (cp <= 0 ? 'fell ' : 'rose ') + pc(cp) : '') + '.';
    function tile(label, k, f) { return { label: label, curText: f(cur[k]), cmpText: f(cmp[k]), chg: ch[k], fav: k === 'spend' ? null : (ch[k] === null ? null : (ch[k] * ({ conv: 1, clicks: 1, ctr: 1, cvr: 1, cpa: -1 })[k] > 0.0005 ? true : (ch[k] * ({ conv: 1, clicks: 1, ctr: 1, cvr: 1, cpa: -1 })[k] < -0.0005 ? false : null))) }; }
    return {
      range: { curName: r.curName, cmpName: r.cmpName, curLabel: r.curLabel, cmpLabel: r.cmpLabel, start: r.start, end: r.end },
      meta: { communityCount: list.length, tier: q.tier || 'all', tierLabel: tierLabel, generated: D.text(D.today, true) + ', ' + D.timeText(), failed: [], warnings: [], isAdmin: true, title: 'Google Ads Performance Review', ownerName: '', ownerRole: '', tierNames: TIERN },
      headline: headline,
      copy: {
        lede: 'This review compares ' + r.curLabel + ' with ' + r.cmpLabel + ' across ' + list.length + (list.length === 1 ? ' community.' : ' communities.'),
        spend: 'Spend ' + (ch.spend >= 0 ? 'rose ' : 'fell ') + pc(ch.spend || 0) + ' to ' + money(cur.spend) + '. Each $1,000 now produces ' + (cur.per1k ? cur.per1k.toFixed(1) : 'n/a') + ' conversions, against ' + (cmp.per1k ? cmp.per1k.toFixed(1) : 'n/a') + ' before.',
        wins: wins.length ? 'The strongest gains came from communities that refreshed their creative and kept tracking clean.' : 'No community improved enough in this range to call out.',
        limits: limits.length ? 'A few communities spent more for each lead. The reasons are specific and fixable.' : 'Every community held its results in this range.',
        recs: 'Five moves for next year, ordered by how much they should return.'
      },
      tiles: [tile('Ad spend', 'spend', money), tile('Conversions', 'conv', num), tile('Cost per conversion', 'cpa', money2), tile('Clicks', 'clicks', num), tile('Click-through rate', 'ctr', rate), tile('Conversion rate', 'cvr', rate)],
      glance: glance, status: st, totals: { cur: cur, cmp: cmp, chg: ch }, months: months, mix: mix, tiers: tiers,
      movers: up.length || down.length ? { up: up, down: down } : null, quarters: quarters, device: device,
      wins: wins, limits: limits, zeroCamps: [], recs: recs, reasons: reasons, events: eventsIn(r), communities: communities
    };
  }

  /* ---------------- server functions ---------------- */
  H.apiBootstrap = function () {
    return { user: ME, admin: true, connected: true, accounts: K.COMMS.length, today: D.today, yesterday: D.yesterday, def: DEF, tierNames: TIERN, ai: false,
      communities: K.COMMS.map(function (c) { return { id: c.id, name: c.name }; }).sort(function (a, b) { return a.name.localeCompare(b.name); }) };
  };
  H.apiGetReport = function (q) { return report(q); };
  H.apiSaveDefault = function (p) { DEF = p; return { def: p }; };
  H.apiSaveNote = function (id, t) { if (t && t.trim()) NOTES[id] = { text: t.trim(), at: D.text(D.today, true), by: 'You' }; else delete NOTES[id]; return { note: NOTES[id] || null }; };
  function ctx() {
    return { admin: true, events: EVENTS.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).map(function (e) { return { id: e.id, dateLabel: D.text(e.date, true), community: e.acct === 'all' ? 'All communities' : K.byId(e.acct).name, text: e.text }; }),
      notes: Object.keys(NOTES).map(function (k) { return { community: K.byId(k).name, text: NOTES[k].text, at: NOTES[k].at }; }) };
  }
  H.apiGetContext = ctx;
  H.apiAddEvent = function (e) { if (!e.date || !e.text || !e.text.trim()) throw new Error('Add a date and what changed.'); EVENTS.push({ id: 'e' + Date.now(), date: e.date, acct: e.acct || 'all', text: e.text.trim() }); return ctx(); };
  H.apiDeleteEvent = function (id) { EVENTS = EVENTS.filter(function (e) { return e.id !== id; }); return ctx(); };
  function ideas() {
    return { admin: true, cats: ['Campaign', 'Budget', 'Creative', 'Landing page', 'Tracking', 'Other'],
      ideas: IDEAS.map(function (i) { return { id: i.id, title: i.title, detail: i.detail, month: i.month, cat: i.cat, acct: i.acct, community: i.acct === 'all' ? 'All communities' : K.byId(i.acct).name, by: i.by, mine: i.by === 'You' }; }) };
  }
  H.apiGetIdeas = ideas;
  H.apiAddIdea = function (o) { if (!o.title || !o.title.trim()) throw new Error('Give the idea a short title.'); IDEAS.push({ id: 'i' + Date.now(), title: o.title.trim(), detail: (o.detail || '').trim(), month: +o.month || 0, cat: o.cat || 'Other', acct: o.acct || 'all', by: 'You' }); return ideas(); };
  H.apiDeleteIdea = function (id) { IDEAS = IDEAS.filter(function (i) { return i.id !== id; }); return ideas(); };
  H.apiClearCache = function () { return { ok: true }; };
  K.delay.apiGetReport = 900;
  K.delay.apiBootstrap = 300;
})();
