/* Ads Intelligence demo, part 1: the reporting engine.
   Any accounts, up to two breakdowns, any metrics, with comparisons. */
(function () {
  'use strict';
  var K = window.KIT, D = K.d;
  var E = window.ENG = {};

  E.ME = 'you@vertex.example';
  E.PERIODS = [['yesterday', 'Yesterday'], ['last7', 'Last 7 days'], ['last14', 'Last 14 days'], ['last30', 'Last 30 days'], ['last90', 'Last 90 days'], ['thisMonth', 'This month'], ['lastMonth', 'Last month']];
  E.periodLabel = function (p) { var x = E.PERIODS.filter(function (y) { return y[0] === p; })[0]; return x ? x[1] : 'Custom dates'; };
  E.rangeText = function (r) { var sameY = r.from.slice(0, 4) === r.to.slice(0, 4); return D.text(r.from, !sameY) + ' to ' + D.text(r.to, true); };
  E.accounts = function (list) {
    if (!list || list === 'all' || !list.length || (list[0] && /^all$/i.test(list[0]))) return K.COMMS.slice();
    return list.map(function (n) { return K.byName(n); }).filter(function (c) { return c; });
  };
  E.LABEL = { impressions: 'Impressions', clicks: 'Clicks', cost: 'Cost', conversions: 'Conversions', conv_value: 'Conv. value', ctr: 'CTR', avg_cpc: 'Avg. CPC', cpa: 'Cost / conv.', conv_rate: 'Conv. rate', cost_per_value: 'Cost / conv. value', search_is: 'Search impr. share', lost_is_budget: 'Lost IS (budget)', lost_is_rank: 'Lost IS (rank)',
    account: 'Account', campaign: 'Campaign', campaign_type: 'Campaign type', ad_group: 'Ad group', keyword: 'Keyword', search_term: 'Search term', date: 'Day', week: 'Week', month: 'Month', day_of_week: 'Day of week', device: 'Device', network: 'Network' };
  E.KIND = { impressions: 'int', clicks: 'int', cost: 'money', conversions: 'num', conv_value: 'money', ctr: 'share', avg_cpc: 'money', cpa: 'money', conv_rate: 'pct', cost_per_value: 'money', search_is: 'share', lost_is_budget: 'share', lost_is_rank: 'share' };
  var DEV = [['Mobile', 0.66, 0.64, 0.62, 0.61], ['Computers', 0.27, 0.29, 0.31, 0.33], ['Tablets', 0.07, 0.07, 0.07, 0.06]];
  var NET = [['Google search', 0.30, 0.55, 0.56, 0.62], ['Search partners', 0.05, 0.05, 0.05, 0.04], ['Display Network', 0.38, 0.12, 0.10, 0.07], ['YouTube', 0.12, 0.05, 0.05, 0.03], ['Cross-network', 0.15, 0.23, 0.24, 0.24]];
  var DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var SPLIT = { device: DEV, network: NET };
  var TIME = { date: 1, week: 1, month: 1, day_of_week: 1 };

  /* leaves: the finest grain a breakdown needs, as fractions of the account's day */
  function leaves(ci, dims) {
    var c = K.COMMS[ci], camps = K.camps(ci), out = [];
    var need = dims.indexOf('search_term') > -1 ? 'term' : (dims.indexOf('keyword') > -1 ? 'kw' : (dims.indexOf('ad_group') > -1 ? 'ag' : (dims.indexOf('campaign') > -1 || dims.indexOf('campaign_type') > -1 ? 'camp' : 'acct')));
    if (need === 'acct') return [{ v: { account: c.name }, fi: 1, fk: 1, fs: 1, fc: 1 }];
    if (need === 'term') {
      var ts = K.terms(ci);
      ts.forEach(function (x) {
        var k = camps.filter(function (q) { return q.key === x.camp; })[0], g = k.adGroups[x.group] || k.adGroups[0];
        var cpcF = x.camp === 'brand' ? 0.55 : 1.12;
        out.push({ v: { account: c.name, campaign: k.name, campaign_type: k.typeLabel, ad_group: g ? g.name : '', keyword: g && g.keywords[0] ? g.keywords[0] : '', search_term: x.term }, fi: 0.64 * x.fc / (x.camp === 'brand' ? 2.6 : 0.8), fk: 0.64 * x.fc, fs: 0.64 * x.fc * cpcF, fc: 0.66 * x.fv });
      });
      return out;
    }
    camps.forEach(function (k) {
      var base = { account: c.name, campaign: k.name, campaign_type: k.typeLabel };
      if (need === 'camp') { out.push({ v: base, fi: k.fi, fk: k.fk, fs: k.fs, fc: k.fc }); return; }
      var gs = k.adGroups.length ? k.adGroups : (k.assetGroups.length ? k.assetGroups.map(function (a) { return { name: a.name, keywords: [] }; }) : [{ name: k.name, keywords: [] }]);
      gs.forEach(function (g, gi) {
        var wg = gs.length === 1 ? 1 : (gi === 0 ? 0.5 : 0.5 / (gs.length - 1));
        if (need === 'ag') { out.push({ v: Object.assign({}, base, { ad_group: g.name }), fi: k.fi * wg, fk: k.fk * wg, fs: k.fs * wg, fc: k.fc * wg * (0.85 + K.hr(ci, gi + 40) * 0.3) }); return; }
        var kws = g.keywords && g.keywords.length ? g.keywords : ['(no keywords: ' + k.typeLabel + ')'];
        kws.forEach(function (w, wi) {
          var wk = kws.length === 1 ? 1 : (wi === 0 ? 0.65 : 0.35 / (kws.length - 1));
          out.push({ v: Object.assign({}, base, { ad_group: g.name, keyword: w }), fi: k.fi * wg * wk, fk: k.fk * wg * wk, fs: k.fs * wg * wk, fc: k.fc * wg * wk * (0.8 + K.hr(ci, wi + 60) * 0.4) });
        });
      });
    });
    return out;
  }
  function weekOf(iso) { var w = D.dow(iso); return D.add(iso, -((w + 6) % 7)); }
  function tval(dim, iso) { if (dim === 'date') return iso; if (dim === 'week') return weekOf(iso); if (dim === 'month') return iso.slice(0, 7); return DOW[D.dow(iso)]; }

  /* the core: rows keyed by the breakdown values */
  function crunch(accts, dims, r) {
    var map = {}, order = [];
    var tdims = dims.filter(function (d) { return TIME[d]; }), sdims = dims.filter(function (d) { return SPLIT[d]; });
    accts.forEach(function (c) {
      var lv = leaves(c.i, dims), share = K.share(c.i, r.from);
      for (var n = D.num(r.from), e = D.num(r.to); n <= e; n++) {
        var iso = D.fromNum(n), d = K.day(c.i, iso);
        if (!d.clicks && !d.cost) continue;
        lv.forEach(function (L) {
          var parts = [{ m: [1, 1, 1, 1], v: {} }];
          sdims.forEach(function (sd) { var np = []; parts.forEach(function (p) { SPLIT[sd].forEach(function (s) { var v = Object.assign({}, p.v); v[sd] = s[0]; np.push({ m: [p.m[0] * s[1], p.m[1] * s[2], p.m[2] * s[3], p.m[3] * s[4]], v: v }); }); }); parts = np; });
          parts.forEach(function (p) {
            var key = dims.map(function (dm) { return TIME[dm] ? tval(dm, iso) : (SPLIT[dm] ? p.v[dm] : L.v[dm]); });
            var ks = key.join('\u0001'), row = map[ks];
            if (!row) { row = map[ks] = { key: key, impr: 0, clicks: 0, cost: 0, conv: 0, isw: 0, is: 0, isB: 0, isR: 0 }; order.push(ks); }
            var cost = d.cost * L.fs * p.m[2];
            row.impr += d.impr * L.fi * p.m[0]; row.clicks += d.clicks * L.fk * p.m[1]; row.cost += cost; row.conv += d.conv * L.fc * p.m[3];
            row.is += share.is * cost; row.isB += share.isB * cost; row.isR += share.isR * cost; row.isw += cost;
          });
        });
      }
    });
    return order.map(function (k) { return map[k]; });
  }
  function metricOf(row, m, allowIS) {
    var i = row.impr, k = row.clicks, s = row.cost, v = row.conv;
    switch (m) {
      case 'impressions': return Math.round(i);
      case 'clicks': return Math.round(k);
      case 'cost': return Math.round(s * 100) / 100;
      case 'conversions': return Math.round(v * 10) / 10;
      case 'conv_value': return Math.round(v * 40 * 100) / 100;
      case 'ctr': return i ? k / i : null;
      case 'avg_cpc': return k ? s / k : null;
      case 'cpa': return v >= 0.5 ? s / v : null;
      case 'conv_rate': return k ? v / k * 100 : null;
      case 'cost_per_value': return v ? s / (v * 40) : null;
      case 'search_is': return allowIS && row.isw ? row.is / row.isw : null;
      case 'lost_is_budget': return allowIS && row.isw ? row.isB / row.isw : null;
      case 'lost_is_rank': return allowIS && row.isw ? row.isR / row.isw : null;
    }
    return null;
  }
  E.crunch = crunch; E.metricOf = metricOf;
  function totalRow(rows) { var t = { impr: 0, clicks: 0, cost: 0, conv: 0, isw: 0, is: 0, isB: 0, isR: 0 }; rows.forEach(function (r) { ['impr', 'clicks', 'cost', 'conv', 'isw', 'is', 'isB', 'isR'].forEach(function (k) { t[k] += r[k]; }); }); return t; }
  E.totalRow = totalRow;

  E.explore = function (spec) {
    var dims = (spec.breakdown || []).filter(function (d) { return d && E.LABEL[d]; }).slice(0, 2);
    var mets = (spec.metrics || ['impressions', 'clicks', 'cost', 'conversions']).filter(function (m) { return E.KIND[m]; });
    var accts = E.accounts(spec.accounts), r = K.range(spec.period, spec.from, spec.to);
    var allowIS = !dims.some(function (d) { return ['search_term', 'keyword', 'ad_group', 'device', 'network', 'date', 'week', 'month', 'day_of_week'].indexOf(d) > -1; });
    var cur = crunch(accts, dims, r), pr = spec.compare ? K.prevRange(r, spec.compare) : null, prev = pr ? crunch(accts, dims, pr) : null;
    var pmap = {}; (prev || []).forEach(function (x) { pmap[x.key.join('\u0001')] = x; });
    var f = spec.filters || {}, minCost = Number(f.min_cost) || 0, minClicks = Number(f.min_clicks) || 0, q = String(f.contains || '').toLowerCase();
    var rows = cur.filter(function (x) { return x.cost >= minCost && x.clicks >= minClicks && (!q || x.key.join(' ').toLowerCase().indexOf(q) > -1) && (x.clicks >= 0.5 || x.cost >= 0.5); });
    var timeFirst = dims[0] && TIME[dims[0]];
    if (timeFirst) rows.sort(function (a, b) { return dims[0] === 'day_of_week' ? DOW.indexOf(a.key[0]) - DOW.indexOf(b.key[0]) : (a.key[0] < b.key[0] ? -1 : 1); });
    else rows.sort(function (a, b) { return b.cost - a.cost; });
    var columns = dims.map(function (d) { return { key: d, label: E.LABEL[d], kind: 'text' }; });
    mets.forEach(function (m) { columns.push({ key: m, label: E.LABEL[m], kind: E.KIND[m] }); if (spec.compare) columns.push({ key: m + '_change', label: E.LABEL[m] + ' change', kind: 'change' }); });
    var out = rows.slice(0, spec.limit || 5000).map(function (x) {
      var p = pmap[x.key.join('\u0001')], row = x.key.slice();
      mets.forEach(function (m) { var v = metricOf(x, m, allowIS); row.push(v); if (spec.compare) { var pv = p ? metricOf(p, m, allowIS) : null; row.push(v !== null && pv ? (v - pv) / Math.abs(pv) * 100 : null); } });
      return row;
    });
    var T = totalRow(rows), PT = prev ? totalRow(prev) : null, totals = {}, prevTotals = PT ? {} : null;
    mets.forEach(function (m) { totals[m] = metricOf(T, m, true); if (PT) prevTotals[m] = metricOf(PT, m, true); });
    return {
      columns: columns, rows: out, totals: totals, prevTotals: prevTotals, rowCount: out.length,
      spec: { accounts: spec.accounts === 'all' || !spec.accounts || !spec.accounts.length ? 'all' : spec.accounts, breakdown: dims, metrics: mets, period: spec.period, from: spec.from || '', to: spec.to || '', compare: spec.compare || '' },
      accounts: accts.map(function (c) { return c.name; }),
      range: { label: E.periodLabel(spec.period), text: E.rangeText(r), from: r.from, to: r.to, compareLabel: spec.compare === 'year' ? 'same period last year' : 'previous period', prevText: pr ? E.rangeText(pr) : '' },
      notes: dims.indexOf('search_term') > -1 ? ['Search terms cover search campaigns only, as in Google Ads.'] : []
    };
  };
  /* the same result, in the shape chat answers use */
  E.toResult = function (res, label) {
    return { columns: res.columns.map(function (c) { return c.key; }), kinds: res.columns.map(function (c) { return c.kind; }), labels: res.columns.map(function (c) { return c.label; }), rows: res.rows, label: label || (res.range.label + ' · ' + res.range.text), spec: res.spec };
  };
  E.table = function (cols, rows, label, spec) {
    return { columns: cols.map(function (c) { return c[0]; }), kinds: cols.map(function (c) { return c[2] || E.KIND[c[0]] || 'text'; }), labels: cols.map(function (c) { return c[1] || E.LABEL[c[0]] || c[0]; }), rows: rows, label: label || '', spec: spec };
  };

  /* per account numbers for a range, with the previous range */
  E.acctStats = function (r, pr) {
    return K.COMMS.map(function (c) {
      var a = K.derive(K.sumDays(c.i, r.from, r.to)), b = pr ? K.derive(K.sumDays(c.i, pr.from, pr.to)) : null;
      return { c: c, cur: a, prev: b, convChg: b && b.conv ? (a.conv - b.conv) / b.conv * 100 : null, cpaChg: b && a.cpa && b.cpa ? (a.cpa - b.cpa) / b.cpa * 100 : null, costChg: b && b.cost ? (a.cost - b.cost) / b.cost * 100 : null, clickChg: b && b.clicks ? (a.clicks - b.clicks) / b.clicks * 100 : null };
    });
  };
  E.gaql = {
    acct: function (r) { return 'SELECT customer.descriptive_name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM customer WHERE segments.date BETWEEN \'' + r.from + '\' AND \'' + r.to + '\''; },
    camp: function (r) { return 'SELECT campaign.name, campaign.advertising_channel_type, metrics.cost_micros, metrics.conversions FROM campaign WHERE segments.date BETWEEN \'' + r.from + '\' AND \'' + r.to + '\' AND campaign.status != \'REMOVED\''; },
    terms: function (r) { return 'SELECT search_term_view.search_term, campaign.name, metrics.clicks, metrics.cost_micros, metrics.conversions FROM search_term_view WHERE segments.date BETWEEN \'' + r.from + '\' AND \'' + r.to + '\' AND metrics.cost_micros > 0'; },
    daily: function (r) { return 'SELECT segments.date, metrics.cost_micros, metrics.conversions, metrics.clicks FROM customer WHERE segments.date BETWEEN \'' + r.from + '\' AND \'' + r.to + '\''; },
    hist: function (r) { return 'SELECT change_event.change_date_time, change_event.change_resource_type, change_event.user_email FROM change_event WHERE change_event.change_date_time >= \'' + r.from + '\' LIMIT 500'; },
    conv: function (r) { return 'SELECT conversion_action.name, segments.conversion_action_category, metrics.all_conversions FROM conversion_action WHERE segments.date BETWEEN \'' + r.from + '\' AND \'' + r.to + '\''; }
  };
  E.pct = function (v) { return (v > 0 ? '+' : '') + Math.round(v) + '%'; };
  E.abs = function (v) { return Math.round(Math.abs(v)) + '%'; };
  E.money = K.money; E.int = K.int;
  E.num = function (v) { return Math.abs(v) >= 10 ? Math.round(v).toLocaleString('en-US') : (Math.round(v * 10) / 10).toString(); };
})();
