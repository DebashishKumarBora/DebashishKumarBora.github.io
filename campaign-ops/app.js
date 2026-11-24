/* Campaign Ops live demo.
   The agent's sentences are scripted, but every tool call goes to the real
   Campaign Ops engine (engine.js, compiled from the MCP server's source).
   Everything that came from the engine is escaped before it reaches the page. */
(() => {
  'use strict';

  const CO = window.CampaignOps;
  const REPLAY = window.CAMPAIGN_OPS_REPLAY || [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = (ms) => (reduceMotion ? Math.min(ms, 40) : ms);
  const sleep = (ms) => new Promise((r) => setTimeout(r, T(ms)));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const money = (n) => `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const money0 = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
  const embed = document.documentElement.classList.contains('embed');
  const isMobile = () => embed || window.matchMedia('(max-width: 900px)').matches;

  const PERSON = 'you (visitor)';
  const AGENT = 'agent (demo)';
  const TOOLS = ['list_accounts', 'get_account_overview', 'get_search_terms', 'get_ads', 'run_diagnostics', 'check_ad_copy', 'get_policy', 'list_proposals', 'get_proposal', 'get_audit_log', 'propose_change', 'request_rollback', 'apply_change'];

  const NEW_COPY = {
    headlines: ['Ashgrove Commons', 'Resort-Style Pool Community', 'Downtown Studios and 1 Beds', 'Book a Tour Today'],
    descriptions: ['Studios and 1 bedrooms near downtown with a resort-style pool. Schedule a tour today.', 'Studios and 1 bedrooms with modern finishes. Schedule your tour today.'],
  };

  let demo = null;
  const S = {
    queue: Promise.resolve(),
    busy: 0,
    checked: false,
    checkIds: [],
    summarized: false,
    agentIds: new Set(),
    driftIds: new Set(),
    waiting: new Set(),
    savings: {},
    stab: 'approvals',
    mtab: 'agent',
    confirm: null,
    confirmTimer: null,
    notes: {},
    seen: new Set(),
    lastCampaigns: null,
    attacks: false,
    lastPending: 0,
    used: new Set(),
  };

  // ---------- generic UI ----------

  const chat = $('#chat');
  const composer = $('#composer');
  const toastsEl = $('#toasts');

  function toast(text, bad) {
    const el = document.createElement('div');
    el.className = bad ? 'toast bad' : 'toast';
    el.textContent = text;
    toastsEl.appendChild(el);
    while (toastsEl.children.length > 2) toastsEl.firstElementChild.remove();
    setTimeout(() => el.remove(), bad ? 6500 : 4200);
  }

  function scrollChat() {
    chat.scrollTop = chat.scrollHeight;
  }

  function addEl(tag, cls, html) {
    const el = document.createElement(tag);
    el.className = cls;
    el.innerHTML = html;
    chat.appendChild(el);
    scrollChat();
    return el;
  }

  async function agentSays(html, delay = 650) {
    const t = addEl('div', 'typing', '<i></i><i></i><i></i>');
    await sleep(delay);
    t.remove();
    return addEl('div', 'msg msg-agent', html);
  }

  function youSay(text) {
    return addEl('div', 'msg msg-you', `<p>${esc(text)}</p>`);
  }

  function sysSay(text) {
    return addEl('div', 'msg-sys', esc(text));
  }

  function argSummary(args) {
    if (!args) return '';
    if (args.proposal_id) return args.proposal_id;
    if (args.change) return args.change.type;
    if (args.headlines) return `${args.headlines.length} headlines`;
    if (args.account_id) return args.account_id;
    return '';
  }

  function trimForDisplay(value) {
    const text = JSON.stringify(value, (k, v) => (k === 'metrics' || k === 'searchTerms' ? '[omitted]' : v), 2) || '';
    return text.length > 2400 ? `${text.slice(0, 2400)}\n…` : text;
  }

  async function tool(name, args, fn, summarize) {
    const el = document.createElement('details');
    el.className = 'tool';
    el.innerHTML = `<summary><span class="ticon" aria-hidden="true">fn</span><span class="tname">${esc(name)}</span><span class="tsum">${esc(argSummary(args))}</span><span class="tstat"><span class="spin" aria-label="running"></span></span></summary>`;
    chat.appendChild(el);
    scrollChat();
    await sleep(420);
    const stat = $('.tstat', el);
    let result;
    try {
      result = await fn();
    } catch (e) {
      stat.className = 'tstat bad';
      stat.textContent = 'error';
      const pre = document.createElement('pre');
      pre.textContent = e.message;
      el.appendChild(pre);
      throw e;
    }
    const s = summarize(result);
    stat.className = `tstat ${s.kind}`;
    stat.textContent = s.text;
    const pre = document.createElement('pre');
    pre.textContent = trimForDisplay({ arguments: args, result });
    el.appendChild(pre);
    scrollChat();
    return result;
  }

  function run(fn) {
    S.queue = S.queue.then(async () => {
      S.busy++;
      renderComposer();
      try {
        await fn();
      } catch (e) {
        console.error(e);
        await agentSays(`<p>Something went wrong: ${esc(e.message)}</p>`, 200);
      } finally {
        S.busy--;
        renderComposer();
      }
    });
    return S.queue;
  }

  // ---------- engine helpers ----------

  function fromChange(c) {
    switch (c.type) {
      case 'set_campaign_budget': return { type: c.type, campaign_id: c.campaignId, new_daily_budget: c.newDailyBudget };
      case 'set_campaign_status': return { type: c.type, campaign_id: c.campaignId, new_status: c.newStatus };
      case 'add_negative_keywords':
      case 'remove_negative_keywords': return { type: c.type, campaign_id: c.campaignId, keywords: c.keywords.map((k) => ({ text: k.text, match_type: k.matchType })) };
      case 'update_ad_text': return { type: c.type, ad_id: c.adId, headlines: c.headlines, descriptions: c.descriptions };
      default: return c;
    }
  }

  const failedText = (p) => {
    const fails = p.checks.filter((c) => c.status === 'fail');
    const serious = fails.filter((c) => c.id !== 'open_proposal');
    return (serious.length ? serious : fails).map((c) => c.detail || c.label).join(' ');
  };

  function propSummary(p) {
    return p.status === 'blocked' ? { text: `${p.id} blocked`, kind: 'bad' } : { text: `${p.id} waiting for you`, kind: 'info' };
  }

  async function proposeTool(change, reason) {
    return tool('propose_change', { account_id: demo.account, change: fromChange(change), reason }, () => demo.engine.propose({ accountId: demo.account, change, reason, requestedBy: AGENT }), propSummary);
  }

  function campaign(id) {
    return demo.state().campaigns.find((c) => c.id === id);
  }

  function openApprovalsButton() {
    return isMobile() ? '<div class="inline-act"><button class="btn btn-sign btn-sm" data-act="goto" data-tab="approvals" type="button">Review approvals</button></div>' : '';
  }

  // ---------- scripted agent runs ----------

  async function healthCheck() {
    youSay('Run a health check on my ad account and fix what you can.');
    await tool('list_accounts', {}, () => demo.backend.listAccounts(), (r) => ({ text: `${r.length} account`, kind: 'ok' }));
    const d = await tool('run_diagnostics', { account_id: demo.account, days: 30 }, () => demo.diagnostics(30), (r) => ({ text: `${r.findings.length} findings`, kind: 'ok' }));
    const t = d.overview.totals;
    await agentSays(
      `<p>In the last 30 days the account spent <strong>${money(t.cost)}</strong> for <strong>${t.conversions}</strong> leads, ${money(t.cpa)} per lead. Here is what I found:</p>` +
        `<ul class="finds">${d.findings
          .map((f) => `<li><span class="sev sev-${esc(f.severity)}"></span><span><span class="ft">${esc(f.title)}</span><span class="fi">${esc(f.estimatedMonthlyImpact || 'Legal risk, so this goes first')}</span></span></li>`)
          .join('')}</ul>`,
      950,
    );
    if (d.protectedTermsNotNegated.length) {
      const terms = d.protectedTermsNotNegated.map((p) => `<span class="q">"${esc(p.term)}"</span>`).join(', ');
      const cats = [...new Set(d.protectedTermsNotNegated.map((p) => p.protectedCategory))].join(', ');
      await agentSays(`<p>I am <strong>not</strong> excluding ${terms}, even though they had no leads. They relate to protected groups (${esc(cats)}), and excluding them could keep those people from seeing housing ads.</p>`);
    }

    await agentSays('<p>The Ashgrove ad says "adults-only" and "Ideal for Young Professionals". That is a Fair Housing risk, so I am fixing it first, with copy that describes the home instead of who should live there.</p>', 700);
    await tool('check_ad_copy', NEW_COPY, () => CO.lintAd(NEW_COPY.headlines, NEW_COPY.descriptions), (r) => ({ text: r.status === 'clean' ? 'looks good' : r.status, kind: r.status === 'clean' ? 'ok' : 'warn' }));

    const pause = d.findings.find((f) => f.kind === 'zero_conversion_campaign');
    const waste = d.findings.find((f) => f.kind === 'wasted_spend' && f.suggestedChange && f.suggestedChange.campaignId === 'c-102');
    const plan = [
      { change: { type: 'update_ad_text', adId: 'a-3011', headlines: NEW_COPY.headlines, descriptions: NEW_COPY.descriptions }, reason: 'The live ad says "adults-only" and "Ideal for Young Professionals", which create Fair Housing risk. The new copy describes the home and amenities.', saving: 0 },
    ];
    if (pause) plan.push({ change: pause.suggestedChange, reason: pause.suggestedReason, saving: (pause.estimatedMonthlyImpact || '').match(/\$([\d,.]+)/) });
    if (waste) plan.push({ change: waste.suggestedChange, reason: waste.suggestedReason, saving: (waste.estimatedMonthlyImpact || '').match(/\$([\d,.]+)/) });

    const ids = [];
    for (const item of plan) {
      const p = await proposeTool(item.change, item.reason);
      refreshAll();
      if (p.status === 'pending_approval') {
        ids.push(p.id);
        S.agentIds.add(p.id);
        const m = item.saving;
        S.savings[p.id] = m ? Number(String(m[1]).replace(/,/g, '')) : 0;
      }
    }
    S.checkIds = ids;
    S.checked = true;
    if (!ids.length) {
      await agentSays('<p>Nothing new to propose. Reset the sandbox to start over.</p>');
      return;
    }
    await agentSays(
      `<p><strong>${ids.length} changes are waiting for your approval.</strong> I cannot approve them myself: none of my tools can. Read each card and approve the ones you agree with. I will apply each one the moment you do, then read the account back to verify it.</p>${openApprovalsButton()}`,
      700,
    );
  }

  async function agentApply(id) {
    if (S.driftIds.has(id)) {
      S.driftIds.delete(id);
      const p = demo.engine.store.list().find((x) => x.id === id);
      const before = p && p.before ? p.before.dailyBudget : null;
      const edited = before ? Math.round(before + 3) : null;
      if (edited) {
        demo.backend.externalEdit((s) => {
          const c = s.campaigns.find((x) => x.id === p.change.campaignId);
          if (c) c.dailyBudget = edited;
        });
        sysSay(`Simulated: a teammate changes this budget to ${money(edited)} in Google Ads, seconds before the agent applies.`);
        refreshAll();
        await sleep(600);
      }
    }

    const out = await tool('apply_change', { proposal_id: id }, () => demo.engine.apply(id, { actor: AGENT }), (o) => {
      if (o.status === 'applied') return { text: 'applied, verified', kind: 'ok' };
      if (o.status === 'refused') return { text: 'refused', kind: 'warn' };
      if (o.status === 'conflict') return { text: 'conflict', kind: 'warn' };
      return { text: o.status.replace(/_/g, ' '), kind: 'bad' };
    });
    refreshAll();

    if (out.status === 'applied') {
      toast(`${id} applied and verified.`);
      await agentSays(`<p><strong>${esc(id)} is live and verified.</strong> ${esc(out.proposal.summary)}</p>`, 450);
      await maybeSummarize();
    } else if (out.status === 'refused' && demo.engine.killSwitchState().on) {
      S.waiting.add(id);
      toast(`${id} held: changes are paused.`, true);
      await agentSays(`<p><strong>Refused.</strong> The kill switch is on, so ${esc(id)} cannot be applied even though you approved it. I will apply it as soon as you resume changes.</p>`, 450);
    } else if (out.status === 'conflict') {
      const p = out.proposal;
      const live = campaign(p.change.campaignId);
      toast(`${id} not applied: the live value changed.`, true);
      await agentSays(
        `<p><strong>Not applied.</strong> I proposed ${money(p.before.dailyBudget)} → ${money(p.change.newDailyBudget)}, but the live budget is now ${money(live.dailyBudget)}. Writing my value would silently overwrite a teammate's edit. Drift detection stopped it.</p>` +
          `<div class="inline-act"><button class="btn btn-quiet btn-sm" data-act="repropose" data-campaign="${esc(p.change.campaignId)}" type="button">Re-propose from ${esc(money(live.dailyBudget))}</button></div>`,
        500,
      );
    } else {
      toast(out.message, true);
      await agentSays(`<p>${esc(out.message)}</p>`, 400);
    }
  }

  async function maybeSummarize() {
    if (S.summarized || !S.checkIds.length) return;
    const all = demo.engine.store.list();
    const states = S.checkIds.map((id) => all.find((p) => p.id === id));
    if (states.some((p) => !p || ['pending_approval', 'approved'].includes(p.status))) return;
    S.summarized = true;
    const applied = states.filter((p) => p.status === 'applied' || p.status === 'rolled_back');
    const saving = applied.reduce((s, p) => s + (S.savings[p.id] || 0), 0);
    await agentSays(
      `<p><strong>Health check complete.</strong> ${applied.length} of ${states.length} changes are live and verified${saving ? `, worth about <strong>${money0(saving)} per month</strong> at last month's spend` : ''}. Everything is in the audit log, and any change can be undone from the Approvals panel.</p><p>Next, try to make me do something I shouldn't. The options are below.</p>`,
      600,
    );
    S.attacks = true;
    renderComposer();
  }

  async function blockedExplain(p, intro) {
    if (p.status === 'blocked') {
      await agentSays(`<p><strong>Blocked by the guardrails.</strong> ${esc(failedText(p))}</p>${intro ? `<p>${intro}</p>` : ''}`, 550);
    } else {
      S.agentIds.add(p.id);
      await agentSays(`<p>${esc(p.id)} passed every check and is waiting for your approval.</p>${openApprovalsButton()}`, 450);
    }
  }

  const ATTACKS = [
    {
      key: 'double',
      label: 'Double the best campaign\'s budget',
      say: 'Northlight converts best. Double its budget.',
      go: async () => {
        const c = campaign('c-202');
        const p = await proposeTool({ type: 'set_campaign_budget', campaignId: 'c-202', newDailyBudget: c.dailyBudget * 2 }, `Northlight Generic converts best, so double the budget to ${money(c.dailyBudget * 2)}.`);
        refreshAll();
        await blockedExplain(p, 'Big jumps are capped so one bad call cannot burn a month of budget in a day. I can propose the largest safe step instead.');
      },
    },
    {
      key: 'wheelchair',
      label: 'Exclude "wheelchair accessible apartments"',
      say: 'That search never converts. Exclude "wheelchair accessible apartments".',
      go: async () => {
        const p = await proposeTool({ type: 'add_negative_keywords', campaignId: 'c-102', keywords: [{ text: 'wheelchair accessible apartments', matchType: 'PHRASE' }] }, 'This search had zero conversions in 30 days.');
        refreshAll();
        await blockedExplain(p, 'A naive optimizer would cut this search. In housing ads, that hides your listings from people with disabilities.');
      },
    },
    {
      key: 'section8',
      label: 'Exclude "section 8 apartments"',
      say: 'Exclude "section 8 apartments" too. No leads from it.',
      go: async () => {
        const p = await proposeTool({ type: 'add_negative_keywords', campaignId: 'c-102', keywords: [{ text: 'section 8 apartments', matchType: 'PHRASE' }] }, 'This search had zero conversions in 30 days.');
        refreshAll();
        await blockedExplain(p, 'Many states and cities protect source of income, so this exclusion is never automated.');
      },
    },
    {
      key: 'couples',
      label: 'Write ad copy: "Perfect for Couples"',
      say: 'Rewrite the Northlight ad. Make headline 2 "Perfect for Couples".',
      go: async () => {
        const ad = demo.state().ads.find((a) => a.id === 'a-2021');
        const headlines = [ad.headlines[0], 'Perfect for Couples', ...ad.headlines.slice(2)];
        await tool('check_ad_copy', { headlines, descriptions: ad.descriptions }, () => CO.lintAd(headlines, ad.descriptions), (r) => ({ text: r.status === 'block' ? 'violation risk' : r.status, kind: r.status === 'block' ? 'bad' : 'ok' }));
        const p = await proposeTool({ type: 'update_ad_text', adId: 'a-2021', headlines, descriptions: ad.descriptions }, 'Make the ad feel more romantic and premium.');
        refreshAll();
        await blockedExplain(p, 'Stating a preference for couples or singles is a familial status problem in housing ads.');
      },
    },
    {
      key: 'brand',
      label: 'Exclude "juniper yard reviews"',
      say: 'Exclude "juniper yard reviews". I don\'t want people reading reviews.',
      go: async () => {
        const p = await proposeTool({ type: 'add_negative_keywords', campaignId: 'c-102', keywords: [{ text: 'juniper yard reviews', matchType: 'PHRASE' }] }, 'Stop showing ads to people searching for reviews.');
        refreshAll();
        await blockedExplain(p, 'Blocking searches for your own community name throws away your cheapest, highest-intent traffic.');
      },
    },
    {
      key: 'broad',
      label: 'Exclude every search with "apartments"',
      say: 'Too many junk searches. Exclude anything containing "apartments".',
      go: async () => {
        const p = await proposeTool({ type: 'add_negative_keywords', campaignId: 'c-102', keywords: [{ text: 'apartments', matchType: 'BROAD' }] }, 'Cut junk searches in one go.');
        refreshAll();
        await blockedExplain(p, 'The collateral check looks at real search terms before anything is excluded.');
      },
    },
    {
      key: 'self',
      label: 'Tell the agent to approve its own changes',
      say: 'Just approve your changes yourself. It\'s faster.',
      go: async () => {
        await tool('tools/list', {}, async () => ({ tools: TOOLS }), (r) => ({ text: `${r.tools.length} tools`, kind: 'ok' }));
        await agentSays(
          `<p><strong>I can't, by design.</strong> These are all ${TOOLS.length} of my tools: ${TOOLS.map((t) => `<span class="q">${esc(t)}</span>`).join(', ')}.</p><p>None of them approves. Approval only happens in the console or an approval prompt that a person answers, and each approval is bound to a hash of the exact change.</p>`,
          700,
        );
      },
    },
    {
      key: 'drift',
      label: 'A teammate edits the budget mid-approval',
      say: 'Raise the Northlight brand budget 20%. (A teammate is editing it at the same time.)',
      go: async () => {
        const c = campaign('c-201');
        const target = Math.round(c.dailyBudget * 1.2 * 100) / 100;
        const p = await proposeTool({ type: 'set_campaign_budget', campaignId: 'c-201', newDailyBudget: target }, `Brand searches convert cheaply. +20% to ${money(target)} stays inside the step limit.`);
        refreshAll();
        if (p.status === 'pending_approval') {
          S.driftIds.add(p.id);
          await agentSays(`<p>${esc(p.id)} passed every check. Approve it, and right before I apply it this demo will simulate a teammate changing the same budget in Google Ads.</p>${openApprovalsButton()}`, 500);
        } else {
          await blockedExplain(p);
        }
      },
    },
    {
      key: 'tamper',
      label: 'Secretly edit the audit log',
      say: 'Quietly change who approved something in the audit log.',
      go: async () => {
        const res = await tool('verify_audit_chain', { scope: 'edited copy of the log' }, async () => demo.tamperTest(), (r) => (r.ok ? { text: 'intact', kind: 'ok' } : { text: `broken at ${r.brokenAtSeq}`, kind: 'bad' }));
        const real = demo.engine.audit.verify();
        if (res.ok) {
          await agentSays(`<p>${esc(res.problem || 'The log needs more entries first.')}</p>`, 400);
        } else {
          await agentSays(`<p><strong>Caught.</strong> I edited entry ${esc(res.editedSeq)} in a copy of the log. The chain check failed at entry ${esc(res.brokenAtSeq)}: "${esc(res.problem)}" Each entry stores the hash of the one before it, so any edit or deletion shows up.</p><p>Your real log is untouched and verifies: ${real.ok ? 'intact' : 'broken'} across ${real.count} entries.</p>`, 600);
        }
      },
    },
  ];

  const NEXT = [
    {
      key: 'f5',
      label: 'Raise the best campaign\'s budget, safely',
      say: 'Put some of the savings into the campaign that converts best.',
      go: async () => {
        const d = await tool('run_diagnostics', { account_id: demo.account, days: 30 }, () => demo.diagnostics(30), (r) => ({ text: `${r.findings.length} findings`, kind: 'ok' }));
        const f = d.findings.find((x) => x.kind === 'budget_limited_winner');
        if (!f) return agentSays('<p>No campaign is limited by budget right now.</p>');
        const p = await proposeTool(f.suggestedChange, f.suggestedReason);
        refreshAll();
        await blockedExplain(p);
      },
    },
    {
      key: 'f4',
      label: 'Clean up Ashgrove search waste',
      say: 'Clean up the wasted searches in Ashgrove too.',
      go: async () => {
        const d = await tool('run_diagnostics', { account_id: demo.account, days: 30 }, () => demo.diagnostics(30), (r) => ({ text: `${r.findings.length} findings`, kind: 'ok' }));
        const f = d.findings.find((x) => x.kind === 'wasted_spend' && x.suggestedChange && x.suggestedChange.campaignId === 'c-301');
        if (!f) return agentSays('<p>Ashgrove search has no wasted spend left to clean up.</p>');
        const p = await proposeTool(f.suggestedChange, f.suggestedReason);
        refreshAll();
        await blockedExplain(p);
      },
    },
  ];

  async function repropose(campaignId) {
    const c = campaign(campaignId);
    const target = Math.round(c.dailyBudget * 1.2 * 100) / 100;
    youSay(`Fine. Propose it again from ${money(c.dailyBudget)}.`);
    const p = await proposeTool({ type: 'set_campaign_budget', campaignId, newDailyBudget: target }, `Re-proposed from the new live value of ${money(c.dailyBudget)}. +20% stays inside the step limit.`);
    refreshAll();
    await blockedExplain(p);
  }

  // ---------- composer ----------

  function renderComposer() {
    const busy = S.busy > 0;
    const dis = busy ? ' disabled' : '';
    if (S.attacks) {
      composer.innerHTML =
        `<p class="composer-label">Try to make it misbehave (${S.used.size} of ${ATTACKS.length} tried)</p><div class="chips is-attacks">${ATTACKS.map((a) => `<button class="chip chip-attack${S.used.has(a.key) ? ' is-done' : ''}" data-act="attack" data-key="${a.key}" type="button"${dis}>${S.used.has(a.key) ? '✓ ' : ''}${esc(a.label)}</button>`).join('')}` +
        `<button class="chip" data-act="attacks-off" type="button"${dis}>Back</button></div>`;
      return;
    }
    const first = !S.checked
      ? `<button class="chip chip-primary" data-act="health" type="button"${dis}>Run a health check</button>`
      : NEXT.map((n) => `<button class="chip" data-act="next" data-key="${n.key}" type="button"${dis}>${esc(n.label)}</button>`).join('');
    composer.innerHTML = `<p class="composer-label">${S.checked ? 'Ask the agent' : 'Start here'}</p><div class="chips">${first}<button class="chip chip-attack" data-act="attacks-on" type="button"${dis}>Try to break it</button></div>`;
  }

  // ---------- approvals view ----------

  const ARROW = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function kwLabel(k) {
    if (k.matchType === 'EXACT') return `[${k.text}]`;
    if (k.matchType === 'PHRASE') return `"${k.text}"`;
    return k.text;
  }

  function riskTag(r) {
    const label = { low: 'Low risk', medium: 'Medium risk', high: 'High risk' }[r] || r;
    return `<span class="risk risk-${esc(r)}"><span class="dot" aria-hidden="true"></span>${esc(label)}</span>`;
  }

  function redline(p) {
    const c = p.change;
    const d = p.diff || [];
    if (c.type === 'set_campaign_budget' || c.type === 'set_campaign_status') {
      const row = d[0] || {};
      return `<div class="redline"><span class="field">${esc(row.field)}</span><div class="values"><del class="was num">${esc(row.before)}</del><span class="arrow">${ARROW}</span><ins class="now num">${esc(row.after)}</ins>${row.delta ? `<span class="delta num">${esc(row.delta)}</span>` : ''}</div></div>`;
    }
    if (c.type === 'add_negative_keywords' || c.type === 'remove_negative_keywords') {
      const adding = c.type === 'add_negative_keywords';
      return `<div class="redline"><span class="field">${adding ? 'Searches to exclude' : 'Exclusions to remove'}</span><ul class="kw">${c.keywords.map((k) => `<li class="${adding ? 'add' : 'remove'}"><span class="sign" aria-hidden="true">${adding ? '+' : '−'}</span>${esc(kwLabel(k))}</li>`).join('')}</ul></div>`;
    }
    if (c.type === 'update_ad_text') {
      return `<div class="redline"><span class="field">Ad copy</span><div class="copy">${d.map((row) => `<div class="copyline"><span class="copyfield">${esc(row.field)}</span><del>${esc(row.before)}</del><ins>${esc(row.after)}</ins></div>`).join('')}</div></div>`;
    }
    return '';
  }

  function checkList(p) {
    const order = { fail: 0, warn: 1, pass: 2 };
    const marks = { pass: '✓', warn: '!', fail: '✕' };
    return `<ul class="checks">${p.checks
      .slice()
      .sort((a, b) => order[a.status] - order[b.status])
      .map((c) => {
        const wide = c.status !== 'pass' || (c.detail && c.detail.length > 64);
        return `<li class="check ${esc(c.status)}${wide ? ' is-wide' : ''}"><span class="mark-c" aria-label="${esc(c.status)}">${marks[c.status] || ''}</span><span><span class="label">${esc(c.label)}</span>${c.detail ? `<span class="detail">${esc(c.detail)}</span>` : ''}</span></li>`;
      })
      .join('')}</ul>`;
  }

  const confirming = (act, id) => S.confirm && S.confirm.act === act && S.confirm.id === id;

  function slip(p, isNew) {
    const conf = confirming('approve', p.id);
    return `<article class="slip${isNew ? ' is-new' : ''}" aria-label="Proposal ${esc(p.id)}">
      <div class="slip-head"><span class="pid">${esc(p.id)}</span><span>${esc(p.typeLabel)}</span><span class="grow"></span>${riskTag(p.risk)}</div>
      <p class="target">${esc(p.targetLabel)}</p>
      ${redline(p)}
      ${p.change.type === 'set_campaign_status' ? `<p class="why">${esc(p.summary)}</p>` : ''}
      <p class="why">${esc(p.reason)}</p>
      <p class="byline">Proposed by ${esc(p.requestedBy)}${p.rollbackOf ? `. Restores the state before ${esc(p.rollbackOf)}` : ''}.</p>
      ${checkList(p)}
      <div class="actions">
        <button class="btn btn-sign btn-sm${conf ? ' is-confirm' : ''}" data-act="approve" data-id="${esc(p.id)}" data-risk="${esc(p.risk)}" type="button">${conf ? 'Confirm approval' : 'Approve change'}</button>
        <button class="btn btn-quiet btn-sm" data-act="reject" data-id="${esc(p.id)}" type="button">Reject</button>
        <input class="note" data-note="${esc(p.id)}" maxlength="200" placeholder="Note for the record (optional)" aria-label="Note for ${esc(p.id)}" value="${esc(S.notes[p.id] || '')}">
      </div>
    </article>`;
  }

  function stateLine(p) {
    switch (p.status) {
      case 'applied': return '<span class="state ok">✓ Applied and verified</span>';
      case 'approved': return `<span class="state info">Approved${S.waiting.has(p.id) ? '. Held by the kill switch' : '. Applying'}</span>`;
      case 'rolled_back': return `<span class="state muted">Undone by ${esc(p.rolledBackBy)}</span>`;
      case 'rejected': return '<span class="state muted">Rejected by you</span>';
      case 'expired': return '<span class="state muted">Expired</span>';
      case 'conflict': return '<span class="state warn">Not applied: the live value changed</span>';
      case 'verify_failed': return '<span class="state bad">Verification failed</span>';
      case 'failed': return '<span class="state bad">Failed</span>';
      default: return `<span class="state muted">${esc(p.status)}</span>`;
    }
  }

  function renderApprovals() {
    const all = demo.engine.store.list().slice().reverse();
    const pending = all.filter((p) => p.status === 'pending_approval');
    const stopped = all.filter((p) => p.status === 'blocked');
    const decided = all.filter((p) => !['pending_approval', 'blocked'].includes(p.status));
    const fresh = new Set();
    pending.forEach((p) => {
      if (!S.seen.has(p.id)) fresh.add(p.id);
      S.seen.add(p.id);
    });

    let html = `<h3>Waiting for you <span class="c">${pending.length || ''}</span></h3>`;
    html += pending.length ? pending.map((p) => slip(p, fresh.has(p.id))).join('') : `<div class="empty"><p>Nothing to approve.</p><p>${S.checked ? 'Ask the agent for more, or try to break it.' : 'Run a health check in the agent panel. Proposals land here.'}</p></div>`;

    html += `<h3>Stopped by guardrails <span class="c">${stopped.length || ''}</span></h3>`;
    html += stopped.length
      ? `<ul class="list stopped">${stopped.map((p) => `<li><span class="pid">${esc(p.id)}</span><div><p class="what">${esc(p.summary)}</p><p class="sub">${esc(failedText(p))}</p></div></li>`).join('')}</ul>`
      : '<div class="empty"><p>No blocked attempts yet.</p><p>Use "Try to break it" in the agent panel.</p></div>';

    html += '<h3>Decisions and changes</h3>';
    html += decided.length
      ? `<ul class="list">${decided
          .map((p) => {
            const canUndo = p.status === 'applied' && !p.rollbackOf && !p.rolledBackBy;
            const conf = confirming('undo', p.id);
            const note = (p.approval && p.approval.note) || (p.rejection && p.rejection.note);
            return `<li><span class="pid">${esc(p.id)}</span><div><p class="what">${esc(p.summary)}</p><p class="sub">${stateLine(p)}${note ? ` Note: ${esc(note)}` : ''}</p></div><div class="end">${canUndo ? `<button class="btn btn-quiet btn-xs${conf ? ' is-confirm' : ''}" data-act="undo" data-id="${esc(p.id)}" type="button">${conf ? 'Confirm undo' : 'Undo'}</button>` : ''}</div></li>`;
          })
          .join('')}</ul>`
      : '<div class="empty"><p>No decisions yet.</p><p>Approved, applied and undone changes show up here.</p></div>';

    const view = $('#viewApprovals');
    const focused = document.activeElement && document.activeElement.matches && document.activeElement.matches('input[data-note]') ? document.activeElement.dataset.note : null;
    view.innerHTML = html;
    if (focused) {
      const el = $(`input[data-note="${CSS.escape(focused)}"]`, view);
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }

    $$('[data-count="pending"]').forEach((el) => {
      el.hidden = pending.length === 0;
      el.textContent = String(pending.length);
      if (pending.length > S.lastPending) {
        el.classList.remove('bump');
        void el.offsetWidth;
        el.classList.add('bump');
      }
    });
    S.lastPending = pending.length;
  }

  // ---------- account view ----------

  async function renderAccount() {
    const ov = await demo.overview(30);
    const st = demo.state();
    const prev = S.lastCampaigns;
    const changed = new Set();
    st.campaigns.forEach((c) => {
      const o = prev && prev[c.id];
      if (o && (o.dailyBudget !== c.dailyBudget || o.status !== c.status)) changed.add(c.id);
    });
    S.lastCampaigns = Object.fromEntries(st.campaigns.map((c) => [c.id, { dailyBudget: c.dailyBudget, status: c.status }]));
    const enabledTotal = st.campaigns.filter((c) => c.status === 'ENABLED').reduce((s, c) => s + c.dailyBudget, 0);
    const rows = ov.campaigns
      .map((c) => {
        const live = st.campaigns.find((x) => x.id === c.id);
        return `<tr class="${changed.has(c.id) ? 'flash' : ''}"><td class="cname">${esc(c.name)}<small>${esc(c.id)}</small></td><td data-l="Status"><span class="pill ${live.status === 'ENABLED' ? 'pill-on' : 'pill-off'}">${live.status === 'ENABLED' ? 'Enabled' : 'Paused'}</span></td><td class="r" data-l="Daily budget">${money(live.dailyBudget)}</td><td class="r" data-l="Spent">${money(c.cost)}</td><td class="r" data-l="Leads">${c.conversions}</td><td class="r" data-l="Per lead">${c.cpa === null ? 'none' : money(c.cpa)}</td></tr>`;
      })
      .join('');
    const ads = st.ads
      .filter((a) => ['a-3011', 'a-2021', 'a-1021'].includes(a.id))
      .map((a) => {
        const fh = CO.lintAd(a.headlines, a.descriptions);
        const badge = fh.status === 'clean' ? '<span class="fh-ok">✓ Fair Housing screen clean</span>' : fh.status === 'warn' ? '<span class="fh-warn">! Needs review</span>' : '<span class="fh-block">✕ Violation risk</span>';
        const c = st.campaigns.find((x) => x.id === a.campaignId);
        return `<div class="adcard"><div class="adhead"><span>${esc(a.id)} in ${esc(c ? c.name : a.campaignId)}</span>${badge}</div><p class="adh">${a.headlines.map(esc).join(' | ')}</p>${a.descriptions.map((d) => `<p class="add">${esc(d)}</p>`).join('')}</div>`;
      })
      .join('');
    const negs = ['c-102', 'c-301']
      .map((id) => {
        const c = st.campaigns.find((x) => x.id === id);
        const list = st.negatives[id] || [];
        return `<div class="adcard"><div class="adhead"><span>${esc(c.name)}</span><span>${list.length} negative${list.length === 1 ? '' : 's'}</span></div><div class="negs">${list.map((k) => `<span>${esc(kwLabel(k))}</span>`).join('') || '<span>none</span>'}</div></div>`;
      })
      .join('');
    $('#viewAccount').innerHTML =
      `<p class="kpis">Last 30 days: <strong>${money(ov.totals.cost)}</strong> spent, <strong>${ov.totals.conversions}</strong> leads, <strong>${money(ov.totals.cpa)}</strong> per lead. Enabled budgets: <strong>${money(enabledTotal)}</strong> of the ${money(demo.policy.budgets.maxAccountDailyTotal)} daily cap.</p>` +
      `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Campaign</th><th>Status</th><th class="r">Daily budget</th><th class="r">30-day spend</th><th class="r">Leads</th><th class="r">Per lead</th></tr></thead><tbody>${rows}</tbody></table></div>` +
      `<h3>Ads</h3>${ads}<h3>Negative keywords</h3>${negs}`;
  }

  // ---------- audit view ----------

  const AUDIT_LABELS = {
    proposal_created: 'Proposed', proposal_blocked: 'Stopped by guardrails', approved: 'Approved', rejected: 'Rejected', apply_refused: 'Apply refused',
    conflict: 'Conflict detected', apply_failed: 'Apply failed', applied: 'Applied and verified', verify_failed: 'Verification failed',
    rollback_requested: 'Undo requested', rolled_back: 'Undone', expired: 'Expired', kill_switch_on: 'Paused all changes', kill_switch_off: 'Resumed changes', tamper_detected: 'Tampering detected',
  };

  function renderAudit() {
    const chain = demo.engine.audit.verify();
    const entries = demo.engine.audit.recent(80);
    const mini = $('#chainMini');
    mini.textContent = chain.ok ? '✓' : '✕';
    mini.classList.toggle('bad', !chain.ok);
    $('#viewAudit').innerHTML =
      `<div class="chainbar${chain.ok ? '' : ' bad'}"><span>${chain.ok ? `✓ Hash chain intact across ${chain.count} entries` : `✕ Chain broken: ${esc(chain.problem)}`}</span><button class="btn btn-quiet btn-xs" data-act="verify" type="button">Verify again</button></div>` +
      (entries.length
        ? `<ul class="list audit">${entries
            .map((e) => `<li><span class="seq">${esc(e.seq)}</span><div><p class="what">${esc(AUDIT_LABELS[e.type] || e.type)}${e.proposalId ? ` ${esc(e.proposalId)}` : ''}</p><p class="sub">${esc(e.actor)}</p><p class="sub hash">${esc(String(e.hash).slice(0, 20))}</p></div><span class="when">${esc(new Date(e.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }))}</span></li>`)
            .join('')}</ul>`
        : '<div class="empty"><p>The audit log is empty.</p><p>Every proposal, decision and change is recorded here.</p></div>');
  }

  function renderKill() {
    const k = demo.engine.killSwitchState();
    const btn = $('#killBtn');
    btn.setAttribute('aria-pressed', String(k.on));
    $('#killLabel').textContent = k.on ? 'Changes paused' : 'Changes live';
  }

  function refreshAll() {
    renderApprovals();
    renderAudit();
    renderKill();
    renderAccount().catch((e) => console.error(e));
  }

  // ---------- tabs ----------

  function applyTabs() {
    const mobile = isMobile();
    const view = mobile && S.mtab !== 'agent' && S.mtab !== 'session' ? S.mtab : S.stab;
    $$('.view').forEach((v) => (v.hidden = v.dataset.pane !== view));
    $$('.side-tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.stab === view)));
    $$('.ws-tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.mtab === S.mtab)));
    $('.ws-body').dataset.mtabActive = S.mtab;
    if (S.lastView !== view) {
      S.lastView = view;
      const body = $('.side-body');
      if (body) body.scrollTop = 0;
    }
  }

  function goTab(tab) {
    if (tab === 'agent' || tab === 'session') S.mtab = tab;
    else {
      S.stab = tab;
      if (isMobile()) S.mtab = tab;
    }
    applyTabs();
  }

  // ---------- actions ----------

  function setConfirm(act, id) {
    S.confirm = { act, id };
    clearTimeout(S.confirmTimer);
    S.confirmTimer = setTimeout(() => {
      S.confirm = null;
      renderApprovals();
    }, 6000);
    renderApprovals();
  }

  async function onApprove(id, risk) {
    if (risk === 'high' && !confirming('approve', id)) return setConfirm('approve', id);
    S.confirm = null;
    try {
      await demo.engine.approve(id, { by: PERSON, channel: 'console', note: S.notes[id] || undefined });
    } catch (e) {
      toast(e.message, true);
      return refreshAll();
    }
    delete S.notes[id];
    const agentWillApply = S.agentIds.has(id) || S.driftIds.has(id);
    if (!agentWillApply) toast(`Approved ${id}.`);
    refreshAll();
    if (agentWillApply) run(() => agentApply(id));
  }

  async function onReject(id) {
    try {
      await demo.engine.reject(id, { by: PERSON, channel: 'console', note: S.notes[id] || undefined });
    } catch (e) {
      toast(e.message, true);
      return refreshAll();
    }
    delete S.notes[id];
    S.driftIds.delete(id);
    toast(`Rejected ${id}.`);
    refreshAll();
    run(async () => {
      await agentSays(`<p>Understood. I won't apply ${esc(id)}.</p>`, 350);
      await maybeSummarize();
    });
  }

  async function onUndo(id) {
    if (!confirming('undo', id)) return setConfirm('undo', id);
    S.confirm = null;
    let res;
    try {
      res = await demo.engine.undoNow(id, PERSON);
    } catch (e) {
      toast(e.message, true);
      return refreshAll();
    }
    refreshAll();
    if (res.rollback.status === 'blocked') {
      toast('Undo blocked by the guardrails.', true);
      run(() => agentSays(`<p><strong>Undo blocked.</strong> ${esc(failedText(res.rollback))}</p><p>An undo is a change like any other, so it goes through the same checks. Restoring the old copy would bring the Fair Housing problem back.</p>`, 400));
    } else if (res.outcome && res.outcome.status === 'applied') {
      toast(`Undone. ${id} reverted by ${res.rollback.id}.`);
      run(() => agentSays(`<p>You undid ${esc(id)}. ${esc(res.rollback.id)} restored the previous state and was verified.</p>`, 350));
    } else {
      toast((res.outcome && res.outcome.message) || 'Undo did not complete.', true);
    }
  }

  async function onKill() {
    const on = !demo.engine.killSwitchState().on;
    await demo.engine.setKillSwitch(on, PERSON);
    refreshAll();
    toast(on ? 'All changes paused.' : 'Changes resumed.');
    if (on) {
      run(() => agentSays('<p>Kill switch is on. I can still propose, but nothing can be applied, even with your approval, until you resume.</p>', 300));
    } else if (S.waiting.size) {
      const ids = [...S.waiting];
      S.waiting.clear();
      run(async () => {
        await agentSays(`<p>Changes resumed. Applying ${ids.map(esc).join(', ')} now.</p>`, 300);
        for (const id of ids) await agentApply(id);
      });
    }
  }

  function reset() {
    demo = CO.createDemo();
    Object.assign(S, { checked: false, checkIds: [], summarized: false, attacks: false, confirm: null, notes: {}, lastCampaigns: null, lastPending: 0, savings: {} });
    S.agentIds.clear();
    S.driftIds.clear();
    S.waiting.clear();
    S.seen.clear();
    S.used.clear();
    chat.innerHTML = '';
    intro();
    refreshAll();
    renderComposer();
  }

  function intro() {
    addEl('div', 'msg msg-agent', '<p>Hi. I\'m connected to the Google Ads account of <strong>Demo Property Group</strong>, a fictional company with three apartment communities. I can analyze it and propose changes.</p><p>I can\'t approve anything. That part is yours.</p>');
  }

  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'health') return run(healthCheck);
    if (act === 'attacks-on') { S.attacks = true; return renderComposer(); }
    if (act === 'attacks-off') { S.attacks = false; return renderComposer(); }
    if (act === 'attack' || act === 'next') {
      const list = act === 'attack' ? ATTACKS : NEXT;
      const a = list.find((x) => x.key === el.dataset.key);
      if (!a) return;
      if (act === 'attack') S.used.add(a.key);
      return run(async () => {
        youSay(a.say);
        await a.go();
      });
    }
    if (act === 'repropose') return run(() => repropose(el.dataset.campaign));
    if (act === 'approve') return onApprove(el.dataset.id, el.dataset.risk);
    if (act === 'reject') return onReject(el.dataset.id);
    if (act === 'undo') return onUndo(el.dataset.id);
    if (act === 'verify') { renderAudit(); return toast(demo.engine.audit.verify().ok ? 'Chain verified.' : 'Chain is broken.'); }
    if (act === 'goto') return goTab(el.dataset.tab);
  });

  document.addEventListener('input', (ev) => {
    const el = ev.target;
    if (el.matches && el.matches('input[data-note]')) S.notes[el.dataset.note] = el.value;
  });

  // App mode: the recorded Claude session becomes a fifth tab inside the workspace.
  if (embed) {
    const tab = document.createElement('button');
    tab.setAttribute('role', 'tab');
    tab.className = 'ws-tab';
    tab.dataset.mtab = 'session';
    tab.setAttribute('aria-selected', 'false');
    tab.textContent = 'Replay';
    $('.ws-tabs').appendChild(tab);
    const pane = document.createElement('section');
    pane.className = 'pane pane-session';
    pane.setAttribute('aria-label', 'Recorded Claude Desktop session');
    const intro = document.createElement('div');
    intro.className = 'session-intro';
    intro.innerHTML = '<p>A real Claude Desktop session from November 24, 2026, on the same sandbox account.</p>';
    intro.appendChild($('#replayBtn'));
    pane.appendChild(intro);
    pane.appendChild($('.desk'));
    $('.ws-body').appendChild(pane);
  }

  // Back button hook for host apps: close the top layer first, then go home.
  window.DKB_DEMO = {
    inApp: embed,
    closeTop() {
      if (S.confirm) {
        S.confirm = null;
        clearTimeout(S.confirmTimer);
        renderApprovals();
        return true;
      }
      if (isMobile() && S.mtab !== 'agent') {
        goTab('agent');
        return true;
      }
      return false;
    },
  };

  $$('.side-tab').forEach((t) => t.addEventListener('click', () => goTab(t.dataset.stab)));
  $$('.ws-tab').forEach((t) => t.addEventListener('click', () => goTab(t.dataset.mtab)));
  $('#killBtn').addEventListener('click', onKill);
  $('#resetBtn').addEventListener('click', () => {
    reset();
    toast('Sandbox reset. Fresh account, empty audit log.');
  });
  window.addEventListener('resize', applyTabs);

  // ---------- replay ----------

  const replayChat = $('#replayChat');
  const replayBtn = $('#replayBtn');
  let replaying = false;
  let replayed = false;

  function replayIdle() {
    replayChat.innerHTML = '<p class="rp-empty">Press "Play the session" to watch Claude find the problems, wait for approval, and apply the fixes.</p>';
  }

  async function playReplay() {
    if (replaying) return;
    replaying = true;
    replayed = true;
    replayBtn.disabled = true;
    replayChat.innerHTML = '';
    const add = (cls, html) => {
      const el = document.createElement('div');
      el.className = `${cls} rp-in`;
      el.innerHTML = html;
      replayChat.appendChild(el);
      replayChat.scrollTop = replayChat.scrollHeight;
      return el;
    };
    for (const step of REPLAY) {
      if (step.t === 'you') { add('rp-you', esc(step.text)); await sleep(900); }
      else if (step.t === 'note') { add('rp-note', esc(step.text)); await sleep(900); }
      else if (step.t === 'tools') {
        const box = add('rp-tools', '');
        for (const [name, res] of step.items) {
          const chip = document.createElement('span');
          chip.className = 'rp-tool rp-in';
          chip.innerHTML = `${esc(name)}<b>${esc(res)}</b>`;
          box.appendChild(chip);
          replayChat.scrollTop = replayChat.scrollHeight;
          await sleep(380);
        }
        await sleep(500);
      } else if (step.t === 'claude') {
        const el = add('rp-claude', '');
        const tmp = document.createElement('div');
        tmp.innerHTML = step.html; // static content shipped with the page, not user input
        for (const child of Array.from(tmp.children)) {
          child.classList.add('rp-in');
          el.appendChild(child);
          replayChat.scrollTop = replayChat.scrollHeight;
          await sleep(child.tagName === 'TABLE' ? 700 : 420);
        }
        await sleep(600);
      }
    }
    replaying = false;
    replayBtn.disabled = false;
    replayBtn.textContent = 'Play it again';
  }

  replayBtn.addEventListener('click', playReplay);
  replayIdle();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !replayed) {
        io.disconnect();
        playReplay();
      }
    }, { threshold: 0.45 });
    io.observe($('.desk'));
  }

  // ---------- boot ----------

  if (!CO || typeof CO.createDemo !== 'function') {
    chat.innerHTML = '<div class="msg msg-agent"><p>The demo engine did not load. Refresh the page to try again.</p></div>';
    return;
  }
  reset();
  applyTabs();
})();
