/* Ads Intelligence demo, part 3: chat, projects and every server call.
   Answers are written from the sample data by rules, so every number in
   them is real for this dataset. The real tool runs Claude on live data. */
(function () {
  'use strict';
  var K = window.KIT, D = K.d, H = K.H, E = window.ENG, T = window.TOOLS2;
  K.badge();
  try { if (!localStorage.getItem('vx_ai_session')) localStorage.setItem('vx_ai_session', 'demo'); } catch (e) {}

  var money = K.money, int = K.int;
  function ph(l) { return /^(Last|This|Yesterday)/.test(l) ? 'the ' + l.charAt(0).toLowerCase() + l.slice(1) : (l === 'Custom dates' ? 'the selected dates' : l); }
  function ph2(l) { return /^Yesterday/.test(l) ? 'yesterday' : (/^This month/.test(l) ? 'this month so far' : ph(l)); }
  function pc(v) { return Math.round(Math.abs(v)) < 1 ? 'flat' : (v > 0 ? 'up ' : 'down ') + Math.round(Math.abs(v)) + '%'; }
  function cpaTxt(v) { return v === null || v === undefined ? 'n/a' : money(v); }
  var uid = 100;
  function id(p) { return p + (++uid).toString(36) + Date.now().toString(36).slice(-4); }

  /* ---------------- answers ---------------- */
  function ctxRange(ctx, text) {
    var q = String(text || '').toLowerCase();
    if (/this month/.test(q) && /last month/.test(q)) {
      var f = D.monthStart(D.today, 0), t = D.yesterday; if (f > t) { f = D.monthStart(D.today, 1); t = D.monthEnd(f); }
      var n = D.days(f, t), pf = D.monthStart(f, 1), pt = D.add(pf, n - 1);
      return { r: { from: f, to: t }, pr: { from: pf, to: pt }, label: 'This month so far', cmp: 'the same days last month' };
    }
    if (/last month/.test(q) && ctx.period === 'last30') { var lf = D.monthStart(D.today, 1), lt = D.monthEnd(lf), pf2 = D.monthStart(D.today, 2); return { r: { from: lf, to: lt }, pr: { from: pf2, to: D.monthEnd(pf2) }, label: D.MONF[+lf.slice(5, 7) - 1], cmp: D.MONF[+pf2.slice(5, 7) - 1] }; }
    var yr = ctx.compare === 'year' || /last year|year ago|year over year/.test(q);
    var r = K.range(ctx.period, ctx.from, ctx.to), pr = K.prevRange(r, yr ? 'year' : 'previous');
    return { r: r, pr: pr, label: E.periodLabel(ctx.period), cmp: yr ? 'the same period last year' : 'the period before' };
  }
  function mentioned(text, ctx) {
    var q = String(text || '').toLowerCase(), out = [];
    K.COMMS.forEach(function (c) { if (q.indexOf(c.name.toLowerCase()) > -1 || new RegExp('\\b' + c.short.toLowerCase() + '\\b').test(q)) out.push(c); });
    (ctx.accounts || []).forEach(function (n) { var c = K.byName(n); if (c && out.indexOf(c) < 0) out.push(c); });
    return out;
  }
  function acctTable(stats, R, title, sort) {
    var rows = stats.filter(function (s) { return s.cur.cost > 0; }).map(function (s) { return [s.c.name, s.cur.cost, s.cur.clicks, s.cur.conv, s.cur.cpa, s.convChg, s.cpaChg]; });
    return E.table([['account'], ['cost'], ['clicks'], ['conversions'], ['cpa'], ['conversions_change', 'Conversions change', 'change'], ['cpa_change', 'Cost / conv. change', 'change']], rows, R.label + ' · ' + E.rangeText(R.r), { accounts: 'all', breakdown: ['account'], metrics: ['cost', 'clicks', 'conversions', 'cpa'], period: R.period || 'last30', from: '', to: '', compare: 'previous' });
  }
  function story(name, R) { if (name === 'The Merritt') return R.r.to >= D.add(D.today, -9); if (name === 'Aster Yards') return R.r.to >= D.add(D.today, -14); return false; }
  function block(kind, obj) { return '\n\n```' + kind + '\n' + JSON.stringify(obj) + '\n```\n\n'; }
  function step(label, rows, query) { return { kind: 'tool', label: label, status: 'done', summary: rows + (rows === 1 ? ' row' : ' rows'), query: query }; }

  function weakWhy(s, R, i) {
    var cc = s.prev.cost ? (s.cur.cost - s.prev.cost) / s.prev.cost * 100 : 0, vc = s.convChg || 0;
    if (cc > 3 && vc < -3) return 'Spend rose ' + Math.round(cc) + '% while conversions fell ' + Math.round(-vc) + '%, so each lead got pricier. Search terms are the first place to look.';
    if (vc < -3) return [
      'Spend held close to ' + R.cmp + ' but conversions slipped ' + Math.round(-vc) + '%. Worth checking the landing page and ad strength.',
      'Budget stayed about the same, yet conversions dropped ' + Math.round(-vc) + '%. Search terms and the tour form are worth a check.',
      'Similar spend bought ' + Math.round(-vc) + '% fewer conversions. Ad strength and the landing page are the likely places to look.'][i % 3];
    if (cc > vc + 3) return 'Conversions ' + (vc > 1 ? 'grew ' + Math.round(vc) + '%' : 'held') + ', but spend grew ' + Math.round(cc) + '%. Bids or broader matching may be buying costlier clicks.';
    return 'Cost per conversion moved up against ' + R.cmp + '. Worth a look at search terms and ad strength.';
  }
  function aPortfolio(q, ctx) {
    var R = ctxRange(ctx, q), st = E.acctStats(R.r, R.pr), live = st.filter(function (s) { return s.cur.cost > 0; });
    var T0 = live.reduce(function (a, s) { a.cost += s.cur.cost; a.conv += s.cur.conv; a.pcost += s.prev.cost; a.pconv += s.prev.conv; return a; }, { cost: 0, conv: 0, pcost: 0, pconv: 0 });
    var cpa = T0.cost / T0.conv, pcpa = T0.pcost / T0.pconv, convChg = (T0.conv - T0.pconv) / T0.pconv * 100;
    var best = live.filter(function (s) { return s.cur.conv >= 40; }).sort(function (a, b) { return a.cur.cpa - b.cur.cpa; }).slice(0, 3);
    var worst = live.filter(function (s) { return s.cur.conv >= 5; }).sort(function (a, b) { return (b.cpaChg || 0) - (a.cpaChg || 0); }).slice(0, 3);
    var txt = '**Across ' + live.length + ' active accounts, ' + ph2(R.label) + ' brought ' + int(T0.conv) + ' conversions at ' + money(cpa) + ' each, conversions ' + pc(convChg) + ' on ' + R.cmp + '.** Spend was ' + money(T0.cost) + ', and cost per conversion moved from ' + money(pcpa) + ' to ' + money(cpa) + '.\n\n### Strongest\n';
    txt += best.map(function (s, i) { return '- **' + s.c.name + '**: ' + int(s.cur.conv) + ' conversions at ' + money(s.cur.cpa) + (s.convChg !== null ? ', conversions ' + pc(s.convChg) : '') + '. ' + (s.c.name === 'Lakeview Terrace' ? 'The lake view headlines are still lifting click-through rate.' : ['Brand search carries it at the lowest cost per lead.', 'People who search for it by name convert cheaply, which keeps cost per lead low.', 'Steady brand demand and a strong tour page keep its cost per lead down.'][i % 3]); }).join('\n');
    txt += '\n\n### Weakest\n' + worst.map(function (s, i) {
      var why = s.c.name === 'The Merritt' && story('The Merritt', R) ? 'Clicks held steady while conversions fell, and the drop starts the day the conversion goals were edited. That points to tracking, not demand.' : (s.c.name === 'Aster Yards' && story('Aster Yards', R) ? 'Cost per conversion climbed after generic keywords moved to broad match two weeks ago.' : weakWhy(s, R, i));
      return '- **' + s.c.name + '**: ' + int(s.cur.conv) + ' conversions at ' + money(s.cur.cpa) + (s.cpaChg !== null ? ', cost per conversion ' + pc(s.cpaChg) : '') + '. ' + why;
    }).join('\n');
    txt += block('table', { source: 'q1', columns: ['account', 'cost', 'conversions', 'cpa', 'conversions_change', 'cpa_change'], sort: '-conversions', limit: 16, title: 'Every account, ' + ph2(R.label) });
    txt += block('chart', { source: 'q1', x: 'account', y: ['conversions'], type: 'bar', title: 'Conversions by account', limit: 16 });
    var fixes = [];
    if (story('The Merritt', R) && worst.some(function (s) { return s.c.name === 'The Merritt'; })) fixes.push({ title: 'Check the lead form conversion at The Merritt', why: 'Conversions nearly stopped while clicks held steady.', account: 'The Merritt', area: 'conversions', priority: 'high' });
    if (story('Aster Yards', R) && worst.some(function (s) { return s.c.name === 'Aster Yards'; })) fixes.push({ title: 'Add negatives for the new broad match searches at Aster Yards', why: 'Cost per conversion rose after the match type change.', account: 'Aster Yards', area: 'searchterms', priority: 'high' });
    if (fixes.length < 2) fixes.push({ title: 'Review search terms and ads at ' + worst[0].c.name, why: 'Cost per conversion moved the most against ' + R.cmp + '.', account: worst[0].c.name, area: 'searchterms', priority: 'medium' });
    fixes.push({ title: 'Move budget toward ' + best[0].c.name, why: 'It converts at ' + money(best[0].cur.cpa) + ', the lowest cost in the portfolio.', account: best[0].c.name, area: 'campaigns', priority: 'medium' });
    txt += block('fixes', { items: fixes });
    txt += '```next\n' + JSON.stringify(['Why did cost per conversion change at ' + worst[0].c.name + '?', 'Which accounts spent the most on search terms that never converted?', 'Show me the daily trend for ' + best[0].c.name]) + '\n```';
    R.period = ctx.period;
    return { text: txt, results: { q1: acctTable(st, R) }, steps: [step('Pulled spend, clicks and conversions for every account', live.length, E.gaql.acct(R.r)), step('Pulled the same numbers for ' + R.cmp, live.length, E.gaql.acct(R.pr)), { kind: 'note', text: 'Ranked accounts by cost per conversion and by how much it moved.' }] };
  }

  function aWaste(q, ctx) {
    var R = ctxRange(ctx, q), accts = mentioned(q, ctx); if (!accts.length) accts = K.COMMS.filter(function (c) { return !c.stop; });
    var per = [], all = [], prot = [];
    accts.forEach(function (c) {
      var tr = K.termRows(c.i, R.r.from, R.r.to), tot = K.sumDays(c.i, R.r.from, R.r.to).cost;
      var w = tr.filter(function (x) { return x.conv < 0.5 && x.cost > 0; });
      w.forEach(function (x) { if (x.sensitive) prot.push({ term: x.term, account: c.name, cost: x.cost }); else all.push([x.term, c.name, x.clicks, x.cost, x.conv]); });
      var wc = w.filter(function (x) { return !x.sensitive; }).reduce(function (s, x) { return s + x.cost; }, 0);
      if (wc) per.push([c.name, wc, w.length, tot ? wc / tot : 0]);
    });
    per.sort(function (a, b) { return b[1] - a[1]; }); all.sort(function (a, b) { return b[3] - a[3]; });
    var total = per.reduce(function (s, x) { return s + x[1]; }, 0);
    var txt = '**' + money(total) + ' went to search terms that never converted in ' + ph2(R.label) + '.** The biggest share sits in ' + per.slice(0, 3).map(function (x) { return '**' + x[0] + '** (' + money(x[1]) + ')'; }).join(', ') + '.\n\nMost of it is people who are not renters: job seekers, people buying a house and short term stays. Those are the cleanest negatives in the account.';
    txt += block('table', { source: 'q1', columns: ['account', 'wasted', 'searches', 'share'], sort: '-wasted', limit: 10, title: 'Spend with no conversions, by account' });
    txt += block('table', { source: 'q2', columns: ['search_term', 'account', 'clicks', 'cost'], sort: '-cost', limit: 12, title: 'The searches behind it' });
    if (prot.length) txt += '### Leave these running\n' + prot.length + ' searches mention a protected class, such as "' + prot[0].term + '". They spent ' + money(prot.reduce(function (s, x) { return s + x.cost; }, 0)) + ' without converting, but excluding them could look like steering under Fair Housing rules, so they are not suggested as negatives.';
    txt += block('fixes', { items: per.slice(0, 3).map(function (x, i) { return { title: 'Add negatives at ' + x[0], why: money(x[1]) + ' spent on ' + x[2] + ' searches with no conversions.', account: x[0], area: 'searchterms', priority: i ? 'medium' : 'high' }; }) });
    txt += '```next\n' + JSON.stringify(['Build the negative keyword list for ' + per[0][0], 'Which searches convert best across all accounts?', 'What should we fix first across all accounts?']) + '\n```';
    return { text: txt, results: {
      q1: E.table([['account'], ['wasted', 'Spend, no conversions', 'money'], ['searches', 'Searches', 'int'], ['share', 'Share of spend', 'share']], per, 'Search terms · ' + E.rangeText(R.r)),
      q2: E.table([['search_term'], ['account'], ['clicks'], ['cost'], ['conversions']], all.slice(0, 60), 'Search terms · ' + E.rangeText(R.r), { accounts: 'all', breakdown: ['search_term'], metrics: ['clicks', 'cost', 'conversions'], period: ctx.period || 'last30', from: '', to: '', compare: '' })
    }, steps: [step('Read every search term with spend', all.length + prot.length + accts.length * 12, E.gaql.terms(R.r)), { kind: 'note', text: 'Kept terms that mention a protected class out of the negative list.' }] };
  }

  function aWhy(q, ctx) {
    var R = ctxRange(ctx, q), accts = mentioned(q, ctx), all = !accts.length; if (all) accts = K.COMMS.filter(function (c) { return !c.stop; });
    function tot(rg) { var t = { cost: 0, conv: 0, clicks: 0 }; accts.forEach(function (c) { var x = K.sumDays(c.i, rg.from, rg.to); t.cost += x.cost; t.conv += x.conv; t.clicks += x.clicks; }); return t; }
    var A = tot(R.r), B = tot(R.pr), ca = A.cost / A.conv, cb = B.cost / B.conv, chg = (ca - cb) / cb * 100;
    var e1 = A.cost / B.conv - cb, e2 = ca - A.cost / B.conv;
    var rows = accts.map(function (c) { var a = K.sumDays(c.i, R.r.from, R.r.to), b = K.sumDays(c.i, R.pr.from, R.pr.to); var excess = a.cost - a.conv * cb; return [c.name, b.conv ? b.cost / b.conv : null, a.conv ? a.cost / a.conv : null, b.conv && a.conv ? ((a.cost / a.conv) - (b.cost / b.conv)) / (b.cost / b.conv) * 100 : null, a.cost, a.conv, excess]; }).sort(function (x, y) { return Math.abs(y[3] || 0) * y[4] - Math.abs(x[3] || 0) * x[4]; });
    var up = rows.filter(function (x) { return x[3] > 5; }).slice(0, 3), down = rows.filter(function (x) { return x[3] < -5; }).slice(0, 3);
    var txt = '**Cost per conversion ' + (chg >= 0 ? 'rose ' : 'fell ') + Math.round(Math.abs(chg)) + '%, from ' + money(cb) + ' to ' + money(ca) + '** (' + R.label.toLowerCase() + ' against ' + R.cmp + (all ? ', all accounts' : ', ' + accts.map(function (c) { return c.name; }).join(', ')) + ').\n\n';
    txt += 'Spend moved ' + pc((A.cost - B.cost) / B.cost * 100) + ' and conversions moved ' + pc((A.conv - B.conv) / B.conv * 100) + '. On its own, the change in spend would have moved cost per conversion by ' + (e1 >= 0 ? '+' : '-') + money(Math.abs(e1)) + ', and the change in conversions by ' + (e2 >= 0 ? '+' : '-') + money(Math.abs(e2)) + '.\n\n';
    if (up.length) txt += '### What pushed it up\n' + up.map(function (x) { var n = x[0]; return '- **' + n + '**: ' + cpaTxt(x[1]) + ' to ' + cpaTxt(x[2]) + '. ' + (n === 'The Merritt' && story(n, R) ? 'Conversions nearly stopped 9 days ago while clicks held, right after the lead form was set to a secondary conversion. This is tracking, not demand.' : (n === 'Aster Yards' && story(n, R) ? 'Generic keywords moved to broad match 14 days ago. Spend rose faster than conversions as the ads matched wider searches.' : 'Spend grew faster than conversions. Search terms and ad strength are the first places to look.')); }).join('\n') + '\n\n';
    if (down.length) txt += '### What pulled it down\n' + down.map(function (x) { return '- **' + x[0] + '**: ' + cpaTxt(x[1]) + ' to ' + cpaTxt(x[2]) + '.' + (x[0] === 'Lakeview Terrace' ? ' The lake view headlines keep converting above average.' : ''); }).join('\n') + '\n\n';
    txt += block('table', { source: 'q1', columns: ['account', 'cpa_before', 'cpa', 'cpa_change', 'cost', 'conversions'], sort: '-cpa_change', limit: 16, title: 'Cost per conversion by account' });
    var days = []; for (var n = D.num(R.r.from), e = D.num(R.r.to); n <= e; n++) { var iso = D.fromNum(n), t = { cost: 0, conv: 0 }; accts.forEach(function (c) { var x = K.day(c.i, iso); t.cost += x.cost; t.conv += x.conv; }); days.push([iso, t.cost, t.conv, t.conv ? t.cost / t.conv : null]); }
    txt += block('chart', { source: 'q2', x: 'date', y: ['cpa', 'conversions'], type: 'line', title: 'Cost per conversion and conversions by day' });
    var fixes = [];
    if (story('The Merritt', R) && up.some(function (x) { return x[0] === 'The Merritt'; })) fixes.push({ title: 'Set the lead form back to a primary conversion at The Merritt', why: 'Smart Bidding stopped counting real leads after the goal edit.', account: 'The Merritt', area: 'conversions', priority: 'high' });
    if (story('Aster Yards', R) && up.some(function (x) { return x[0] === 'Aster Yards'; })) fixes.push({ title: 'Review broad match search terms at Aster Yards', why: 'Add negatives for searches that spent with no conversions.', account: 'Aster Yards', area: 'searchterms', priority: 'high' });
    if (fixes.length < 2) fixes.push({ title: 'Open Why Did It Change for a full breakdown', why: 'It splits the change by campaign, ad group, keyword, search term and device.', priority: 'medium' });
    txt += block('fixes', { items: fixes });
    txt += '```next\n' + JSON.stringify(['Show me the search terms behind the change', 'What changed in the account history this month?', 'Which accounts should get more budget?']) + '\n```';
    return { text: txt, results: {
      q1: E.table([['account'], ['cpa_before', 'Cost / conv. before', 'money'], ['cpa', 'Cost / conv. now', 'money'], ['cpa_change', 'Change', 'change'], ['cost'], ['conversions']], rows.map(function (x) { return [x[0], x[1], x[2], x[3], x[4], x[5]]; }), R.label + ' · ' + E.rangeText(R.r)),
      q2: E.table([['date'], ['cost'], ['conversions'], ['cpa']], days, 'Daily · ' + E.rangeText(R.r))
    }, steps: [step('Pulled cost and conversions by account for both periods', accts.length * 2, E.gaql.acct(R.r)), step('Pulled the daily trend', days.length, E.gaql.daily(R.r)), step('Read the change history', 12 + accts.length, E.gaql.hist(R.pr))] };
  }

  function aPriorities(q, ctx) {
    var au = T.audit(), f = au.audit.findings.filter(function (x) { return x.severity === 'critical' || x.severity === 'high'; });
    var accts = mentioned(q, ctx); if (accts.length) f = au.audit.findings.filter(function (x) { return accts.some(function (c) { return c.id === x.accountId; }); });
    var top = f.slice(0, 5);
    var txt = '**Start with these ' + top.length + '. They are ordered by risk first, then by money at stake.**\n\n' + top.map(function (x, i) { return (i + 1) + '. **' + x.account + ': ' + x.title + '.** ' + x.detail + ' *Fix:* ' + x.fix; }).join('\n');
    txt += block('table', { source: 'q1', columns: ['severity', 'account', 'category', 'finding', 'at_stake'], limit: 12, title: 'Critical and high findings' });
    txt += block('fixes', { items: top.slice(0, 4).map(function (x) { return { title: x.title, why: x.account + ': ' + x.fix, account: x.account, area: /Tracking/.test(x.category) ? 'conversions' : (/Wasted|Keywords/.test(x.category) ? 'searchterms' : (/Ads|Fair/.test(x.category) ? 'ads' : 'campaigns')), priority: x.severity === 'critical' ? 'high' : 'medium' }; }) });
    txt += '```next\n' + JSON.stringify(['Help me fix the tracking issue at The Merritt', 'Write a compliant headline to replace the one at The Hartley', 'How much spend is at stake across all findings?']) + '\n```';
    return { text: txt, results: { q1: E.table([['severity'], ['account'], ['category'], ['finding'], ['at_stake', 'At stake', 'money']], f.slice(0, 40).map(function (x) { return [x.severity, x.account, x.category, x.title, x.impact || null]; }), 'Audit · ' + au.audit.atText) }, steps: [step('Read the latest audit', au.audit.findings.length, 'audit.latest()'), { kind: 'note', text: 'Ordered by severity, then by spend at stake.' }] };
  }

  function aAccount(q, ctx, c) {
    var R = ctxRange(ctx, q), a = K.derive(K.sumDays(c.i, R.r.from, R.r.to)), b = K.derive(K.sumDays(c.i, R.pr.from, R.pr.to));
    var camps = K.camps(c.i).map(function (k) { var x = K.campSum(c.i, k, R.r.from, R.r.to), y = K.campSum(c.i, k, R.pr.from, R.pr.to); return [k.name, k.typeLabel, x.cost, x.conv, x.conv >= 0.5 ? x.cost / x.conv : null, y.conv ? (x.conv - y.conv) / y.conv * 100 : null]; }).filter(function (x) { return x[2] > 1; });
    var days = K.series(c.i, R.r.from, R.r.to).map(function (x) { return [x.d, x.clicks, x.conv, x.cost]; });
    if (!a.cost) return { text: '**' + c.name + ' has not spent anything in ' + ph2(R.label) + '.** Every campaign is paused. The context log says the community is fully leased, so that looks intentional.\n\n```next\n' + JSON.stringify(['When was ' + c.name + ' last running?', 'Give me a portfolio summary for last month']) + '\n```', results: {}, steps: [step('Pulled ' + c.name + ' for the period', 0, E.gaql.acct(R.r))] };
    var bestC = camps.slice().filter(function (x) { return x[4]; }).sort(function (x, y) { return x[4] - y[4]; })[0];
    var txt = '**' + c.name + ': ' + int(a.conv) + ' conversions at ' + money(a.cpa) + ' in ' + ph2(R.label) + ', conversions ' + pc((a.conv - b.conv) / b.conv * 100) + ' and cost per conversion ' + pc((a.cpa - b.cpa) / b.cpa * 100) + ' on ' + R.cmp + '.** Spend was ' + money(a.cost) + ' for ' + int(a.clicks) + ' clicks.\n\n';
    if (c.name === 'The Merritt' && story(c.name, R)) txt += '### What happened\nClicks are steady day by day, but conversions fall to almost zero from 9 days ago. That was the day the conversion goals were edited and the lead form became a secondary conversion. Calls from ads are still recorded, which is why the count is not exactly zero.\n\n';
    else if (c.name === 'Aster Yards' && story(c.name, R)) txt += '### What happened\nTwo weeks ago the generic keywords moved to broad match with Maximize conversions. Clicks rose about 22% and spend about 28%, but conversions did not follow, so each one costs more.\n\n';
    else txt += '### What is working\n**' + bestC[0] + '** converts at ' + money(bestC[4]) + ', the lowest cost in the account. ' + (c.amen ? 'Searches that mention ' + c.amen[0] + ' and ' + c.amen[1] + ' convert above average.' : '') + '\n\n';
    txt += block('chart', { source: 'q2', x: 'date', y: ['clicks', 'conversions'], type: 'line', title: c.name + ', clicks and conversions by day' });
    txt += block('table', { source: 'q1', columns: ['campaign', 'campaign_type', 'cost', 'conversions', 'cpa', 'conversions_change'], sort: '-cost', limit: 8, title: 'Campaigns' });
    var fixes = c.name === 'The Merritt' && story(c.name, R) ? [{ title: 'Set the lead form back to primary', why: 'Goals, then the lead form action, then Primary.', account: c.name, area: 'conversions', priority: 'high' }, { title: 'Submit a test lead', why: 'Confirm Google Ads records it within a few hours.', account: c.name, area: 'conversions', priority: 'high' }] : (c.name === 'Aster Yards' && story(c.name, R) ? [{ title: 'Add negatives from the last 14 days of search terms', why: 'Broad match is paying for non-renter searches.', account: c.name, area: 'searchterms', priority: 'high' }, { title: 'Move the best keywords back to phrase match', why: 'Keep the reach where it converts.', account: c.name, area: 'keywords', priority: 'medium' }] : [{ title: 'Fund ' + bestC[0] + ' first', why: 'It produces the cheapest conversions in the account.', account: c.name, area: 'campaigns', priority: 'medium' }]);
    txt += block('fixes', { items: fixes });
    txt += '```next\n' + JSON.stringify(['What are people searching for at ' + c.name + '?', 'Write a fresh search ad for ' + c.name, 'Compare ' + c.name + ' with the same period last year']) + '\n```';
    return { text: txt, results: {
      q1: E.table([['campaign'], ['campaign_type'], ['cost'], ['conversions'], ['cpa'], ['conversions_change', 'Conversions change', 'change']], camps, c.name + ' · ' + E.rangeText(R.r), { accounts: [c.name], breakdown: ['campaign'], metrics: ['cost', 'conversions', 'cpa'], period: ctx.period || 'last30', from: '', to: '', compare: 'previous' }),
      q2: E.table([['date'], ['clicks'], ['conversions'], ['cost']], days, c.name + ' · daily', { accounts: [c.name], breakdown: ['date'], metrics: ['clicks', 'conversions', 'cost'], period: ctx.period || 'last30', from: '', to: '', compare: '' })
    }, steps: [step('Pulled ' + c.name + ' by campaign for both periods', camps.length * 2, E.gaql.camp(R.r)), step('Pulled the daily trend', days.length, E.gaql.daily(R.r)), step('Read the conversion actions', 4, E.gaql.conv(R.r))] };
  }

  function aPacing() {
    var p = T.pacing({ month: D.today.slice(0, 7) }), over = p.rows.filter(function (x) { return x.status === 'Over pace'; }), under = p.rows.filter(function (x) { return x.status === 'Under pace'; });
    var txt = '**' + p.monthLabel + ' is ' + p.totals.pacePct + '% paced overall: ' + money(p.totals.spent) + ' spent of ' + money(p.totals.budget) + ', with ' + p.left + ' days left.**\n\n' + (over.length ? '### On track to overspend\n' + over.map(function (x) { return '- **' + x.property + '**: projected ' + money(x.projected) + ' against ' + money(x.budget) + ' (' + x.pacePct + '%). To land on budget, spend about ' + money(x.dailyNeeded) + ' a day.'; }).join('\n') + '\n\n' : '') + (under.length ? '### Room to spend more\n' + under.slice(0, 4).map(function (x) { return '- **' + x.property + '**: projected ' + x.pacePct + '% of budget.'; }).join('\n') : '');
    txt += block('table', { source: 'q1', columns: ['account', 'budget', 'spent', 'projected', 'pace'], sort: '-pace', limit: 16, title: 'Budget pacing, ' + p.monthLabel });
    txt += '```next\n' + JSON.stringify(['Where should the extra budget go?', 'Which accounts are limited by budget?']) + '\n```';
    return { text: txt, results: { q1: E.table([['account'], ['budget', 'Budget', 'money'], ['spent', 'Spent', 'money'], ['projected', 'Projected', 'money'], ['pace', 'Pace', 'pct']], p.rows.map(function (x) { return [x.property, x.budget, x.spent, x.projected, x.pacePct]; }), 'Budget sheet and Google Ads') }, steps: [step('Read the budget sheet', p.rows.length, 'sheet: Budget Overview'), step('Pulled month to date spend', p.rows.length, E.gaql.acct({ from: D.monthStart(D.today, 0), to: D.yesterday }))] };
  }

  function aDevice(q, ctx) {
    var R = ctxRange(ctx, q), accts = mentioned(q, ctx), res = E.explore({ accounts: accts.length ? accts.map(function (c) { return c.name; }) : 'all', breakdown: ['device'], metrics: ['clicks', 'cost', 'conversions', 'cpa', 'conv_rate'], period: ctx.period || 'last30', compare: 'previous' });
    var mob = res.rows[0];
    var txt = '**Phones bring ' + Math.round(mob[1] / res.totals.clicks * 100) + '% of clicks and ' + Math.round(mob[5] / res.totals.conversions * 100) + '% of conversions.** Computers convert a little better per click, so the landing page on phones is where small gains add up.';
    txt += block('table', { source: 'q1', columns: ['device', 'clicks', 'cost', 'conversions', 'cpa', 'conv_rate'], limit: 5, title: 'By device' });
    txt += '```next\n' + JSON.stringify(['Which landing pages are slow on phones?', 'Give me a portfolio summary for last month']) + '\n```';
    return { text: txt, results: { q1: E.toResult(res) }, steps: [step('Pulled clicks and conversions by device', res.rows.length, 'SELECT segments.device, metrics.clicks, metrics.conversions FROM customer')] };
  }

  function aAlert(q) {
    var al = T.alerts(30), x = al.items.filter(function (i) { return q.indexOf(i.title) > -1 && q.indexOf(i.account) > -1; })[0];
    if (!x) return null;
    var txt = '**' + x.account + ': ' + x.title + '.**\n\n' + x.detail + '\n\n### Why it matters\n' + x.why + '\n\n### Step by step\n' + x.steps.map(function (s, i) { return (i + 1) + '. ' + s; }).join('\n');
    var res = {};
    if (x.items && x.items.length) { txt += block('table', { source: 'q1', columns: x.cols.map(function (c, i) { return 'c' + i; }), limit: 12, title: 'The items behind this alert' }); res.q1 = E.table(x.cols.map(function (c, i) { return ['c' + i, c, 'text']; }), x.items, x.account); }
    txt += block('fixes', { items: [{ title: x.steps[0], why: x.why, account: x.account, area: /Tracking/.test(x.category) ? 'conversions' : 'campaigns', priority: x.severity === 'critical' || x.severity === 'high' ? 'high' : 'medium' }] });
    txt += '```next\n' + JSON.stringify(['What else needs attention at ' + x.account + '?', 'Show me ' + x.account + ' day by day']) + '\n```';
    return { text: txt, results: res, steps: [step('Read the alert and its items', (x.items || []).length + 1, 'alerts.get(\'' + x.id + '\')'), step('Pulled ' + x.account + ' for the last 30 days', 30, E.gaql.daily(K.range('last30')))] };
  }
  function aFinding(q) {
    var au = T.audit(), x = au.audit.findings.filter(function (i) { return q.indexOf(i.title) > -1 && q.indexOf(i.account) > -1; })[0];
    if (!x) return null;
    var txt = '**' + x.account + ': ' + x.title + '.**\n\n' + x.detail + '\n\n### The exact change\n' + x.fix + (x.items && x.items.length ? '\n\nThe specific items are below.' : '');
    var res = {};
    if (x.items && x.items.length) { txt += block('table', { source: 'q1', columns: x.itemColumns.map(function (c, i) { return 'c' + i; }), limit: 12, title: 'Items' }); res.q1 = E.table(x.itemColumns.map(function (c, i) { return ['c' + i, c, 'text']; }), x.items, x.account); }
    txt += block('fixes', { items: [{ title: x.fix, why: x.detail, account: x.account, area: 'campaigns', priority: x.severity === 'critical' ? 'high' : 'medium' }] });
    txt += '```next\n' + JSON.stringify(['What should we fix first across all accounts?', 'Show me ' + x.account + ' by campaign']) + '\n```';
    return { text: txt, results: res, steps: [step('Read the audit finding', (x.items || []).length + 1, 'audit.finding(\'' + x.key + '\')')] };
  }
  function aCopy(q, ctx) {
    var c = mentioned(q, ctx)[0] || K.byName('The Hartley'), r = T.adCopy({ account: c.name, type: 'search', mode: 'scratch', count: 1 }), ad = r.ads[0];
    var txt = '**Here is a fresh set for ' + c.name + ', every line within Google’s limits and checked for Fair Housing.** None of them describe who should live here: they describe the home and the area.\n\n### Headlines\n' + ad.parts.h.slice(0, 10).map(function (l) { return '- ' + l.text + ' (' + l.len + ')'; }).join('\n') + '\n\n### Descriptions\n' + ad.parts.d.map(function (l) { return '- ' + l.text + ' (' + l.len + ')'; }).join('\n') + '\n\nFor all 15 headlines, pinning, previews and a Google Ads Editor file, open **Ad Copy Creator** under Explore.';
    txt += '\n\n```next\n' + JSON.stringify(['Write 3 more headlines about ' + c.amen[0], 'Which headlines are performing best at ' + c.name + '?']) + '\n```';
    return { text: txt, results: {}, steps: [step('Read live ads and asset ratings for ' + c.name, 24, 'SELECT ad_group_ad_asset_view.performance_label FROM ad_group_ad_asset_view'), step('Read converting searches', 10, E.gaql.terms(K.range('last90'))), { kind: 'note', text: 'Checked every line for length, policy and Fair Housing.' }] };
  }

  function aSearches(q, ctx) {
    var R = ctxRange(ctx, q), accts = mentioned(q, ctx); if (!accts.length) accts = K.COMMS.filter(function (c) { return !c.stop; });
    var rows = []; accts.forEach(function (c) { K.termRows(c.i, R.r.from, R.r.to).forEach(function (x) { rows.push([x.term, c.name, x.theme, x.clicks, x.cost, x.conv, x.conv >= 0.5 ? x.cost / x.conv : null]); }); });
    var conv = rows.filter(function (x) { return x[5] >= 0.5; }).sort(function (a, b) { return b[5] - a[5]; }), th = {};
    rows.forEach(function (x) { var t = th[x[2]] || (th[x[2]] = { clicks: 0, conv: 0, cost: 0 }); t.clicks += x[3]; t.conv += x[5]; t.cost += x[4]; });
    var themes = Object.keys(th).map(function (k) { return [k, th[k].clicks, th[k].cost, th[k].conv, th[k].conv >= 0.5 ? th[k].cost / th[k].conv : null]; }).sort(function (a, b) { return b[3] - a[3]; });
    var who = accts.length === 1 ? accts[0].name : 'these ' + accts.length + ' accounts';
    var txt = '**At ' + who + ', the searches that convert best are ' + conv.slice(0, 3).map(function (x) { return '"' + x[0] + '"'; }).join(', ') + '.** ' + (themes[0] ? 'By theme, ' + themes[0][0].toLowerCase() + ' searches bring the most conversions, followed by ' + (themes[1] ? themes[1][0].toLowerCase() : 'location') + '.' : '');
    var bed = themes.filter(function (t) { return /bedroom|Studio/.test(t[0]); });
    if (bed.length) txt += ' Bedroom searches (' + bed.map(function (t) { return t[0].toLowerCase(); }).join(', ') + ') produced ' + int(bed.reduce(function (s, t) { return s + t[3]; }, 0)) + ' conversions.';
    txt += block('table', { source: 'q1', columns: ['theme', 'clicks', 'cost', 'conversions', 'cpa'], sort: '-conversions', limit: 12, title: 'Searches by theme' });
    txt += block('table', { source: 'q2', columns: ['search_term', 'account', 'clicks', 'conversions', 'cpa'], sort: '-conversions', limit: 10, title: 'Top converting searches' });
    txt += '```next\n' + JSON.stringify(['Which of these searches are not keywords yet?', 'Which searches spent money with no conversions?', 'Write a search ad built on these searches']) + '\n```';
    return { text: txt, results: {
      q1: E.table([['theme', 'Theme', 'text'], ['clicks'], ['cost'], ['conversions'], ['cpa']], themes, 'Search terms \u00b7 ' + E.rangeText(R.r)),
      q2: E.table([['search_term'], ['account'], ['clicks'], ['conversions'], ['cpa']], conv.slice(0, 40).map(function (x) { return [x[0], x[1], x[3], x[5], x[6]]; }), 'Search terms \u00b7 ' + E.rangeText(R.r), { accounts: accts.length === 1 ? [accts[0].name] : 'all', breakdown: ['search_term'], metrics: ['clicks', 'conversions', 'cpa'], period: ctx.period || 'last30', from: '', to: '', compare: '' })
    }, steps: [step('Read every search term with spend', rows.length, E.gaql.terms(R.r)), { kind: 'note', text: 'Grouped searches into themes like bedrooms, pets, price and location.' }] };
  }

  function answer(q, ctx) {
    var t = String(q || '').toLowerCase(), accts = mentioned(q, ctx), out = null;
    if (/^help me with this alert/.test(t)) out = aAlert(q);
    else if (/^help me fix this audit finding/.test(t)) out = aFinding(q);
    if (out) return out;
    if (/fix first|priorit|audit|to do first|what should we fix/.test(t)) return aPriorities(q, ctx);
    if (/never convert|wasted?|no conversions|spent .* with no|negative/.test(t)) return aWaste(q, ctx);
    if (/searching for|search terms|searches|keywords? (are|is)/.test(t)) return aSearches(q, ctx);
    if (/budget|pacing|overspend|underspend/.test(t)) return aPacing();
    if (/device|mobile|phone|desktop/.test(t)) return aDevice(q, ctx);
    if (/headline|ad copy|write .*ad\b|write a|compliant/.test(t)) return aCopy(q, ctx);
    if (/summary|portfolio|strongest|weakest|overview|^look at/.test(t)) return aPortfolio(q, ctx);
    if (/why|chang|went up|went down|drop|jump|rose|fell|dig into/.test(t) && (accts.length !== 1 || /cost per conv|cpa|cost per lead/.test(t))) return aWhy(q, ctx);
    if (accts.length === 1) return aAccount(q, ctx, accts[0]);
    var p = aPortfolio(q, ctx);
    if (!/how are|performance|doing/.test(t)) p.text = '*This demo answers from prepared analysis of the sample data, so I read this as a question about overall performance. The real tool has Claude plan its own queries for any question.*\n\n' + p.text;
    return p;
  }

  /* ---------------- chats ---------------- */
  var CHATS = {}, ORDER = [];
  function newChatObj(title, project) { var c = { id: id('c'), title: title.slice(0, 70), display: [], results: {}, project: project || null, pinned: 0, updated: Date.now() }; CHATS[c.id] = c; ORDER.unshift(c.id); return c; }
  function finish(c, q, ctx) {
    var a = answer(q, ctx), keys = Object.keys(a.results), base = Object.keys(c.results).length, ren = {};
    keys.forEach(function (k, i) { var nk = 'r' + (base + i + 1); ren[k] = nk; c.results[nk] = a.results[k]; });
    var txt = a.text.replace(/"source":"(q\d+)"/g, function (m, k) { return '"source":"' + (ren[k] || k) + '"'; });
    return { role: 'assistant', steps: a.steps, text: txt, status: 'done' };
  }
  function seed(title, q, ctx, hoursAgo, project) {
    var c = newChatObj(title, project); c.display.push({ role: 'user', text: q, ctx: ctx, files: [] }); c.display.push(finish(c, q, ctx)); c.updated = Date.now() - hoursAgo * 3600000; return c;
  }
  var PROJ = {};
  function projObj(o) { PROJ[o.id] = o; return o; }
  var p1 = projObj({ id: 'p1', name: 'Harbor Commons lease-up, Q4', description: 'Fill the remaining 2 bedrooms before the holidays with fresher search ads and a tighter budget.', role: 'owner', ownerName: 'You', shared: true, share: { org: 'use', people: [] }, updated: Date.now() - 5 * 3600000, instructions: 'Write for Harbor Commons in a warm, modern voice. Always mention the rooftop terrace and the riverfront trail. Focus on 2 bedroom availability. Compare results with the same period last year.', accounts: ['Harbor Commons'], period: 'last30',
    items: [{ id: 'k1', kind: 'text', name: 'November specials', chars: 412, by: E.ME, at: Date.now() - 3 * 86400000, text: 'November specials\n\n2 bedroom homes: one month free on a 13 month lease, for applications by the end of the month.\nHeated parking included for the first 3 months.\nSelf-guided tours every day from 9 AM to 6 PM.' }, { id: 'k2', kind: 'text', name: 'Brand voice', chars: 980, by: 'morgan@vertex.example', at: Date.now() - 12 * 86400000, text: 'Brand voice\n\nWarm, polished and specific. Lead with the view and the river. Short sentences. No exclamation marks in headlines. Describe the home and the area, never who should live there.' }] });
  var p2 = projObj({ id: 'p2', name: 'Monthly client recaps', description: 'Recap emails for each community, written the same way every month.', role: 'owner', ownerName: 'You', shared: false, share: { org: '', people: [] }, updated: Date.now() - 2 * 86400000, instructions: 'Keep recaps under 200 words. Lead with conversions and cost per conversion. Only share good news that is true.', accounts: [], period: 'lastMonth', items: [{ id: 'k3', kind: 'text', name: 'Recap template', chars: 640, by: E.ME, at: Date.now() - 20 * 86400000, text: 'Recap template\n\n1. Headline result\n2. What worked\n3. What is next\nSign off as the Vertex marketing team.' }] });
  seed('Portfolio summary for last month', 'Give me a portfolio summary for last month: the strongest accounts, the weakest, and why.', { accounts: [], period: 'lastMonth', from: '', to: '', compare: 'previous' }, 2);
  seed('Where is The Merritt losing conversions?', 'Where is The Merritt losing conversions in the last 30 days?', { accounts: ['The Merritt'], period: 'last30', from: '', to: '', compare: '' }, 26);
  var c3 = seed('Wasted spend on search terms', 'Which accounts spent the most on search terms that never converted in the last 30 days?', { accounts: [], period: 'last30', from: '', to: '', compare: '' }, 50);
  CHATS[c3.id].pinned = Date.now() - 1000;
  var pc1 = seed('2 bedroom searches at Harbor Commons', 'What are people searching for at Harbor Commons, and which searches convert?', { accounts: ['Harbor Commons'], period: 'last30', from: '', to: '', compare: '' }, 8, { id: 'p1', name: p1.name });

  function chatList() { return ORDER.map(function (k) { var c = CHATS[k]; return { id: c.id, title: c.title, updated: c.updated, pinned: c.pinned, project: c.project ? c.project.id : '', projectName: c.project ? c.project.name : '' }; }); }
  var PEND = {};

  /* ---------------- server functions ---------------- */
  var VIEWS = [{ id: 'v1', name: 'Accounts vs last year', spec: { accounts: 'all', breakdown: ['account'], metrics: ['clicks', 'conversions', 'cpa'], period: 'lastMonth', from: '', to: '', compare: 'year', filters: {} } }];
  var DISMISSED = {}, ALSTATUS = {}, PREFS = { period: 'last30', compare: '', length: 'balanced', instructions: '' }, AUDIT_AT = null;
  var api = {
    apiBoot: function () { return { ok: true, me: E.ME, first: '', name: '', admin: false, owner: false, ready: { ads: true, ai: true }, periods: E.PERIODS.map(function (p) { return { key: p[0], label: p[1] }; }), accounts: K.COMMS.map(function (c) { return { id: c.id, name: c.name }; }), today: D.today, prefs: PREFS }; },
    apiAccounts: function () { return { ok: true, accounts: K.COMMS.map(function (c) { return { id: c.id, name: c.name }; }) }; },
    apiChats: function () { return { ok: true, chats: chatList() }; },
    apiChatLoad: function (cid) { var c = CHATS[cid]; return c ? { ok: true, chat: c } : { ok: false, error: 'That conversation is gone.' }; },
    apiChatSend: function (cid, text, ctx, projectId) {
      var c = CHATS[cid]; if (!c) { var pr = projectId && PROJ[projectId] ? { id: projectId, name: PROJ[projectId].name } : null; c = newChatObj(text, pr); }
      c.display.push({ role: 'user', text: text, ctx: ctx, files: [] }); c.updated = Date.now();
      var a = finish(c, text, ctx); PEND[c.id] = { a: a, i: 0, writing: false };
      return { id: c.id, title: c.title, project: c.project ? c.project.id : '' };
    },
    apiChatEdit: function (cid, i, text, ctx) { var c = CHATS[cid]; if (!c) return { ok: false, error: 'Not found.' }; c.display = c.display.slice(0, i); if (i === 0) c.title = text.slice(0, 70); c.display.push({ role: 'user', text: text, ctx: ctx, files: [] }); PEND[c.id] = { a: finish(c, text, ctx), i: 0, writing: false }; return { ok: true, title: c.title }; },
    apiChatStep: function (cid) {
      var p = PEND[cid], c = CHATS[cid]; if (!p || !c) return { error: 'Nothing is running.' };
      var tools = p.a.steps;
      function shown(n, running) { return tools.slice(0, n).map(function (s, k) { var o = KIT.clone(s); if (running && k === n - 1 && o.kind === 'tool') { o.status = 'running'; o.summary = ''; } return o; }); }
      if (p.i < tools.length) { p.await = true; return { status: 'tools', steps: shown(p.i + 1, true) }; }
      if (!p.writing) { p.writing = true; return { status: 'again', steps: shown(tools.length, false) }; }
      delete PEND[cid]; c.display.push(p.a); c.updated = Date.now();
      return { turn: p.a, results: c.results };
    },
    apiChatTools: function (cid) { var p = PEND[cid]; if (!p) return { error: 'Nothing is running.' }; p.i++; while (p.i < p.a.steps.length && p.a.steps[p.i].kind === 'note') p.i++; return { steps: p.a.steps.slice(0, p.i).map(KIT.clone) }; },
    apiChatFinish: function () { return { ok: true }; },
    apiChatStop: function (cid) { delete PEND[cid]; return { ok: true }; },
    apiChatDelete: function (cid) { delete CHATS[cid]; ORDER = ORDER.filter(function (k) { return k !== cid; }); return { ok: true }; },
    apiChatPin: function (cid, on) { if (CHATS[cid]) CHATS[cid].pinned = on ? Date.now() : 0; return { ok: true }; },
    apiChatRename: function (cid, t) { if (CHATS[cid]) CHATS[cid].title = t; return { ok: true, title: t }; },
    apiChatMove: function (cid, pid) { var c = CHATS[cid]; if (!c) return { ok: false }; c.project = pid && PROJ[pid] ? { id: pid, name: PROJ[pid].name } : null; return { ok: true }; },
    apiFeedback: function () { return { ok: true }; },
    apiProjects: function () { return { ok: true, projects: Object.keys(PROJ).map(function (k) { var p = PROJ[k]; return { id: p.id, name: p.name, description: p.description, shared: p.shared, updated: p.updated, role: p.role, ownerName: p.ownerName }; }) }; },
    apiProjectGet: function (pid) { var p = PROJ[pid]; if (!p) return { ok: false, error: 'Not found.' }; return { ok: true, project: projOut(p), chats: ORDER.map(function (k) { return CHATS[k]; }).filter(function (c) { return c.project && c.project.id === pid; }).map(function (c) { return { id: c.id, title: c.title, updated: c.updated, pinned: c.pinned }; }) }; },
    apiProjectSave: function (o) { var p = o.id ? PROJ[o.id] : projObj({ id: id('p'), name: '', description: '', role: 'owner', ownerName: 'You', shared: false, share: { org: '', people: [] }, instructions: '', accounts: [], period: 'last30', items: [] }); ['name', 'description', 'instructions', 'accounts', 'period'].forEach(function (k) { if (o[k] !== undefined) p[k] = o[k]; }); p.updated = Date.now(); return { ok: true, project: projOut(p) }; },
    apiProjectAdd: function (pid, item) { var p = PROJ[pid]; if (!p) return { ok: false }; if (item.kind === 'link') return { ok: false, error: 'Reading Google Docs is turned off in this demo. Paste the text instead.' }; var txt = item.text || ''; p.items.push({ id: id('k'), kind: item.kind === 'pdf' ? 'pdf' : (item.kind === 'file' ? 'file' : 'text'), name: item.name || 'Pasted text', chars: txt.length, size: item.data ? item.data.length * 0.75 : 0, by: E.ME, at: Date.now(), text: txt }); p.updated = Date.now(); return { ok: true, project: projOut(p) }; },
    apiProjectRemove: function (pid, kid) { var p = PROJ[pid]; p.items = p.items.filter(function (i) { return i.id !== kid; }); return { ok: true, project: projOut(p) }; },
    apiProjectItem: function (pid, kid) { var i = PROJ[pid].items.filter(function (x) { return x.id === kid; })[0]; return i ? { ok: true, name: i.name, kind: i.kind, text: i.text } : { ok: false }; },
    apiProjectRefresh: function (pid) { return { ok: true, project: projOut(PROJ[pid]) }; },
    apiProjectShare: function (pid, sh) { var p = PROJ[pid]; p.share = sh; p.shared = !!(sh.org || (sh.people || []).length); return { ok: true, project: projOut(p), missing: [] }; },
    apiProjectDelete: function (pid) { delete PROJ[pid]; ORDER.forEach(function (k) { var c = CHATS[k]; if (c.project && c.project.id === pid) c.project = null; }); return { ok: true }; },
    apiExplore: function (spec) { return { ok: true, result: E.explore(spec) }; },
    apiViews: function () { return { ok: true, views: VIEWS }; },
    apiSaveView: function (name, spec) { VIEWS.unshift({ id: id('v'), name: name, spec: spec }); return { ok: true, views: VIEWS }; },
    apiDeleteView: function (vid) { VIEWS = VIEWS.filter(function (v) { return v.id !== vid; }); return { ok: true, views: VIEWS }; },
    apiAudit: function () { var a = T.audit(AUDIT_AT); return { ok: true, audit: a.audit, dismissed: DISMISSED, history: a.history }; },
    apiAuditRun: function () { AUDIT_AT = D.text(D.today) + ' at ' + D.timeText() + ' Central'; var a = T.audit(AUDIT_AT); return { ok: true, audit: a.audit, dismissed: DISMISSED, history: a.history }; },
    apiDismiss: function (key, days) { if (days) DISMISSED[key] = { until: Date.now() + days * 86400000 }; else delete DISMISSED[key]; return { ok: true, dismissed: DISMISSED }; },
    apiAlertsCached: function (win) { return { ok: true, today: true, alerts: T.alerts(win), dismissed: DISMISSED, status: ALSTATUS, team: T.TEAM, me: E.ME }; },
    apiAlerts: function (win) { return { ok: true, today: true, alerts: T.alerts(win), dismissed: DISMISSED, status: ALSTATUS, team: T.TEAM, me: E.ME }; },
    apiAlertStatus: function (k, action, value) {
      var s = ALSTATUS[k] || { state: 'open' };
      if (action === 'done') { s.state = 'done'; s.by = 'You'; } else if (action === 'reopen') s.state = 'open';
      else if (action === 'assign') { s.assignee = value || ''; var p = T.TEAM.filter(function (x) { return x.email === value; })[0]; s.assigneeName = p ? p.name : ''; }
      ALSTATUS[k] = s; return { ok: true, status: ALSTATUS };
    },
    apiToolMeta: function (name) { var c = K.byName(name); if (!c) return { ok: false, error: 'Unknown account.' }; return { ok: true, campaigns: K.camps(c.i).map(function (k) { return { id: k.id, name: k.name, status: k.status, type: k.type, adGroups: k.adGroups.map(function (g) { return { id: g.id, name: g.name, status: g.status }; }), assetGroups: k.assetGroups }; }) }; },
    apiAdCopy: function (o) { return T.adCopy(o); },
    apiAdCopyLine: function (o) { return T.adCopyLine(o); },
    apiCheckLine: function (txt, kind, hopa, lim) { lim = lim || ({ sl: 25, sd: 35 }[kind]) || 30; return { ok: true, line: { issues: T.check(txt, lim, hopa), len: String(txt).length } }; },
    apiAssetWriter: function (o) { return T.assets(o); },
    apiRecap: function (o) { return T.recap(o); },
    apiWhyChanged: function (o) { return T.why(o); },
    apiTermMining: function (o) { return T.terms(o); },
    apiKeywordBuilder: function (o) { return T.keywords(o); },
    apiBudgetPacing: function (o) { return T.pacing(o); },
    apiLandingCheck: function (o) { return T.landing(o); },
    apiToolTakeaway: function (title, facts) { return T.takeaway(title, facts); },
    apiPrefsSave: function (o) { PREFS = o; return { ok: true, prefs: o }; },
    apiMyName: function (n) { return { ok: true, name: n }; },
    apiMondayAdd: function () { return { ok: false, error: 'monday.com is not connected in this demo.' }; },
    apiExportSheet: function () { return { ok: false, error: 'Google Sheets export is turned off in this demo.' }; },
    apiResultSheet: function () { return { ok: false, error: 'Google Sheets export is turned off in this demo.' }; },
    apiExportDoc: function () { return { ok: false, error: 'Google Docs export is turned off in this demo.' }; },
    apiBrief: function () { return { ok: false }; },
    apiAdminState: function () { return { ok: false, denied: true }; },
    apiGa4State: function () { return { ok: false }; },
    apiPeople: function () { return { ok: false, denied: true }; }
  };
  function projOut(p) { var o = KIT.clone(p); o.items = p.items.map(function (i) { return { id: i.id, kind: i.kind, name: i.name, chars: i.chars, size: i.size, by: i.by, at: i.at }; }); o.capacity = { pct: Math.min(100, Math.round(p.items.reduce(function (s, i) { return s + (i.chars || 0); }, 0) / 2000)) }; return o; }
  H.apiCall = function (token, fn, args) { var f = api[fn]; if (!f) return { ok: false, error: 'This action is turned off in the demo.' }; return f.apply(null, args || []); };
  H.apiAuthStart = function (o) { return { email: String(o.email || '').replace(/^(.).*(@.*)$/, '$1***$2') }; };
  H.apiAuthVerify = function () { return { token: 'demo' }; };
  H.apiAuthResend = function () { return { ok: true }; };
  H.apiAuthLogout = function () { return { ok: true }; };
  K.delay.apiCall = function (t, fn) { return { apiChatStep: 650, apiChatTools: 1100, apiChatSend: 350, apiAuditRun: 2200, apiAlerts: 1800, apiAdCopy: 2400, apiAssetWriter: 1800, apiRecap: 1600, apiWhyChanged: 2200, apiTermMining: 1300, apiKeywordBuilder: 1300, apiBudgetPacing: 1000, apiLandingCheck: 2400, apiToolTakeaway: 1500, apiExplore: 700, apiAdCopyLine: 1100, apiCheckLine: 150 }[fn] || 260; };
})();
