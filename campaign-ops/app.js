/* Campaign Ops. Plain JavaScript, no build step.
   Every string that came from the AI or an ad account is escaped before it
   touches the page. Nothing is drawn on a timer: the page asks for fresh data
   every few seconds and redraws only when something actually changed.

   Two ways in. On a computer (npm run console) the page uses a console key.
   In the cloud it uses passkeys: signing in, and every approval, undo, change
   window and resume, is signed by the owner's passkey over the exact change.

   Five places: Home (is anything wrong, does anything need me), Approvals,
   Accounts, Activity and Settings. Details open on tap; the start stays calm. */
(function () {
  'use strict';

  const KEY_NAME = 'campaign-ops-console-key';
  const THEME_NAME = 'campaign-ops-theme';
  const NUDGE_NAME = 'campaign-ops-push-nudge';
  const LOCAL_POLL_MS = 2500;
  const CLOUD_POLL_MS = 8000;
  const VIEWS = ['home', 'approvals', 'accounts', 'activity', 'settings'];
  const root = document.getElementById('app');
  const sheetEl = document.getElementById('sheet');
  const modalEl = document.getElementById('modal');
  const toastsEl = document.getElementById('toasts');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  /** The public demo (web/app) runs this same app on a made-up account, entirely in the browser. */
  const DEMO = Boolean(window.CAMPAIGN_OPS_DEMO);

  const S = {
    key: null,
    data: null,
    sig: '',
    dirty: false,
    booted: false,
    seen: null,
    applied: null,
    view: 'home',
    acct: null,
    sheet: null,
    sheetFromLink: false,
    seg: 'waiting',
    filter: 'all',
    open: new Set(),
    notes: {},
    noteOpen: {},
    confirm: null,
    busy: false,
    timer: null,
    insights: {},
    auto: null,
    autoSig: '',
    autoLoading: false,
    modal: null,
    pollMs: LOCAL_POLL_MS,
    cloud: false,
    session: null,
    gate: { mode: '', busy: false, error: '' },
    pushHere: null,
    sigCheck: null,
    settingsBusy: '',
  };

  // ---------- icons ----------

  const svg = (d, cls) => `<svg class="ico${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICON = {
    home: svg('<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>'),
    sign: svg('<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>'),
    accounts: svg('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 10h18M8 15h3"/>'),
    activity: svg('<path d="M3 12h4l2.5-6 5 12 2.5-6h4"/>'),
    settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    chev: svg('<path d="M9 6l6 6-6 6"/>', 'chev'),
    back: svg('<path d="M15 6l-6 6 6 6"/>', 'ico-sm'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>', 'ico-sm'),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 'arrow'),
    pause: svg('<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>', 'ico-sm'),
    key: svg('<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l3 3M14 9l2 2"/>'),
    lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', 'ico-sm'),
    unlock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.6-1.7"/>', 'ico-sm'),
    spark: svg('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>'),
    alert: svg('<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.5v.5"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    eye: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    bell: svg('<path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
    shield: svg('<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    chat: svg('<path d="M4 5h16v11H9l-5 4V5z"/>', 'ico-sm'),
    money: svg('<path d="M12 3v18M16.5 7.5c-.8-1.4-2.4-2-4.5-2-2.6 0-4 1.3-4 3s1.6 2.5 4 3 4 1.4 4 3.3-1.6 3.2-4.2 3.2c-2.2 0-3.9-.8-4.7-2.3"/>'),
  };

  /** The gradient, defined once in a box that is drawn (a gradient inside a hidden element would not paint). */
  const DEFS = '<svg class="defs" aria-hidden="true" focusable="false"><defs><linearGradient id="cops-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6d5ef8"/><stop offset=".6" stop-color="#22d3ee"/><stop offset="1" stop-color="#f471b5"/></linearGradient></defs></svg>';

  function brandMark() {
    return '<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#0e1019"/><circle cx="16" cy="16" r="9.5" fill="none" stroke="url(#cops-grad)" stroke-width="3"/><path d="M11.8 16.4l2.9 2.9 5.6-6.1" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  // ---------- words ----------

  const MODE = { sandbox: 'Sandbox', google_ads_test: 'Test account', google_ads: 'Live' };
  const NUMBERS = { synthetic: 'Practice data', simulated: 'Simulated numbers', live: 'Real numbers' };
  const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const STATUS_WORDS = {
    approved: 'already approved',
    applied: 'already applied',
    rejected: 'rejected',
    expired: 'expired',
    blocked: 'stopped by the guardrails',
    rolled_back: 'already undone',
    conflict: 'stopped by a conflict',
    failed: 'failed',
    verify_failed: 'applied, but its check failed',
  };
  const SKILL_NAMES = {
    tracking: 'Lead tracking',
    stalled: 'Stalled campaigns',
    spend_spike: 'Spend spikes',
    lead_drop: 'Lead drops',
    outside_changes: 'Outside changes',
    ad_policy: 'Ad approvals',
    landing_pages: 'Landing pages',
    wasted_searches: 'Wasted searches',
    fair_housing: 'Fair Housing copy',
    budget_winners: 'Budget for winners',
    zero_leads: 'Spend without leads',
    pacing: 'Monthly pacing',
    ad_refresh: 'Fuller ads',
    outcomes: 'Results check',
  };
  const ZONES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Asia/Kolkata', 'UTC'];

  // ---------- helpers ----------

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }
  const plural = (n, one, many) => (n === 1 ? one : many || `${one}s`);
  const countWord = (n) => (n >= 0 && n < WORDS.length ? WORDS[n] : String(n));
  const smallWord = (n) => countWord(n).toLowerCase();

  function load(name) {
    try { return localStorage.getItem(name); } catch (e) { return null; }
  }
  function store(name, value) {
    try {
      if (value == null) localStorage.removeItem(name);
      else localStorage.setItem(name, value);
    } catch (e) { /* storage blocked: keep it in memory only */ }
  }

  function sameDay(a, b) {
    return a.toDateString() === b.toDateString();
  }
  function clock(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (sameDay(d, new Date())) return t;
    const y = new Date(Date.now() - 86_400_000);
    if (sameDay(d, y)) return `Yesterday, ${t}`;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${t}`;
  }
  function ago(iso) {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return '';
    const m = Math.round((Date.now() - t) / 60_000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} min ago`;
    return clock(iso);
  }
  function dayLabel(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    if (sameDay(d, new Date())) return 'Today';
    if (sameDay(d, new Date(Date.now() - 86_400_000))) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  }
  function dayOf(dateText) {
    const d = new Date(`${dateText}T12:00:00`);
    return Number.isNaN(d.getTime()) ? dateText : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  function untilText(ms) {
    const d = new Date(ms);
    const t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (sameDay(d, new Date())) return `${t} today`;
    if (sameDay(d, new Date(Date.now() + 86_400_000))) return `${t} tomorrow`;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${t}`;
  }
  function hourLabel(h) {
    const d = new Date(2026, 0, 1, h, 0, 0);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  function money(n) {
    return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  function roundMoney(n) {
    return `$${Math.round(Number(n || 0)).toLocaleString('en-US')}`;
  }
  function kwLabel(k) {
    if (k.matchType === 'EXACT') return `[${k.text}]`;
    if (k.matchType === 'PHRASE') return `"${k.text}"`;
    return k.text;
  }
  function shortDate(iso) {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
  }

  function toast(message, bad) {
    const el = document.createElement('div');
    el.className = bad ? 'toast bad' : 'toast';
    el.textContent = message;
    toastsEl.appendChild(el);
    setTimeout(() => el.remove(), bad ? 7000 : 4200);
  }

  async function api(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (!S.cloud) headers['X-Console-Token'] = S.key || '';
    const res = await fetch(path, { method, cache: 'no-store', credentials: 'same-origin', headers, body: body ? JSON.stringify(body) : undefined });
    let data = {};
    try { data = await res.json(); } catch (e) { /* empty body */ }
    if (res.status === 401) {
      const err = new Error(S.cloud ? data.error || 'Sign in with your passkey.' : 'That console key did not work.');
      err.auth = true;
      throw err;
    }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
    return data;
  }

  // ---------- data helpers ----------

  const accounts = () => (S.data && Array.isArray(S.data.accounts) ? S.data.accounts : []);
  const accountById = (id) => accounts().find((a) => a.id === id);
  const proposals = () => (S.data ? S.data.proposals : []);
  const RISK_ORDER = { high: 0, medium: 1, low: 2 };
  /** What needs a decision, the riskiest first. */
  const pendingList = () =>
    proposals()
      .filter((p) => p.status === 'pending_approval')
      .sort((a, b) => (RISK_ORDER[a.risk] ?? 3) - (RISK_ORDER[b.risk] ?? 3) || Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const isLive = (a) => Boolean(a && a.access && a.access.required);
  const maxWindowHours = () => (S.data && S.data.policy && S.data.policy.live && S.data.policy.live.maxWindowHours) || 8;
  const approvalMinutes = () => (S.data && S.data.policy && S.data.policy.approvals && S.data.policy.approvals.approvalTtlMinutes) || 60;
  const ap = () => (S.data ? S.data.autopilot : null);
  const confirmFor = (act, id) => Boolean(S.confirm && S.confirm.act === act && S.confirm.id === id);
  const isGoogleItself = (e) => /recommendation|google support/i.test(String(e.client || ''));

  function isTyping() {
    const el = document.activeElement;
    return Boolean(S.modal) || Boolean(el && el.matches && el.matches('input, select, textarea') && (root.contains(el) || sheetEl.contains(el)));
  }

  function levelOf(p) {
    if (p.insight && p.risk === 'high' && /fair_housing|landing_pages/.test(p.insight.skill)) return 'is-urgent';
    return p.risk === 'high' ? 'is-urgent' : p.risk === 'medium' ? 'is-warn' : 'is-ok';
  }

  function riskChip(risk) {
    const label = { low: 'Low risk', medium: 'Medium risk', high: 'High risk' }[risk] || risk;
    const cls = { low: 'is-ok', medium: 'is-warn', high: 'is-urgent' }[risk] || '';
    return `<span class="chip ${cls}">${esc(label)}</span>`;
  }

  function byLine(p) {
    if (p.insight && p.insight.skill) return `Autopilot, ${SKILL_NAMES[p.insight.skill] || p.insight.skill}`;
    return p.requestedBy;
  }

  /** A short headline for a proposal; the full summary is in the sheet. */
  function headline(p) {
    const c = p.change;
    const target = p.targetLabel;
    let h;
    switch (c.type) {
      case 'add_negative_keywords':
        h = `Block ${c.keywords.length} wasted ${plural(c.keywords.length, 'search', 'searches')} in ${target}`;
        break;
      case 'remove_negative_keywords':
        h = `Allow ${c.keywords.length} blocked ${plural(c.keywords.length, 'search', 'searches')} again in ${target}`;
        break;
      case 'set_campaign_budget': {
        const before = p.before && typeof p.before.dailyBudget === 'number' ? p.before.dailyBudget : null;
        h = `${before !== null && c.newDailyBudget < before ? 'Lower' : 'Raise'} ${target} to ${money(c.newDailyBudget)} a day`;
        break;
      }
      case 'set_campaign_status':
        h = `${c.newStatus === 'PAUSED' ? 'Pause' : 'Turn on'} ${target}`;
        break;
      case 'update_ad_text':
        h = `New copy for ad ${c.adId}`;
        break;
      case 'set_ad_status':
        h = `${c.newStatus === 'PAUSED' ? 'Pause' : 'Turn on'} ad ${c.adId}`;
        break;
      default:
        h = p.summary;
    }
    return p.rollbackOf ? `Undo ${p.rollbackOf}: ${h.charAt(0).toLowerCase()}${h.slice(1)}` : h;
  }

  function fingerprint(hash) {
    const h = String(hash || '').slice(0, 8).toUpperCase();
    return h.length === 8 ? `${h.slice(0, 4)} ${h.slice(4)}` : h;
  }

  function watchedCount() {
    if (S.auto && Array.isArray(S.auto.accounts)) return S.auto.accounts.filter((a) => a.watched).length;
    const list = accounts();
    const real = list.filter((a) => a.mode !== 'sandbox');
    return real.length || list.length;
  }

  function anyAlarm() {
    const a = ap();
    if (a && a.latest && a.latest.some((f) => f.kind === 'alert' && f.level === 'urgent' && Date.now() - Date.parse(f.at) < 86_400_000)) return true;
    return accounts().some((x) => {
      const i = S.insights[x.id];
      if (!i || !i.data) return false;
      const p = i.data.pulse;
      const w = i.data.witness;
      return Boolean((p && p.alarms && p.alarms.length) || (w && w.verdict === 'alarm'));
    });
  }

  // ---------- frame ----------

  function powerHtml(d, side) {
    const kill = d.killSwitch;
    const confirming = confirmFor('resume', 'all');
    if (kill.on) {
      if (kill.forcedByEnv) return '<span class="power is-paused"><span class="dot"></span>Paused</span>';
      return `<button class="power is-paused press${confirming ? ' is-confirm' : ''}" data-act="resume" data-id="all"><span class="dot"></span>${S.cloud ? 'Resume with passkey' : confirming ? 'Confirm resume' : side ? 'Paused. Resume' : 'Resume'}</button>`;
    }
    return `<button class="power press" data-act="pause" data-id="all" aria-label="Pause all changes">${ICON.pause}<span>${side ? 'Pause all changes' : 'Pause all'}</span></button>`;
  }

  function navItems(d) {
    const pending = d.counts.pending;
    return [
      { id: 'home', label: 'Home', icon: ICON.home },
      { id: 'approvals', label: 'Approvals', icon: ICON.sign, badge: pending },
      { id: 'accounts', label: 'Accounts', icon: ICON.accounts, pip: anyAlarm() },
      { id: 'activity', label: 'Activity', icon: ICON.activity },
      { id: 'settings', label: 'Settings', icon: ICON.settings },
    ];
  }

  function frameHtml(d, body) {
    const items = navItems(d);
    const sub = DEMO ? 'Live demo' : S.cloud && d.cloud ? `Signed in as ${d.cloud.owner}` : `Version ${d.app.version}`;
    const side = `<aside class="side" aria-label="Sections">
      <button class="brand" data-act="nav" data-id="home">${brandMark()}<div><b>Campaign Ops</b><span>${esc(sub)}</span></div></button>
      ${items.map((t) => `<button class="side-tab" data-act="nav" data-id="${t.id}"${S.view === t.id ? ' aria-current="page"' : ''}>${t.icon}<span>${t.label}</span>${t.badge ? `<span class="badge">${esc(t.badge)}</span>` : ''}${t.pip ? '<span class="pip" aria-label="Something needs a look"></span>' : ''}</button>`).join('')}
      <div class="side-foot">${powerHtml(d, true)}<p>Nothing changes in an ad account until you approve it.</p></div>
    </aside>`;
    const top = `<header class="top">
      <button class="brand" data-act="nav" data-id="home">${brandMark()}<div><b>Campaign Ops</b><span>${esc(sub)}</span></div></button>
      ${powerHtml(d, false)}
    </header>`;
    const nav = `<nav class="nav" aria-label="Sections">${items
      .map((t) => `<button class="tab" data-act="nav" data-id="${t.id}"${S.view === t.id ? ' aria-current="page"' : ''}>${t.icon}<span>${t.label}</span>${t.badge ? `<span class="badge">${esc(t.badge)}</span>` : ''}${t.pip ? '<span class="pip" aria-label="Something needs a look"></span>' : ''}</button>`)
      .join('')}</nav>`;
    return `${DEFS}<div class="frame">${side}<div class="main">${top}<main class="view" id="view">${body}</main></div></div>${nav}`;
  }

  function pausedBanner(d) {
    if (!d.killSwitch.on) return '';
    return `<div class="banner" role="alert"><span class="dot is-warn"></span><p><strong>All changes are paused.</strong> Autopilot and your AI can still propose, but nothing is applied${d.killSwitch.forcedByEnv ? ' while CAMPAIGN_OPS_KILL_SWITCH is set' : ' until you resume'}.</p></div>`;
  }

  // ---------- home ----------

  function ringSvg(kind, content) {
    const r = 38;
    const c = 2 * Math.PI * r;
    const arc = kind === 'is-on' ? c * 0.28 : c;
    const inner = typeof content === 'number'
      ? `<text class="num" x="50" y="51" text-anchor="middle" dominant-baseline="central">${content > 99 ? '99+' : content}</text>`
      : content === 'alert'
        ? '<path class="glyph" d="M50 33v20M50 64v1"/>'
        : content === 'off'
          ? '<path class="glyph" d="M39 50h22"/>'
          : '<path class="glyph" d="M38 51l8 8 16-17"/>';
    return `<svg class="ring" viewBox="0 0 100 100" aria-hidden="true">
      <circle class="track" cx="50" cy="50" r="${r}"/>
      <circle class="arc" cx="50" cy="50" r="${r}" stroke-dasharray="${arc.toFixed(1)} ${c.toFixed(1)}"/>
      ${inner}</svg>`;
  }

  function statusHtml(d) {
    const pending = pendingList();
    const a = ap();
    const running = a && a.running && a.running.length;
    const checkBtn = a ? `<button class="link" data-act="ap-check"${running || S.busy ? ' disabled' : ''}>${running ? 'Checking now' : 'Check now'}</button>` : '';
    const urgent = a && a.latest ? a.latest.find((f) => f.kind === 'alert' && f.level === 'urgent' && Date.now() - Date.parse(f.at) < 86_400_000) : null;
    let cls;
    let ring;
    let kicker;
    let title;
    const lines = [];
    let main = '';
    if (pending.length) {
      cls = 'is-warn';
      ring = ringSvg(cls, pending.length);
      kicker = 'Waiting for your signature';
      title = `${countWord(pending.length)} ${plural(pending.length, 'change needs', 'changes need')} you`;
      const saving = pending.reduce((s, p) => s + Math.max(0, (p.insight && p.insight.impactMonthly) || 0), 0);
      lines.push(saving > 0 ? `About ${roundMoney(saving)} a month to save once approved.` : headline(pending[0]));
      main = `<button class="btn btn-sign btn-small" data-act="${pending.length === 1 ? 'open' : 'nav'}" data-id="${pending.length === 1 ? esc(pending[0].id) : 'approvals'}">${pending.length === 1 ? 'Review it' : 'Review them'}</button>`;
    } else if (urgent) {
      cls = 'is-urgent';
      ring = ringSvg(cls, 'alert');
      kicker = 'Autopilot noticed something';
      title = 'Something needs a look';
      lines.push(urgent.title);
      main = '<button class="btn btn-small" data-act="nav" data-id="activity">See what happened</button>';
    } else if (!a) {
      cls = 'is-on';
      ring = ringSvg(cls, 'check');
      kicker = 'Approval console';
      title = 'Nothing is waiting';
      lines.push('When your AI proposes a change, it shows up here within seconds.');
    } else if (!a.on) {
      cls = 'is-off';
      ring = ringSvg(cls, 'off');
      kicker = 'Autopilot is off';
      title = 'Nobody is watching';
      lines.push('Turn Autopilot on and it checks your accounts every hour, writes the fix, and asks you before anything changes.');
      main = '<button class="btn btn-sign btn-small" data-act="ap-on">Turn on Autopilot</button>';
    } else {
      cls = 'is-on';
      ring = ringSvg(cls, 'check');
      kicker = 'Autopilot is watching';
      title = 'All quiet';
      const n = watchedCount();
      lines.push(`${countWord(n)} ${plural(n, 'account')} under watch.${a.lastWatch ? ` Last check ${ago(a.lastWatch)}.` : ''}`);
      if (a.reviewDue) lines.push('The full review is due within the hour.');
      else if (a.nextReview) lines.push(`Next full review ${untilText(Date.parse(a.nextReview))}.`);
    }
    if (a && a.impact && a.impact.monthly > 0) lines.push(`Fixes you approved save about ${roundMoney(a.impact.monthly)} a month.`);
    return `<section class="status ${cls}" aria-live="polite">
      <div>
        <span class="status-kicker"><span class="dot ${cls === 'is-on' ? 'is-ok' : cls}"></span>${esc(kicker)}</span>
        <h1>${esc(title)}</h1>
        ${lines.map((l) => `<p>${esc(l)}</p>`).join('')}
        ${main || checkBtn ? `<div class="btns">${main}${checkBtn}</div>` : ''}
      </div>
      ${ring}
    </section>`;
  }

  function propCard(p, isNew) {
    const lvl = levelOf(p);
    const impact = p.insight && p.insight.impact ? `<span class="impact">${esc(p.insight.impact)}</span>` : '';
    return `<button class="prop press${isNew ? ' is-new' : ''}${lvl === 'is-urgent' && p.insight ? ' is-urgent' : ''}" data-act="open" data-id="${esc(p.id)}" id="card-${esc(p.id)}">
      <span class="prop-top"><span class="dot ${lvl}"></span><span>${esc(p.id)}</span><span class="grow"></span><span>${esc(clock(p.createdAt))}</span></span>
      <span class="prop-title clamp2">${esc(headline(p))}</span>
      <span class="prop-foot">${impact}${riskChip(p.risk)}<span class="by">${esc(byLine(p))}</span></span>
    </button>`;
  }

  const FEED_ICON = { alert: ICON.alert, found: ICON.sign, applied: ICON.check, outcome: ICON.activity, review: ICON.eye, note: ICON.spark };

  function feedRow(f) {
    const key = `f:${f.id}`;
    const isOpen = S.open.has(key);
    const lvl = { urgent: 'is-urgent', warn: 'is-warn', info: 'is-info', good: 'is-ok' }[f.level] || '';
    const hasMore = Boolean(f.detail || (f.steps && f.steps.length) || (f.proposalIds && f.proposalIds.length));
    const props = (f.proposalIds || []).filter((id) => proposals().some((p) => p.id === id));
    const body = isOpen && hasMore
      ? `<div class="fold-body">${f.detail ? `<p>${esc(f.detail)}</p>` : ''}${f.steps && f.steps.length ? `<ul class="steps">${f.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}${props.length ? `<div class="btns">${props.map((id) => `<button class="btn btn-small" data-act="open" data-id="${esc(id)}">Open ${esc(id)}</button>`).join('')}</div>` : ''}</div>`
      : '';
    const sub = [f.skill ? SKILL_NAMES[f.skill] || f.skill : f.kind === 'review' ? 'Autopilot' : '', clock(f.at)].filter(Boolean).join(', ');
    const tag = hasMore ? 'button' : 'div';
    return `<div class="fold${isOpen ? ' is-open' : ''}">
      <${tag} class="row"${hasMore ? ` data-act="fold" data-id="${esc(key)}" aria-expanded="${isOpen}"` : ''}>
        <span class="row-ico ${lvl}">${FEED_ICON[f.kind] || ICON.spark}</span>
        <span class="row-main"><span class="row-title${isOpen ? '' : ' clamp2'}">${esc(f.title)}</span><span class="row-sub">${esc(sub)}</span></span>
        <span class="row-end">${hasMore ? ICON.chev : ''}</span>
      </${tag}>${body}
    </div>`;
  }

  function decisionRow(p) {
    return `<button class="row" data-act="open" data-id="${esc(p.id)}" id="row-${esc(p.id)}">
      <span class="row-ico ${stateClass(p)}">${p.status === 'applied' ? ICON.check : p.status === 'blocked' ? ICON.shield : ICON.sign}</span>
      <span class="row-main"><span class="row-title clamp2">${esc(headline(p))}</span><span class="row-sub">${stateText(p)}, ${esc(clock(p.appliedAt || (p.approval && p.approval.at) || (p.rejection && p.rejection.at) || p.createdAt))}</span></span>
      <span class="row-end">${ICON.chev}</span>
    </button>`;
  }

  function stateClass(p) {
    return { applied: 'is-ok', approved: 'is-info', rolled_back: '', rejected: '', expired: '', conflict: 'is-warn', verify_failed: 'is-urgent', failed: 'is-urgent', blocked: 'is-warn' }[p.status] || '';
  }

  function stateText(p) {
    switch (p.status) {
      case 'applied':
        return 'Applied and checked';
      case 'approved': {
        const a = accountById(p.accountId);
        return isLive(a) && !a.access.open ? 'Approved, waiting for a change window' : 'Approved, waiting to apply';
      }
      case 'rolled_back':
        return `Undone by ${esc(p.rolledBackBy)}`;
      case 'blocked':
        return 'Stopped by a guardrail';
      case 'verify_failed':
        return 'Applied, but the check failed';
      default:
        return esc((STATUS_WORDS[p.status] || String(p.status).replace(/_/g, ' ')).replace(/^already /, '').replace(/^./, (c) => c.toUpperCase()));
    }
  }

  function nudgeHtml(d) {
    if (!S.cloud || !d.cloud || S.pushHere !== false || load(NUDGE_NAME)) return '';
    const iosBrowser = isIos() && !isInstalled();
    if (!pushSupported() && !iosBrowser) return '';
    const text = iosBrowser
      ? 'Get a tap on the shoulder when something needs you. On iPhone, add Campaign Ops to your Home Screen first: tap Share, then Add to Home Screen, and open it from there.'
      : 'Get a tap on the shoulder when something needs you. Autopilot only rings for changes to approve and for real problems.';
    return `<div class="callout sec">
      <p>${esc(text)}</p>
      <div class="btns">${iosBrowser ? '' : '<button class="btn btn-sign btn-small" data-act="push-on">Turn on notifications</button>'}<button class="btn btn-small btn-quiet" data-act="nudge-hide">Not now</button></div>
    </div>`;
  }

  function homeView(d) {
    const pending = pendingList();
    const a = ap();
    let out = pausedBanner(d) + statusHtml(d) + nudgeHtml(d);
    if (pending.length) {
      out += `<section class="sec"><div class="sec-head"><h2>Needs you<span class="n">${pending.length}</span></h2>${pending.length > 3 ? '<button class="link" data-act="nav" data-id="approvals">See all</button>' : ''}</div>
        ${pending.slice(0, 3).map((p) => propCard(p, S.seen && !S.seen.has(p.id))).join('')}</section>`;
    }
    // What already shows under Needs you is left out here.
    const waiting = new Set(pending.map((p) => p.id));
    const lately = a && a.latest ? a.latest.filter((f) => !(f.kind === 'found' && (f.proposalIds || []).every((id) => waiting.has(id)))) : [];
    if (lately.length) {
      out += `<section class="sec"><div class="sec-head"><h2>Lately</h2><button class="link" data-act="nav" data-id="activity">See all</button></div>
        <div class="list">${lately.slice(0, 5).map(feedRow).join('')}</div></section>`;
    } else {
      const recent = proposals().filter((p) => p.status !== 'pending_approval' && p.status !== 'blocked').slice(0, 4);
      if (recent.length) out += `<section class="sec"><div class="sec-head"><h2>Lately</h2><button class="link" data-act="nav" data-id="approvals" data-seg="done">See all</button></div><div class="list">${recent.map(decisionRow).join('')}</div></section>`;
    }
    return out;
  }

  // ---------- approvals ----------

  function approvalsView(d) {
    const pending = pendingList();
    const stopped = proposals().filter((p) => p.status === 'blocked');
    const done = proposals().filter((p) => p.status !== 'pending_approval' && p.status !== 'blocked');
    const segBtn = (id, label) => `<button data-act="seg" data-id="${id}" aria-pressed="${S.seg === id}">${label}</button>`;
    let body;
    if (S.seg === 'done') {
      body = done.length ? `<div class="list">${done.slice(0, 40).map(decisionRow).join('')}</div>` : '<div class="empty"><b>No decisions yet</b>Approved, applied and undone changes show up here.</div>';
    } else if (S.seg === 'stopped') {
      body = stopped.length
        ? `<p class="lead sec-lead">Proposals that broke a rule, with the reason. They never reach you for approval.</p><div class="list sec">${stopped.slice(0, 20).map(decisionRow).join('')}</div>`
        : '<div class="empty"><b>Nothing stopped</b>When a proposal breaks a guardrail, it lands here with the reason.</div>';
    } else {
      body = pending.length
        ? pending.map((p) => propCard(p, S.seen && !S.seen.has(p.id))).join('')
        : '<div class="empty"><b>Nothing to approve</b>Autopilot and your AI put their proposals here. Each one waits for your signature.</div>';
    }
    return `${pausedBanner(d)}<div class="view-head"><h1>Approvals</h1><p>Nothing changes in an account until you approve it here.</p></div>
      <div class="seg" role="group" aria-label="Show">${segBtn('waiting', `Waiting${pending.length ? ` (${pending.length})` : ''}`)}${segBtn('done', 'Decided')}${segBtn('stopped', `Stopped${stopped.length ? ` (${stopped.length})` : ''}`)}</div>
      <div class="sec">${body}</div>`;
  }

  // ---------- the proposal sheet ----------

  function redline(p) {
    const c = p.change;
    const d = p.diff || [];
    if (c.type === 'set_campaign_budget' || c.type === 'set_campaign_status' || c.type === 'set_ad_status') {
      const row = d[0] || {};
      return `<div class="redline"><span class="field">${esc(row.field)}</span><div class="values"><del class="was">${esc(row.before)}</del>${ICON.arrow}<ins class="now">${esc(row.after)}</ins>${row.delta ? `<span class="delta">${esc(row.delta)}</span>` : ''}</div></div>`;
    }
    if (c.type === 'add_negative_keywords' || c.type === 'remove_negative_keywords') {
      const adding = c.type === 'add_negative_keywords';
      return `<div class="redline"><span class="field">${adding ? 'Searches to block' : 'Blocks to remove'}</span><ul class="kw">${c.keywords.map((k) => `<li class="${adding ? 'add' : 'remove'}"><span class="sign" aria-hidden="true">${adding ? '+' : '−'}</span>${esc(kwLabel(k))}</li>`).join('')}</ul></div>`;
    }
    if (c.type === 'update_ad_text') {
      return `<div class="redline"><span class="field">Ad copy</span>${d.map((row) => `<div class="copyline"><span class="copyfield">${esc(row.field)}</span>${row.before && row.before !== '(none)' ? `<del>${esc(row.before)}</del>` : ''}${row.after && row.after !== '(removed)' ? `<ins>${esc(row.after)}</ins>` : '<del>Removed</del>'}</div>`).join('')}</div>`;
    }
    return '';
  }

  function checksBlock(p) {
    const order = { fail: 0, warn: 1, pass: 2 };
    const marks = { pass: '✓', warn: '!', fail: '✕' };
    const list = (p.checks || []).filter((c) => c.id !== 'live_access').sort((a, b) => order[a.status] - order[b.status]);
    const fails = list.filter((c) => c.status === 'fail').length;
    const warns = list.filter((c) => c.status === 'warn').length;
    const summary = fails ? `${countWord(fails)} ${plural(fails, 'check')} failed` : warns ? `${list.length - warns} ${plural(list.length - warns, 'check')} passed, ${smallWord(warns)} to note` : `All ${list.length} ${plural(list.length, 'check')} passed`;
    const key = `checks:${p.id}`;
    const open = S.open.has(key) || fails > 0;
    const dot = fails ? 'is-urgent' : warns ? 'is-warn' : 'is-ok';
    return `<div class="block"><button class="fold-btn" data-act="fold" data-id="${esc(key)}" aria-expanded="${open}"><span class="dot ${dot}"></span><span class="grow">${esc(summary)}</span>${ICON.chev}</button>
      ${open ? `<div class="fold-panel"><ul class="checks">${list.map((c) => `<li class="check ${esc(c.status)}"><span class="mark" aria-label="${esc(c.status)}">${marks[c.status] || ''}</span><span><span class="label">${esc(c.label)}</span>${c.detail ? `<span class="detail">${esc(c.detail)}</span>` : ''}</span></li>`).join('')}</ul></div>` : ''}
    </div>`;
  }

  function evidenceBlock(p) {
    const ev = (p.insight && p.insight.evidence) || [];
    if (!ev.length) return '';
    const key = `ev:${p.id}`;
    const all = S.open.has(key);
    const shown = all ? ev : ev.slice(0, 3);
    return `<div class="block"><h3>What Autopilot saw</h3><ul class="evidence">${shown.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>${ev.length > 3 && !all ? `<button class="link" data-act="fold" data-id="${esc(key)}">Show ${ev.length - 3} more</button>` : ''}</div>`;
  }

  function liveNote(p) {
    const a = accountById(p.accountId);
    if (!isLive(a)) return '';
    if (S.cloud) return '<div class="block callout is-warn">Live account, real money. Your passkey signature lets this one change through right away. Every other change still needs its own.</div>';
    if (a.access.open) return `<div class="block callout is-ok">Live account. A change window is open until ${esc(clock(a.access.until))}, so this is applied as soon as you approve it.</div>`;
    return `<div class="block callout is-warn">Live account, real money. You can approve now; it is applied once you open a change window.<div class="btns"><button class="btn btn-small" data-act="window" data-id="${esc(a.id)}">Open change window</button></div></div>`;
  }

  function signatureLine(p) {
    if (p.approval && p.approval.at) {
      const ev = p.approval.evidence;
      const checked = S.sigCheck && S.sigCheck.byId[p.id];
      const seal = ev && ev.kind === 'passkey'
        ? checked
          ? checked.valid ? '<span class="seal-tag ok">✓ Signature checks out</span>' : `<span class="seal-tag bad">✕ ${esc(checked.reason || 'Signature does not check out')}</span>`
          : '<span class="seal-tag">Passkey signature</span>'
        : '';
      return `<p class="signature">Approved by ${esc(p.approval.by)}, ${esc(clock(p.approval.at))}${p.approval.note ? `. Note: ${esc(p.approval.note)}` : ''}${seal}</p>`;
    }
    if (p.rejection && p.rejection.at) return `<p class="signature">Turned down by ${esc(p.rejection.by)}, ${esc(clock(p.rejection.at))}${p.rejection.note ? `. Note: ${esc(p.rejection.note)}` : ''}</p>`;
    return '';
  }

  function sheetFoot(p) {
    if (p.status === 'pending_approval') {
      const confirming = confirmFor('approve', p.id);
      const label = S.cloud ? 'Approve with passkey' : confirming ? 'Confirm approval' : 'Approve and apply';
      const fine = S.cloud
        ? `Your passkey signs this exact change, fingerprint <span class="fp">${esc(fingerprint(p.bindingHash))}</span>. It is applied and checked straight away, and you can undo it.`
        : `${confirming ? 'High risk: press Confirm approval to go ahead. ' : ''}It is applied and checked as soon as you approve, and you can undo it.`;
      const noting = S.noteOpen[p.id];
      return `<div class="sheet-foot">
        ${noting ? `<input class="note-input" data-note="${esc(p.id)}" maxlength="300" placeholder="Note for the record (optional)" aria-label="Note for ${esc(p.id)}" value="${esc(S.notes[p.id] || '')}">` : ''}
        <div class="decide">
          <button class="btn btn-sign${confirming ? ' is-confirm' : ''}" data-act="approve" data-id="${esc(p.id)}" data-risk="${esc(p.risk)}">${esc(label)}</button>
          <button class="btn" data-act="reject" data-id="${esc(p.id)}">Turn down</button>
        </div>
        <p class="fine">${fine}${noting ? '' : ` <button class="link" data-act="note-show" data-id="${esc(p.id)}">Add a note</button>`}</p>
      </div>`;
    }
    const canUndo = p.status === 'applied' && !p.rollbackOf && !p.rolledBackBy;
    if (!canUndo) return '';
    const a = accountById(p.accountId);
    const locked = isLive(a) && !a.access.open && !S.cloud;
    if (locked) return '<div class="sheet-foot"><p class="fine">Undoing a change on a live account needs an open change window.</p></div>';
    const confirming = confirmFor('undo', p.id);
    return `<div class="sheet-foot"><button class="btn btn-wide${confirming ? ' is-confirm' : ''}" data-act="undo" data-id="${esc(p.id)}">${S.cloud ? 'Undo with passkey' : confirming ? 'Confirm undo' : 'Undo this change'}</button><p class="fine">Undo puts back exactly what was there before, after the same checks.</p></div>`;
  }

  function sheetHtml(p) {
    const a = accountById(p.accountId);
    const many = accounts().length > 1;
    const insight = p.insight || {};
    const pending = p.status === 'pending_approval';
    let statusLine = '';
    if (!pending) {
      const cls = { applied: 'ok', approved: 'info', conflict: 'warn', verify_failed: 'bad', failed: 'bad', blocked: 'warn' }[p.status] || 'muted';
      statusLine = `<p class="state ${cls}">${stateText(p)}${p.status === 'applied' && p.verification && p.verification.status === 'passed' ? '. The account shows the new value.' : ''}</p>${p.error && p.status !== 'expired' ? `<p class="fine">${esc(p.error)}</p>` : ''}`;
    }
    const failed = (p.checks || []).filter((c) => c.status === 'fail');
    return `<div class="scrim" data-act="close-sheet"></div>
      <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" id="sheet-${esc(p.id)}" tabindex="-1">
        <div class="sheet-grab" aria-hidden="true"></div>
        <div class="sheet-head"><span class="kicker">${esc(p.id)}, ${esc(p.typeLabel)}${many && a ? `, ${esc(a.name)}` : ''}</span><button class="icon-btn" data-act="close-sheet" aria-label="Close">${ICON.close}</button></div>
        <div class="sheet-body">
          ${S.sheetFromLink ? `<p class="fine from-link">${ICON.chat}<span>You opened this from a link.</span></p>` : ''}
          <h2 class="sheet-title" id="sheet-title">${esc(headline(p))}</h2>
          <div class="sheet-meta">${insight.impact ? `<span class="impact">${typeof insight.impactMonthly === 'number' ? ICON.money : /fair_housing|landing_pages/.test(insight.skill || '') ? ICON.shield : ICON.check}${esc(insight.impact)}</span>` : ''}${riskChip(p.risk)}</div>
          ${statusLine ? `<div class="block">${statusLine}${signatureLine(p)}</div>` : ''}
          ${p.status === 'blocked' && failed.length ? `<div class="block callout is-warn">${esc(failed.map((c) => c.detail || c.label).join(' '))}</div>` : ''}
          <div class="block">${redline(p)}</div>
          <div class="block"><h3>Why</h3><p class="why">${esc(p.reason)}</p></div>
          ${insight.caution ? `<div class="block callout is-warn">${esc(insight.caution)}</div>` : ''}
          ${evidenceBlock(p)}
          ${insight.ai ? `<div class="block ai-note">${ICON.spark}<span>${esc(insight.ai)}</span></div>` : ''}
          ${pending ? liveNote(p) : ''}
          ${checksBlock(p)}
          <p class="fine block">${esc(p.summary)} Proposed by ${esc(byLine(p))}, ${esc(clock(p.createdAt))}.${pending ? ` Expires ${esc(clock(p.expiresAt))} if nobody decides.` : ''}</p>
        </div>
        ${sheetFoot(p)}
      </section>`;
  }

  function renderSheet() {
    document.body.classList.toggle('has-sheet', Boolean(S.sheet && S.data));
    if (!S.sheet || !S.data) {
      if (sheetEl.innerHTML) sheetEl.innerHTML = '';
      return;
    }
    const p = proposals().find((x) => x.id === S.sheet);
    if (!p) {
      sheetEl.innerHTML = '';
      return;
    }
    const body = sheetEl.querySelector('.sheet-body');
    const scroll = body ? body.scrollTop : 0;
    sheetEl.innerHTML = sheetHtml(p);
    const nb = sheetEl.querySelector('.sheet-body');
    if (nb) nb.scrollTop = scroll;
  }

  function openSheet(id, fromLink) {
    const p = proposals().find((x) => x.id === id);
    if (!p) {
      toast(`${id} is not in the recent list.`, true);
      return;
    }
    const first = S.sheet !== id;
    S.sheet = id;
    S.sheetFromLink = Boolean(fromLink);
    if (first) {
      try { history.pushState({ sheet: id }, ''); } catch (e) { /* ignore */ }
    }
    if (fromLink && p.status !== 'pending_approval') toast(`${p.id} is ${STATUS_WORDS[p.status] || String(p.status).replace(/_/g, ' ')}. Nothing to approve.`);
    renderSheet();
    const box = sheetEl.querySelector('.sheet');
    if (box && first) box.focus({ preventScroll: true });
  }

  function closeSheet(viaHistory) {
    if (!S.sheet) return;
    const id = S.sheet;
    S.sheet = null;
    S.sheetFromLink = false;
    S.confirm = null;
    renderSheet();
    if (!viaHistory && history.state && history.state.sheet) {
      try { history.back(); } catch (e) { /* ignore */ }
    }
    const card = document.getElementById(`card-${id}`) || document.getElementById(`row-${id}`);
    if (card) card.focus({ preventScroll: true });
    if (S.dirty) render();
  }

  // ---------- accounts ----------

  function modeChip(a) {
    return `<span class="mode mode-${esc(a.mode)}">${esc(MODE[a.mode] || a.mode)}</span>`;
  }

  function healthChips(a) {
    const ins = S.insights[a.id];
    const chips = [];
    if (!ins || (!ins.data && !ins.error)) chips.push('<span class="chip"><span class="dot"></span>Checking</span>');
    else if (!ins.data) chips.push('<span class="chip is-warn">Could not check</span>');
    else {
      const p = ins.data.pulse;
      if (p && !p.error) chips.push(p.alarms.length ? `<span class="chip is-urgent">${p.alarms.length} Pulse ${plural(p.alarms.length, 'alarm')}</span>` : '<span class="chip is-ok">Pulse quiet</span>');
      const w = ins.data.witness;
      if (w && !w.error) {
        const record = w.source === 'sandbox_change_history' ? 'its record' : 'Google';
        const label = { clean: `Matches ${record}`, attention: `Check ${record}`, alarm: 'Unapproved change', unavailable: 'No record to check' }[w.verdict] || w.verdict;
        const cls = { clean: 'is-ok', attention: 'is-warn', alarm: 'is-urgent' }[w.verdict] || '';
        chips.push(`<span class="chip ${cls}">${esc(label)}</span>`);
      }
    }
    const meta = S.auto && S.auto.accounts ? S.auto.accounts.find((x) => x.id === a.id) : null;
    if (meta) chips.push(meta.watched ? '<span class="chip is-info">Autopilot on</span>' : '<span class="chip">Autopilot off</span>');
    if (isLive(a)) chips.push(a.access.open ? `<span class="chip is-warn">Open until ${esc(clock(a.access.until))}</span>` : '<span class="chip">Read-only</span>');
    return chips.join('');
  }

  function accountsView(d) {
    const list = accounts();
    if (S.acct && accountById(S.acct)) return accountView(d, accountById(S.acct));
    return `${pausedBanner(d)}<div class="view-head"><h1>Accounts</h1><p>How each account is doing, and what Autopilot watches.</p></div>
      ${list.map((a) => `<button class="acct press" data-act="acct" data-id="${esc(a.id)}">
        <span class="acct-top"><span class="acct-name">${esc(a.name)}</span>${modeChip(a)}</span>
        <span class="acct-id">${esc(a.id)}, ${esc(NUMBERS[a.numbers] || '')}</span>
        <span class="acct-health">${healthChips(a)}</span>
      </button>`).join('')}
      ${list.length ? '' : '<div class="empty"><b>No accounts</b>Connect Google Ads with npm run gads:setup.</div>'}`;
  }

  function lockLine(a) {
    if (!isLive(a)) return `<div class="lockline"><span class="lock is-plain">${a.mode === 'sandbox' ? 'Practice account with made-up numbers. Changes still need your approval.' : 'Test account: changes are real in Google Ads but never spend money.'}</span></div>`;
    if (a.access.open) return `<div class="lockline"><span class="lock is-open">${ICON.unlock}Changes allowed until ${esc(clock(a.access.until))}</span><button class="btn btn-small" data-act="window-close" data-id="${esc(a.id)}">Lock now</button></div>`;
    return `<div class="lockline"><span class="lock">${ICON.lock}Read-only</span><button class="btn btn-small" data-act="window" data-id="${esc(a.id)}">Open change window</button></div>`;
  }

  function autopilotAccountBlock(a) {
    if (!ap()) return '';
    const meta = S.auto && S.auto.accounts ? S.auto.accounts.find((x) => x.id === a.id) : null;
    if (!meta) return '<div class="sec"><p class="fine">Loading Autopilot settings.</p></div>';
    const busy = S.settingsBusy === `acct:${a.id}`;
    return `<section class="sec"><div class="sec-head"><h2>Autopilot</h2></div><div class="list">
      <div class="set"><div class="set-text"><b>Watch this account</b><span>Hourly checks and a full review every morning. Every fix still needs your approval.</span></div>
        <button class="switch" role="switch" aria-checked="${meta.watched}" aria-label="Autopilot watches ${esc(a.name)}" data-act="ap-account" data-id="${esc(a.id)}"${busy ? ' disabled' : ''}></button></div>
      <div class="set is-stack"><div class="set-text"><b>Monthly spend target</b><span>Monthly pacing keeps spend near it. Leave empty for none.</span></div>
        <div class="inline"><input class="num-field" type="number" inputmode="decimal" min="10" step="10" placeholder="None" aria-label="Monthly target for ${esc(a.name)}" data-target="${esc(a.id)}" value="${meta.target ? esc(meta.target) : ''}"><button class="btn btn-small" data-act="ap-target" data-id="${esc(a.id)}">Save</button></div></div>
    </div></section>`;
  }

  function accountView(d, a) {
    const ins = S.insights[a.id] || {};
    const checked = ins.loading ? 'Checking now.' : ins.data ? `Checked ${ago(ins.data.checkedAt)}.` : 'Not checked yet.';
    return `${pausedBanner(d)}<button class="back" data-act="acct-back">${ICON.back}Accounts</button>
      <div class="view-head"><h1>${esc(a.name)}</h1><p>${esc(a.id)}, ${esc(NUMBERS[a.numbers] || MODE[a.mode] || '')}</p></div>
      ${lockLine(a)}
      ${autopilotAccountBlock(a)}
      <section class="sec"><div class="sec-head"><h2>Pulse</h2><button class="link" data-act="insights" data-id="${esc(a.id)}"${ins.loading ? ' disabled' : ''}>Check again</button></div>
        <p class="fine">${esc(checked)} Day-by-day checks a monthly report misses. Pulse never changes anything.</p>
        <div class="sec">${pulseHtml(ins)}</div></section>
      <section class="sec">${witnessHtml(a, ins)}</section>`;
  }

  // Pulse

  function stripChart(al) {
    const e = al.evidence;
    if (!e || !Array.isArray(e.dates) || !e.dates.length) return '';
    const n = e.dates.length;
    const W = 420;
    const H = 104;
    const leadTop = 8;
    const leadH = 22;
    const barTop = 42;
    const base = H - 6;
    const spend = al.kind === 'spend_spike' || al.kind === 'stopped_spending';
    const series = (spend ? e.cost : e.clicks).map((v) => Number(v) || 0);
    const max = Math.max(1, ...series);
    const slot = W / n;
    const bw = Math.max(3, slot * 0.58);
    const from = Math.min(Math.max(0, Number(e.highlightFrom) || 0), n);
    const warm = al.severity !== 'high';
    const parts = [`<rect class="band${warm ? ' warm' : ''}" x="${(from * slot).toFixed(1)}" y="0" width="${((n - from) * slot).toFixed(1)}" height="${H}" rx="4"/>`];
    for (let i = 0; i < n; i++) {
      const h = Math.max(series[i] > 0 ? 1.5 : 0, (series[i] / max) * (base - barTop));
      const x = i * slot + (slot - bw) / 2;
      const label = spend ? `${dayOf(e.dates[i])}: ${money(series[i])} spent` : `${dayOf(e.dates[i])}: ${series[i]} clicks, ${e.conversions[i]} leads`;
      parts.push(`<rect class="bar${i >= from ? (warm ? ' warm' : ' hot') : ''}" x="${x.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="1.5"><title>${esc(label)}</title></rect>`);
    }
    parts.push(`<line class="baseline" x1="0" x2="${W}" y1="${base}" y2="${base}"/>`);
    if (!spend) {
      const conv = e.conversions.map((v) => Number(v) || 0);
      const maxC = Math.max(1, ...conv);
      for (let i = 0; i < n; i++) {
        const cx = (i * slot + slot / 2).toFixed(1);
        if (conv[i] > 0) parts.push(`<circle class="lead" cx="${cx}" cy="${(leadTop + leadH - (conv[i] / maxC) * leadH).toFixed(1)}" r="3.2"/>`);
        else if (i >= from) parts.push(`<circle class="lead zero" cx="${cx}" cy="${leadTop + leadH}" r="3.6"/>`);
      }
    }
    const legend = spend ? '<span><span class="key"></span>Spend per day</span>' : `<span><span class="key"></span>Clicks per day</span><span><span class="key lead"></span>Leads</span>${al.kind === 'tracking_outage' ? '<span><span class="key zero"></span>No leads recorded</span>' : ''}`;
    return `<div class="figure"><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(spend ? `Daily spend for ${n} days.` : `Daily clicks and leads for ${n} days.`)} The highlighted days set off the alarm.">${parts.join('')}</svg>
      <div class="axis"><span>${esc(dayOf(e.dates[0]))}</span><span>${esc(dayOf(e.dates[n - 1]))}</span></div><div class="legend">${legend}</div></div>`;
  }

  function alarmHtml(al, i) {
    const key = `alarm:${al.id}:${al.campaignId}`;
    const open = i === 0 || S.open.has(key);
    return `<div class="alarm ${esc(al.severity)}">
      <p class="alarm-title"><span class="dot"></span><span>${esc(al.title)}</span></p>
      ${open ? `${al.odds ? `<span class="odds">Chance by luck: ${esc(al.odds)}</span>` : ''}<p class="alarm-detail">${esc(al.detail)}</p>${stripChart(al)}<ul class="steps fine">${(al.nextSteps || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : `<button class="link" data-act="fold" data-id="${esc(key)}">Show details</button>`}
    </div>`;
  }

  function pulseHtml(ins) {
    if (!ins.data) return ins.error ? `<p class="callout is-warn">${esc(ins.error)}</p>` : '<p class="fine">Reading the daily numbers.</p>';
    const p = ins.data.pulse;
    if (p.error) return `<p class="callout is-warn">Pulse could not run: ${esc(p.error)}</p>`;
    const notes = (p.notes || []).filter((t) => !/^Pulse never changes/.test(t)).map((t) => `<p class="fine">${esc(t)}</p>`).join('');
    if (!p.alarms.length) return `<div class="callout is-ok">No tracking outages, stalled campaigns, spend spikes or lead drops in the last ${esc(p.period.days)} days.</div>${notes}`;
    return `${p.alarms.map(alarmHtml).join('')}<div class="block">${notes}</div>`;
  }

  // the witness

  function ledger(w, recordName) {
    const W = 420;
    const H = 84;
    const pad = 10;
    const yTop = 14;
    const yBot = 70;
    const end = Date.parse(w.checkedAt);
    const start = end - w.days * 86_400_000;
    const x = (iso) => pad + Math.min(1, Math.max(0, (Date.parse(iso) - start) / (end - start))) * (W - 2 * pad);
    const parts = [];
    for (let i = 0; i <= w.days; i++) {
      const xi = (pad + (i / w.days) * (W - 2 * pad)).toFixed(1);
      parts.push(`<line class="tick${i === w.days ? ' today' : ''}" x1="${xi}" x2="${xi}" y1="${yTop - 5}" y2="${yTop + 5}"/><line class="tick${i === w.days ? ' today' : ''}" x1="${xi}" x2="${xi}" y1="${yBot - 5}" y2="${yBot + 5}"/>`);
    }
    parts.push(`<line class="lane" x1="${pad}" x2="${W - pad}" y1="${yTop}" y2="${yTop}"/><line class="lane" x1="${pad}" x2="${W - pad}" y1="${yBot}" y2="${yBot}"/>`);
    if (w.setup && w.setup.count && w.setup.from) {
      const a = x(w.setup.from);
      const b = x(w.setup.to || w.setup.from);
      parts.push(`<rect class="band-setup" x="${(Math.min(a, b) - 4).toFixed(1)}" y="${yBot - 6}" width="${Math.max(8, Math.abs(b - a) + 8).toFixed(1)}" height="12" rx="3"><title>${esc(`${w.setup.count} setup ${plural(w.setup.count, 'change')}`)}</title></rect>`);
    }
    for (const e of w.outside || []) parts.push(`<circle class="${isGoogleItself(e) ? 'mk-google' : 'mk-outside'}" cx="${x(e.at).toFixed(1)}" cy="${yBot}" r="4.6"><title>${esc(`${e.summary}. ${e.actor}, ${e.client}, ${clock(e.at)}`)}</title></circle>`);
    for (const m of w.matches || []) parts.push(`<line class="stitch" x1="${x(m.appliedAt).toFixed(1)}" y1="${yTop}" x2="${x(m.googleAt).toFixed(1)}" y2="${yBot}"/>`);
    for (const m of w.matches || []) parts.push(`<circle class="mk-ink" cx="${x(m.appliedAt).toFixed(1)}" cy="${yTop}" r="5"><title>${esc(`${m.proposalId} applied ${clock(m.appliedAt)}`)}</title></circle><circle class="mk-ink" cx="${x(m.googleAt).toFixed(1)}" cy="${yBot}" r="5"><title>${esc(`${recordName} recorded ${m.proposalId} at ${clock(m.googleAt)}`)}</title></circle>`);
    for (const m of w.missing || []) {
      const xm = x(m.appliedAt).toFixed(1);
      parts.push(`<line class="stub" x1="${xm}" x2="${xm}" y1="${yTop}" y2="${(yTop + yBot) / 2}"/><circle class="mk-caution" cx="${xm}" cy="${yTop}" r="5"><title>${esc(`${m.proposalId}: no entry yet`)}</title></circle>`);
    }
    for (const m of w.pending || []) {
      const xm = x(m.appliedAt).toFixed(1);
      parts.push(`<line class="stub wait" x1="${xm}" x2="${xm}" y1="${yTop}" y2="${(yTop + yBot) / 2}"/><circle class="mk-hollow" cx="${xm}" cy="${yTop}" r="5"><title>${esc(`${m.proposalId}: too recent to check`)}</title></circle>`);
    }
    for (const e of w.unexplained || []) {
      const xe = x(e.at).toFixed(1);
      parts.push(`<circle class="ring" cx="${xe}" cy="${yBot}" r="8.5"/><circle class="mk-stop" cx="${xe}" cy="${yBot}" r="5"><title>${esc(`Not approved: ${e.summary}, ${clock(e.at)}`)}</title></circle>`);
    }
    const legend = [];
    if ((w.matches || []).length) legend.push('<span><span class="key ink"></span>Approved and recorded</span>');
    if ((w.unexplained || []).length) legend.push('<span><span class="key stop"></span>Robot key, no approval</span>');
    if ((w.missing || []).length) legend.push('<span><span class="key missing"></span>No entry yet</span>');
    if ((w.outside || []).some((e) => !isGoogleItself(e))) legend.push('<span><span class="key outside"></span>A person or another tool</span>');
    if ((w.outside || []).some(isGoogleItself)) legend.push('<span><span class="key google"></span>Google itself</span>');
    if (w.setup && w.setup.count) legend.push('<span><span class="key setup"></span>Setup</span>');
    return `<div class="figure"><div class="axis"><span>Approved in Campaign Ops</span><span>Last ${esc(w.days)} days</span></div>
      <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`${w.robot.matched} of ${w.robot.total} robot changes match approvals. ${w.outsideCount} changes by others.`)}">${parts.join('')}</svg>
      <div class="axis"><span>Recorded by ${esc(recordName)}</span><span>Now</span></div>${legend.length ? `<div class="legend">${legend.join('')}</div>` : ''}</div>`;
  }

  function wItem(kind, textHtml, meta) {
    return `<li><span class="key ${kind}"></span><span>${textHtml}<span class="meta">${esc(meta)}</span></span></li>`;
  }

  function wBlock(title, cls, items, more) {
    if (!items.length) return '';
    return `<p class="wlist-title${cls ? ` ${cls}` : ''}">${esc(title)}</p><ul class="wlist">${items.join('')}</ul>${more > 0 ? `<p class="fine">And ${more} more.</p>` : ''}`;
  }

  function witnessHtml(a, ins) {
    const sandbox = a.mode === 'sandbox';
    const recordName = sandbox ? 'the sandbox' : 'Google';
    const head = `<div class="sec-head"><h2>${sandbox ? "Against the sandbox's own record" : "Against Google's own record"}</h2></div>`;
    if (!ins.data) return `${head}${ins.error ? `<p class="callout is-warn">${esc(ins.error)}</p>` : '<p class="fine">Reading the change history.</p>'}`;
    const w = ins.data.witness;
    if (w.error) return `${head}<p class="callout is-warn">Could not check: ${esc(w.error)}</p>`;
    const mark = { clean: '✓', attention: '!', alarm: '✕', unavailable: '?' }[w.verdict] || '?';
    const un = (w.unexplained || []).length;
    const miss = (w.missing || []).length;
    const verdictText = {
      clean: w.robot && w.robot.matched ? 'Every change made with the robot key matches an approval here.' : `No changes made with the robot key in the last ${w.days} days.`,
      attention: `${countWord(miss)} applied ${plural(miss, 'change has', 'changes have')} no entry in ${recordName}'s record yet.`,
      alarm: `${countWord(un)} ${plural(un, 'change was', 'changes were')} made with the robot key and ${plural(un, 'matches', 'match')} no approval. Check who has the key.`,
    }[w.verdict] || w.headline;
    const outsideLine = w.outsideCount ? `${countWord(w.outsideCount)} ${plural(w.outsideCount, 'change was', 'changes were')} made by people or other tools.` : '';
    let out = `${head}<p class="fine">${sandbox ? 'The sandbox keeps a change history the way Google Ads does.' : 'Google Ads keeps its own history of every change: who, with which tool, and when.'} Every change made with the robot key should match an approval here.</p>
      <div class="verdict ${esc(w.verdict)} block"><span class="seal" aria-hidden="true">${mark}</span><div><p>${esc(verdictText)}</p>${outsideLine && w.available ? `<span class="verdict-sub">${esc(outsideLine)}</span>` : ''}</div></div>`;
    if (!w.available) return out;
    const key = `ledger:${a.id}`;
    const open = S.open.has(key) || w.verdict === 'alarm';
    out += `<div class="block"><button class="fold-btn" data-act="fold" data-id="${esc(key)}" aria-expanded="${open}"><span class="grow">The last ${esc(w.days)} days, side by side</span>${ICON.chev}</button></div>`;
    if (!open) return out;
    out += `<div class="fold-panel">${ledger(w, recordName)}`;
    out += wBlock('Made with the robot key, with no approval', 'bad', (w.unexplained || []).map((e) => wItem('stop', esc(e.summary), `${clock(e.at)}, ${e.client}`)), 0);
    out += wBlock(`Applied here, not in ${recordName}'s record yet`, 'warn', (w.missing || []).map((m) => wItem('missing', `${esc(m.proposalId)}: ${esc(m.summary)}`, `Applied ${clock(m.appliedAt)}`)), 0);
    out += wBlock('Too recent to check', '', (w.pending || []).map((m) => wItem('outside', `${esc(m.proposalId)}: ${esc(m.summary)}`, `Applied ${clock(m.appliedAt)}. The record can take a few minutes.`)), 0);
    out += wBlock('Matched', '', (w.matches || []).slice(0, 5).map((m) => wItem('ink', `${esc(m.proposalId)}: ${esc(m.summary)}`, `Applied ${clock(m.appliedAt)}, recorded ${clock(m.googleAt)}${m.events > 1 ? `, ${m.events} entries` : ''}.`)), (w.matches || []).length - 5);
    out += wBlock('Made outside Campaign Ops', '', (w.outside || []).slice(0, 6).map((e) => wItem(isGoogleItself(e) ? 'google' : 'outside', esc(e.summary), `${e.actor}, ${e.client}, ${clock(e.at)}`)), (w.outsideCount || 0) - Math.min(6, (w.outside || []).length));
    if (w.setup && w.setup.count) out += `<p class="fine">${esc(w.setup.count)} ${plural(w.setup.count, 'change')} by the setup script are expected, so they do not count as unapproved.</p>`;
    if (w.note) out += `<p class="fine">${esc(w.note)}</p>`;
    return `${out}</div>`;
  }

  // ---------- activity ----------

  const AUDIT_LABELS = {
    proposal_created: 'Proposed',
    proposal_blocked: 'Stopped by a guardrail',
    approved: 'Approved',
    rejected: 'Turned down',
    apply_refused: 'Apply refused',
    conflict: 'Conflict found',
    apply_failed: 'Apply failed',
    applied: 'Applied and checked',
    verify_failed: 'Check after applying failed',
    rollback_requested: 'Undo requested',
    rolled_back: 'Undone',
    expired: 'Expired',
    kill_switch_on: 'Paused all changes',
    kill_switch_off: 'Resumed changes',
    tamper_detected: 'Tampering found',
    change_window_opened: 'Opened a change window',
    change_window_closed: 'Locked a live account early',
    setup_changes: 'Setup built the sample campaigns',
    passkey_added: 'Added a passkey',
    passkey_removed: 'Removed a passkey',
    connector_authorized: 'Allowed an AI app to connect',
    history_imported: 'Moved the history from the computer',
    autopilot_settings: 'Changed Autopilot settings',
  };

  function feedFiltered(feed) {
    if (S.filter === 'alerts') return feed.filter((f) => f.kind === 'alert' || f.kind === 'note');
    if (S.filter === 'changes') return feed.filter((f) => f.kind === 'found' || f.kind === 'applied' || f.kind === 'outcome');
    if (S.filter === 'reviews') return feed.filter((f) => f.kind === 'review');
    return feed;
  }

  function auditBlock(d) {
    const key = 'audit';
    const open = S.open.has(key);
    const rows = open
      ? `<div class="fold-panel"><div class="list">${d.audit.recent.map((e) => `<div class="row"><span class="row-ico">${esc(e.seq)}</span><span class="row-main"><span class="row-title">${esc(AUDIT_LABELS[e.type] || e.type)}${e.proposalId ? ` ${esc(e.proposalId)}` : ''}${e.details && e.details.account ? ` for ${esc(e.details.account)}` : ''}</span><span class="row-sub">${esc(e.actor)}, ${esc(clock(e.ts))}</span></span></div>`).join('')}</div></div>`
      : '';
    return `<div class="block"><button class="fold-btn" data-act="fold" data-id="audit" aria-expanded="${open}"><span class="dot ${d.audit.ok ? 'is-ok' : 'is-urgent'}"></span><span class="grow">${d.audit.ok ? `Audit chain intact across ${esc(d.audit.count)} entries` : `Audit chain broken: ${esc(d.audit.problem || 'unknown problem')}`}</span>${ICON.chev}</button>${rows}</div>`;
  }

  function signaturesBlock() {
    if (!S.cloud) return '';
    const sig = S.sigCheck;
    let result = '';
    if (sig) {
      const bad = sig.total - sig.valid;
      const allGood = sig.total === 1 ? 'The signature checks out.' : sig.total === 2 ? 'Both signatures check out.' : `All ${sig.total} signatures check out.`;
      result = sig.total ? `<p class="${bad ? 'state bad' : 'state ok'} quiet-line">${bad ? `${bad} of ${sig.total} ${plural(sig.total, 'signature does', 'signatures do')} not check out. The approvals show which.` : `✓ ${allGood}`}</p>` : '<p class="fine">No signed approvals yet.</p>';
    }
    return `<div class="block callout sig-box"><p>Every approval and undo carries a passkey signature over the exact change. The server keeps them and can check every one again.</p>${result}<div class="btns"><button class="btn btn-small" data-act="sig-check"${S.settingsBusy ? ' disabled' : ''}>${S.settingsBusy === 'sig-check' ? 'Checking' : 'Check every signature'}</button></div></div>`;
  }

  function activityView(d) {
    const a = ap();
    const feed = S.auto && S.auto.feed ? S.auto.feed : a && a.latest ? a.latest : [];
    const chip = (id, label) => `<button data-act="filter" data-id="${id}" aria-pressed="${S.filter === id}">${label}</button>`;
    let list = '';
    if (a) {
      const items = feedFiltered(feed);
      if (!items.length) list = `<div class="empty"><b>Nothing here yet</b>${S.filter === 'all' ? 'Autopilot writes down everything it notices, every hour.' : 'Try another filter.'}</div>`;
      else {
        let lastDay = '';
        const groups = [];
        let current = [];
        for (const f of items) {
          const dl = dayLabel(f.at);
          if (dl !== lastDay) {
            if (current.length) groups.push({ day: lastDay, items: current });
            current = [];
            lastDay = dl;
          }
          current.push(f);
        }
        if (current.length) groups.push({ day: lastDay, items: current });
        list = groups.map((g) => `<p class="day">${esc(g.day)}</p><div class="list">${g.items.map(feedRow).join('')}</div>`).join('');
      }
    } else {
      const decided = proposals().filter((p) => p.status !== 'pending_approval');
      list = decided.length ? `<div class="list">${decided.slice(0, 30).map(decisionRow).join('')}</div>` : '<div class="empty"><b>Nothing yet</b>Proposals and decisions show up here.</div>';
    }
    return `${pausedBanner(d)}<div class="view-head"><h1>Activity</h1><p>What Autopilot noticed and every decision, newest first.</p></div>
      ${a ? `<div class="seg" role="group" aria-label="Show">${chip('all', 'All')}${chip('alerts', 'Alerts')}${chip('changes', 'Changes')}${chip('reviews', 'Reviews')}</div>` : ''}
      <div class="sec">${list}</div>
      <section class="sec"><div class="sec-head"><h2>The record</h2></div>${auditBlock(d)}${signaturesBlock()}</section>`;
  }

  // ---------- settings ----------

  function sw(act, id, on, label, disabled) {
    return `<button class="switch" role="switch" aria-checked="${Boolean(on)}" aria-label="${esc(label)}" data-act="${act}"${id ? ` data-id="${esc(id)}"` : ''}${disabled ? ' disabled' : ''}></button>`;
  }

  function hourSelect(name, value, label) {
    let o = '';
    for (let h = 0; h < 24; h++) o += `<option value="${h}"${h === value ? ' selected' : ''}>${esc(hourLabel(h))}</option>`;
    return `<select class="select" data-set="${name}" aria-label="${esc(label)}">${o}</select>`;
  }

  function autopilotSettings() {
    const r = S.auto;
    if (!ap()) return '';
    if (!r) return '<section class="sec"><div class="sec-head"><h2>Autopilot</h2></div><p class="fine">Loading.</p></section>';
    const s = r.settings;
    const busy = Boolean(S.settingsBusy);
    const zones = ZONES.includes(s.timezone) ? ZONES : [s.timezone].concat(ZONES);
    const ai = r.ai.available ? `On. ${r.ai.callsToday} of ${r.ai.limit} checks used today, on the free plan.` : 'Not available here. Autopilot uses its rules; in the cloud the free AI double-checks searches and writes copy.';
    const groups = [
      { title: 'It watches for', kind: 'watch' },
      { title: 'It fixes, with your approval', kind: 'fix' },
    ];
    const skillsOpen = S.open.has('skills');
    const onCount = r.skills.filter((k) => s.skills[k.id]).length;
    return `<section class="sec"><div class="sec-head"><h2>Autopilot</h2></div><div class="list">
        <div class="set is-big"><div class="set-text"><b>${s.on ? 'Autopilot is on' : 'Autopilot is off'}</b><span>Checks every hour, reviews every morning, writes the fix and asks you before anything changes.</span></div>${sw(s.on ? 'ap-off' : 'ap-on', '', s.on, 'Autopilot', busy)}</div>
        <div class="set"><div class="set-text"><b>Daily review</b><span>The full check of every account.</span></div>${hourSelect('reviewHour', s.reviewHour, 'Daily review time')}</div>
        <div class="set"><div class="set-text"><b>Time zone</b><span>For the review and quiet hours.</span></div><select class="select" data-set="timezone" aria-label="Time zone">${zones.map((z) => `<option value="${esc(z)}"${z === s.timezone ? ' selected' : ''}>${esc(z.replace(/_/g, ' '))}</option>`).join('')}</select></div>
        <div class="set"><div class="set-text"><b>Quiet hours</b><span>${s.quiet.on ? `No buzzing from ${esc(hourLabel(s.quiet.from))} to ${esc(hourLabel(s.quiet.to))}. You get one summary after.` : 'Off: notifications come at any hour.'}</span></div>${sw('ap-quiet', '', s.quiet.on, 'Quiet hours', busy)}</div>
        ${s.quiet.on ? `<div class="set"><div class="set-text"><b>Quiet from and to</b></div><div class="inline">${hourSelect('quietFrom', s.quiet.from, 'Quiet hours start')}${hourSelect('quietTo', s.quiet.to, 'Quiet hours end')}</div></div>
        <div class="set"><div class="set-text"><b>Urgent alerts still ring</b><span>A broken page, broken tracking or risky ad copy.</span></div>${sw('ap-urgent', '', s.quiet.urgentAnyway, 'Urgent alerts during quiet hours', busy)}</div>` : ''}
        <div class="set"><div class="set-text"><b>Changes per review</b><span>Most proposals one review may make. Urgent ones always go through.</span></div><select class="select" data-set="maxPerRun" aria-label="Changes per review">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<option value="${n}"${n === s.maxPerRun ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="set"><div class="set-text"><b>Free AI</b><span>${esc(ai)}</span></div><span class="chip ${r.ai.available ? 'is-ok' : ''}">${r.ai.available ? 'On' : 'Rules only'}</span></div>
      </div>
      <div class="block"><button class="fold-btn" data-act="fold" data-id="skills" aria-expanded="${skillsOpen}"><span class="grow">What Autopilot does: ${onCount} of ${r.skills.length} skills on</span>${ICON.chev}</button></div>
      ${skillsOpen ? groups.map((g) => `<p class="group-title">${esc(g.title)}</p><div class="list">${r.skills.filter((k) => k.kind === g.kind).map((k) => `<div class="set"><div class="set-text"><b>${esc(k.name)}</b><span>${esc(k.does)}</span>${k.needs ? `<span class="tag">Needs: ${esc(k.needs)}</span>` : ''}</div>${sw('ap-skill', k.id, s.skills[k.id], k.name, busy)}</div>`).join('')}</div>`).join('') : ''}
    </section>`;
  }

  function notificationsSettings(d) {
    if (!S.cloud || !d.cloud) return '';
    const c = d.cloud;
    const busy = S.settingsBusy;
    const devices = (c.push && c.push.devices) || [];
    let body;
    if (!c.push || !c.push.publicKey) body = '<div class="set"><div class="set-text"><b>Not set up</b><span>Run npm run cloud:setup again on your computer.</span></div></div>';
    else if (!pushSupported()) {
      body = `<div class="set"><div class="set-text"><b>This device</b><span>${isIos() && !isInstalled() ? 'On iPhone, notifications work once Campaign Ops is on your Home Screen: tap Share, then Add to Home Screen, and open it from there.' : 'This browser cannot show notifications.'}</span></div></div>`;
    } else {
      body = `<div class="set"><div class="set-text"><b>This device</b><span>${S.pushHere ? 'Rings for changes to approve and real problems.' : 'Off.'}</span></div>${sw(S.pushHere ? 'push-off' : 'push-on', '', S.pushHere, 'Notifications on this device', Boolean(busy))}</div>
        ${S.pushHere ? `<div class="set"><div class="set-text"><b>Send a test</b><span>${devices.length ? `${countWord(devices.length)} ${plural(devices.length, 'device gets', 'devices get')} them: ${esc(devices.map((x) => x.device).join(', '))}.` : ''}</span></div><button class="btn btn-small" data-act="push-test"${busy ? ' disabled' : ''}>Send</button></div>` : ''}`;
    }
    return `<section class="sec"><div class="sec-head"><h2>Notifications</h2></div><div class="list">${body}</div></section>`;
  }

  function passkeySettings(d) {
    if (!S.cloud || !d.cloud) return '';
    const keys = d.cloud.passkeys || [];
    const busy = S.settingsBusy;
    return `<section class="sec"><div class="sec-head"><h2>Passkeys</h2></div>
      <div class="list keys">${keys
        .map((k) => {
          const confirming = confirmFor('passkey-remove', k.id);
          return `<div class="row"><span class="row-ico">${ICON.key}</span><span class="row-main"><span class="row-title">${esc(k.name)}</span><span class="row-sub">Added ${esc(shortDate(k.createdAt))}.${k.lastUsedAt ? ` Last used ${esc(clock(k.lastUsedAt))}.` : ''}</span></span>
            <span class="row-end">${keys.length > 1 ? `<button class="btn btn-small${confirming ? ' is-confirm' : ''}" data-act="passkey-remove" data-id="${esc(k.id)}"${busy ? ' disabled' : ''}>${confirming ? 'Remove with passkey' : 'Remove'}</button>` : ''}</span></div>`;
        })
        .join('')}</div>
      <div class="btns"><button class="btn btn-small" data-act="passkey-add"${busy ? ' disabled' : ''}>${busy === 'passkey-add' ? 'Waiting for your passkey' : 'Add a passkey on this device'}</button></div>
      ${keys.length === 1 ? '<p class="fine block">Add a second device so losing one never locks you out.</p>' : ''}</section>`;
  }

  function settingsView(d) {
    const theme = load(THEME_NAME) || 'system';
    const kill = d.killSwitch;
    const modes = accounts().map((a) => a.mode);
    const notes = [`Campaign Ops ${d.app.version}. Scope: ${d.scope}.`];
    if (modes.includes('sandbox')) notes.push('Sandbox data is made up.');
    if (modes.includes('google_ads_test')) notes.push('Google Ads test accounts never show ads, so their numbers are simulated.');
    if (modes.includes('google_ads')) notes.push('Live accounts stay read-only until you open a change window or sign a change.');
    notes.push('Fair Housing checks are a screening aid, not legal advice.');
    if (d.cloud && d.cloud.googleNote) notes.push(d.cloud.googleNote);
    const themeBtn = (id, label) => `<button data-act="theme" data-id="${id}" aria-pressed="${theme === id}">${label}</button>`;
    const where = DEMO ? 'A live demo on a made-up account. It runs in this browser and starts fresh when you reload.' : S.cloud && d.cloud ? `Signed in as ${esc(d.cloud.owner)}.` : 'On this computer.';
    if (DEMO) notes.push('In this demo the AI’s words are written in advance; in the cloud, Cloudflare’s free AI writes them. Everything else is the real engine.');
    const leave = DEMO
      ? '<button class="btn btn-small" data-act="demo-reset">Start the demo again</button><a class="btn btn-small" href="https://debashishkumarbora.github.io/" target="_blank" rel="noopener">Made by Debashish Kumar Bora</a>'
      : S.cloud
        ? `<button class="btn btn-small" data-act="signout"${S.settingsBusy ? ' disabled' : ''}>Sign out</button>`
        : '<button class="btn btn-small" data-act="forget-key">Forget the console key here</button>';
    return `${pausedBanner(d)}<div class="view-head"><h1>Settings</h1><p>${where}</p></div>
      ${autopilotSettings()}
      ${notificationsSettings(d)}
      ${passkeySettings(d)}
      <section class="sec"><div class="sec-head"><h2>Safety</h2></div><div class="list">
        <div class="set"><div class="set-text"><b>${kill.on ? 'All changes are paused' : 'Pause all changes'}</b><span>${kill.on ? 'Nothing can be applied until you resume.' : 'Stops every change at once. Proposals still come in for later.'}</span></div>${kill.on ? (kill.forcedByEnv ? '<span class="chip is-warn">Set on the server</span>' : `<button class="btn btn-small btn-sign" data-act="resume" data-id="all">${S.cloud ? 'Resume with passkey' : confirmFor('resume', 'all') ? 'Confirm resume' : 'Resume'}</button>`) : '<button class="btn btn-small btn-stop" data-act="pause" data-id="all">Pause all</button>'}</div>
      </div></section>
      <section class="sec"><div class="sec-head"><h2>Appearance</h2></div><div class="seg themes" role="group" aria-label="Theme">${themeBtn('system', 'Match device')}${themeBtn('light', 'Light')}${themeBtn('dark', 'Dark')}</div></section>
      <section class="sec"><div class="sec-head"><h2>About</h2></div><p class="fine">${esc(notes.join(' '))}</p>
        <div class="btns">${leave}</div></section>`;
  }

  // ---------- render ----------

  function viewHtml(d) {
    switch (S.view) {
      case 'approvals':
        return approvalsView(d);
      case 'accounts':
        return accountsView(d);
      case 'activity':
        return activityView(d);
      case 'settings':
        return settingsView(d);
      default:
        return homeView(d);
    }
  }

  function render() {
    const d = S.data;
    if (!d) return;
    S.dirty = false;
    root.dataset.view = S.view;
    root.innerHTML = frameHtml(d, viewHtml(d));
    const pending = pendingList();
    S.seen = new Set(pending.map((p) => p.id).concat(S.seen ? [...S.seen] : []));
    document.title = pending.length ? `(${pending.length}) Campaign Ops` : 'Campaign Ops';
    renderSheet();
  }

  function softRender() {
    if (isTyping()) S.dirty = true;
    else render();
  }

  function go(view, opts) {
    if (!VIEWS.includes(view)) view = 'home';
    S.view = view;
    if (!opts || !opts.keepAcct) S.acct = null;
    S.confirm = null;
    render();
    window.scrollTo(0, 0);
    if (view === 'activity' || view === 'settings' || view === 'accounts') loadAutopilot(false);
    if (view === 'accounts') loadAllInsights();
  }

  // ---------- the change window dialog ----------

  function sameName(a, b) {
    const n = (s) => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
    return n(a) !== '' && n(a) === n(b);
  }

  function hourOptions(max) {
    const opts = [1, 2, 4, 8].filter((h) => h <= max);
    if (!opts.includes(max)) opts.push(max);
    return opts;
  }

  function openModal(id) {
    if (!accountById(id)) return;
    S.modal = { accountId: id, hours: Math.min(2, maxWindowHours()), typed: '', error: '', busy: false, returnTo: document.activeElement };
    renderModal();
    const input = document.getElementById('dlg-confirm');
    if (input) input.focus();
  }

  function closeModal() {
    const back = S.modal && S.modal.returnTo;
    S.modal = null;
    renderModal();
    if (back && document.body.contains(back)) back.focus();
    if (S.dirty) render();
  }

  function renderModal() {
    const m = S.modal;
    const a = m && accountById(m.accountId);
    if (!m || !a) {
      S.modal = null;
      modalEl.innerHTML = '';
      return;
    }
    const ok = sameName(m.typed, a.name) && !m.busy;
    modalEl.innerHTML = `<div class="dialog-scrim" data-act="modal-close"></div>
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
        <h2 class="dialog-title" id="dlg-title">Open a change window</h2>
        <p class="lead-strong">${esc(a.name)} (${esc(a.id)}) is a live account that spends real money.</p>
        <p>While the window is open, changes you approve are applied. Each change still needs its own approval, and Pause all still stops everything.</p>
        <div class="hours" role="group" aria-label="How long">${hourOptions(maxWindowHours()).map((h) => `<button type="button" data-hours="${h}" aria-pressed="${h === m.hours}">${h} h</button>`).join('')}</div>
        <p class="until">Changes allowed until ${esc(untilText(Date.now() + m.hours * 3_600_000))}.</p>
        <label class="confirm-label" for="dlg-confirm">Type the account name to confirm<span>${esc(a.name)}</span></label>
        <input class="confirm-input" id="dlg-confirm" autocomplete="off" spellcheck="false" value="${esc(m.typed)}">
        ${m.error ? `<p class="dialog-error" role="alert">${esc(m.error)}</p>` : ''}
        <div class="dialog-actions">
          <button type="button" class="btn btn-sign" data-act="window-open"${ok ? '' : ' disabled'}>${m.busy ? 'Opening' : S.cloud ? 'Open with passkey' : 'Open change window'}</button>
          <button type="button" class="btn" data-act="modal-close">Cancel</button>
        </div>
      </div>`;
  }

  async function submitWindow() {
    const m = S.modal;
    if (!m || m.busy) return;
    const a = accountById(m.accountId);
    if (!a || !sameName(m.typed, a.name)) return;
    m.busy = true;
    m.error = '';
    renderModal();
    try {
      const proof = S.cloud ? await passkeyProof('open_window', m.accountId, { hours: m.hours }) : undefined;
      await api('POST', `/api/accounts/${encodeURIComponent(m.accountId)}/window`, { hours: m.hours, confirm: m.typed, proof });
      closeModal();
      toast(`Change window open for ${a.name}. Approved changes can be applied now.`);
      await refresh(true);
    } catch (e) {
      if (e.auth) {
        S.modal = null;
        renderModal();
        authLost(e.message);
        return;
      }
      m.busy = false;
      m.error = passkeyMessage(e);
      renderModal();
      const input = document.getElementById('dlg-confirm');
      if (input) input.focus();
    }
  }

  modalEl.addEventListener('click', (ev) => {
    const hours = ev.target.closest('[data-hours]');
    if (hours && S.modal) {
      S.modal.hours = Number(hours.dataset.hours);
      renderModal();
      const again = modalEl.querySelector(`[data-hours="${S.modal.hours}"]`);
      if (again) again.focus();
      return;
    }
    const btn = ev.target.closest('[data-act]');
    if (!btn) return;
    if (btn.dataset.act === 'modal-close') closeModal();
    if (btn.dataset.act === 'window-open') submitWindow();
  });

  modalEl.addEventListener('input', (ev) => {
    if (!S.modal || ev.target.id !== 'dlg-confirm') return;
    S.modal.typed = ev.target.value;
    const a = accountById(S.modal.accountId);
    const btn = modalEl.querySelector('[data-act="window-open"]');
    if (btn && a) btn.disabled = !(sameName(S.modal.typed, a.name) && !S.modal.busy);
  });

  modalEl.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && ev.target.id === 'dlg-confirm') {
      ev.preventDefault();
      submitWindow();
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape') return;
    if (S.modal) closeModal();
    else if (S.sheet) closeSheet(false);
  });

  // ---------- Pulse and witness data ----------

  async function loadInsights(id, refresh) {
    const cur = S.insights[id] || {};
    if (cur.loading) return;
    S.insights[id] = { data: cur.data, loading: true };
    softRender();
    try {
      const data = await api('GET', `/api/insights?account=${encodeURIComponent(id)}${refresh ? '&refresh=1' : ''}`);
      S.insights[id] = { data };
    } catch (e) {
      if (e.auth) {
        authLost(e.message);
        return;
      }
      S.insights[id] = { data: cur.data, error: e.message };
    }
    softRender();
  }

  async function loadAllInsights() {
    for (const a of accounts()) if (!S.insights[a.id]) await loadInsights(a.id, false);
  }

  /** When a change is applied, look again, so the witness shows it. */
  function noticeApplied(data) {
    const now = new Set();
    for (const p of data.proposals) if (p.appliedAt) now.add(`${p.id}|${p.accountId}|${p.appliedAt}`);
    if (S.applied) {
      const touched = new Set();
      now.forEach((k) => { if (!S.applied.has(k)) touched.add(k.split('|')[1]); });
      touched.forEach((accountId) => { if (S.insights[accountId]) setTimeout(() => loadInsights(accountId, false), 4000); });
    }
    S.applied = now;
  }

  // ---------- Autopilot ----------

  async function loadAutopilot(force) {
    if (!ap() || S.autoLoading) return;
    const a = ap();
    const sig = `${a.on}|${a.latest && a.latest[0] ? a.latest[0].id : ''}|${(a.running || []).join(',')}`;
    if (!force && S.auto && S.autoSig === sig) return;
    S.autoLoading = true;
    try {
      S.auto = await api('GET', '/api/autopilot');
      S.autoSig = sig;
    } catch (e) {
      if (e.auth) {
        S.autoLoading = false;
        authLost(e.message);
        return;
      }
    }
    S.autoLoading = false;
    softRender();
  }

  async function saveAutopilot(patch, busyKey, done) {
    if (S.settingsBusy) return;
    S.settingsBusy = busyKey || 'autopilot';
    softRender();
    try {
      S.auto = await api('POST', '/api/autopilot/settings', { settings: patch });
      if (done) toast(done);
    } catch (e) {
      if (e.auth) {
        S.settingsBusy = '';
        authLost(e.message);
        return;
      }
      toast(e.message, true);
    }
    S.settingsBusy = '';
    await refresh(true);
  }

  async function checkNow() {
    if (S.busy) return;
    S.busy = true;
    render();
    try {
      await api('POST', '/api/autopilot/check', {});
      toast(S.cloud ? 'Autopilot is checking now. Anything it finds lands in Approvals.' : 'Autopilot checked. Anything it found is in Approvals.');
    } catch (e) {
      if (e.auth) {
        S.busy = false;
        authLost(e.message);
        return;
      }
      toast(e.message, true);
    }
    S.busy = false;
    await refresh(true);
    loadAutopilot(true);
  }

  // ---------- actions ----------

  const SIGNED = { approve: 'approve', undo: 'undo', resume: 'resume_all' };
  const SETTINGS_ACTIONS = { 'push-on': 1, 'push-off': 1, 'push-test': 1, 'nudge-hide': 1, 'passkey-add': 1, 'passkey-remove': 1, 'sig-check': 1, signout: 1 };

  async function act(action, id, button) {
    switch (action) {
      case 'nav':
        if (button && button.dataset.seg) S.seg = button.dataset.seg;
        go(id);
        return;
      case 'open':
        openSheet(id, false);
        return;
      case 'close-sheet':
        closeSheet(false);
        return;
      case 'acct':
        S.acct = id;
        try { history.pushState({ view: 'accounts', acct: id }, ''); } catch (e) { /* ignore */ }
        render();
        window.scrollTo(0, 0);
        if (!S.insights[id]) loadInsights(id, false);
        loadAutopilot(false);
        return;
      case 'acct-back':
        if (history.state && history.state.acct) {
          history.back();
          return;
        }
        S.acct = null;
        render();
        return;
      case 'fold':
        if (S.open.has(id)) S.open.delete(id);
        else S.open.add(id);
        if (S.sheet && /^(checks|ev):/.test(id)) renderSheet();
        else render();
        return;
      case 'seg':
        S.seg = id;
        render();
        return;
      case 'filter':
        S.filter = id;
        render();
        return;
      case 'note-show':
        S.noteOpen[id] = true;
        renderSheet();
        {
          const input = sheetEl.querySelector(`input[data-note="${id}"]`);
          if (input) input.focus();
        }
        return;
      case 'insights':
        loadInsights(id, true);
        return;
      case 'window':
        openModal(id);
        return;
      case 'theme':
        setTheme(id);
        return;
      case 'forget-key':
        store(KEY_NAME, null);
        S.key = null;
        renderGate('');
        return;
      case 'demo-reset':
        location.reload();
        return;
      case 'ap-check':
        checkNow();
        return;
      case 'ap-on':
      case 'ap-off':
        saveAutopilot({ on: action === 'ap-on' }, 'autopilot', action === 'ap-on' ? 'Autopilot is on. It checks every hour and asks you before anything changes.' : 'Autopilot is off. Nothing is watched until you turn it back on.');
        return;
      case 'ap-quiet':
        saveAutopilot({ quiet: { on: !(S.auto && S.auto.settings.quiet.on) } });
        return;
      case 'ap-urgent':
        saveAutopilot({ quiet: { urgentAnyway: !(S.auto && S.auto.settings.quiet.urgentAnyway) } });
        return;
      case 'ap-skill':
        if (S.auto) saveAutopilot({ skills: { [id]: !S.auto.settings.skills[id] } });
        return;
      case 'ap-account': {
        const meta = S.auto && S.auto.accounts ? S.auto.accounts.find((x) => x.id === id) : null;
        if (meta) saveAutopilot({ accounts: { [id]: !meta.watched } }, `acct:${id}`);
        return;
      }
      case 'ap-target': {
        const input = root.querySelector(`input[data-target="${id}"]`);
        const raw = input ? input.value.trim() : '';
        saveAutopilot({ monthlyTargets: { [id]: raw ? Number(raw) : null } }, 'autopilot', raw ? `Monthly target saved: ${roundMoney(Number(raw))}.` : 'Monthly target removed.');
        return;
      }
      default:
    }
    if (SETTINGS_ACTIONS[action]) {
      settingsAction(action, id, button);
      return;
    }
    if (S.busy) return;
    // In the cloud the passkey prompt is the deliberate second step, so there is no extra Confirm click.
    const needsConfirm = !S.cloud && ((action === 'approve' && button && button.dataset.risk === 'high') || action === 'undo' || action === 'resume');
    if (needsConfirm && !confirmFor(action, id)) {
      S.confirm = { act: action, id };
      if (S.sheet) renderSheet();
      else render();
      return;
    }
    S.confirm = null;
    S.busy = true;
    if (button) button.disabled = true;
    try {
      const proof = S.cloud && SIGNED[action] ? await passkeyProof(SIGNED[action], action === 'resume' ? 'all' : id) : undefined;
      if (action === 'approve') {
        const res = await api('POST', `/api/proposals/${encodeURIComponent(id)}/approve`, { note: S.notes[id] || undefined, proof });
        delete S.notes[id];
        delete S.noteOpen[id];
        const signed = proof ? 'Approved and signed' : 'Approved';
        if (res.applied) toast(`${signed} ${id}. Applied and checked.`);
        else if (res.outcome && res.outcome.status === 'refused') toast(`${signed} ${id}. ${res.outcome.message.replace(/\s*Then apply again\.?$/, '')}`.trim());
        else if (res.outcome) toast(`${signed} ${id}, but it was not applied: ${res.outcome.message}`, true);
        else toast(`${signed} ${id}.`);
        closeSheet(false);
      } else if (action === 'reject') {
        await api('POST', `/api/proposals/${encodeURIComponent(id)}/reject`, { note: S.notes[id] || undefined });
        delete S.notes[id];
        toast(`Turned down ${id}.${proposals().find((p) => p.id === id && p.insight) ? ' Autopilot will not ask again for 30 days.' : ''}`);
        closeSheet(false);
      } else if (action === 'undo') {
        const res = await api('POST', `/api/proposals/${encodeURIComponent(id)}/undo`, { proof });
        if (res.ok) toast(`Undone. ${id} was reverted by ${res.rollback.id}.`);
        else toast(res.message || 'Undo did not complete.', true);
      } else if (action === 'pause') {
        await api('POST', '/api/kill-switch', { on: true });
        toast('All changes paused.');
      } else if (action === 'resume') {
        await api('POST', '/api/kill-switch', { on: false, proof });
        toast('Changes resumed.');
      } else if (action === 'window-close') {
        await api('POST', `/api/accounts/${encodeURIComponent(id)}/window/close`, {});
        const a = accountById(id);
        toast(`${a ? a.name : id} is read-only again.`);
      }
    } catch (e) {
      if (e.auth) {
        S.busy = false;
        authLost(e.message);
        return;
      }
      toast(passkeyMessage(e), true);
    } finally {
      S.busy = false;
    }
    await refresh(true);
  }

  function onClick(ev) {
    const btn = ev.target.closest('[data-act]');
    if (S.confirm && !(btn && btn.dataset.act === S.confirm.act && btn.dataset.id === S.confirm.id)) {
      S.confirm = null;
      if (!btn) {
        if (S.sheet) renderSheet();
        else render();
        return;
      }
    }
    if (!btn || btn.disabled) return;
    act(btn.dataset.act, btn.dataset.id, btn);
  }

  root.addEventListener('click', onClick);
  sheetEl.addEventListener('click', onClick);

  function onInput(ev) {
    const el = ev.target;
    if (el.matches && el.matches('input[data-note]')) S.notes[el.dataset.note] = el.value;
  }
  root.addEventListener('input', onInput);
  sheetEl.addEventListener('input', onInput);

  root.addEventListener('change', (ev) => {
    const el = ev.target;
    if (!el.matches || !el.matches('select[data-set]')) return;
    const v = el.value;
    const n = Number(v);
    const patch = {
      reviewHour: { reviewHour: n },
      timezone: { timezone: v },
      quietFrom: { quiet: { from: n } },
      quietTo: { quiet: { to: n } },
      maxPerRun: { maxPerRun: n },
    }[el.dataset.set];
    if (patch) saveAutopilot(patch);
  });

  root.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && ev.target.matches && ev.target.matches('input[data-target]')) {
      ev.preventDefault();
      act('ap-target', ev.target.dataset.target);
    }
  });

  function setTheme(pick) {
    store(THEME_NAME, pick === 'system' ? null : pick);
    const dark = pick === 'dark' || (pick === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0A0B14' : '#F3F4F9');
    render();
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (!load(THEME_NAME)) setTheme('system');
  });

  // ---------- sign-in: the console key on a computer ----------

  function renderGate(message) {
    stopPolling();
    sheetEl.innerHTML = '';
    root.innerHTML = `${DEFS}<main class="gate">
      <div>
        <p class="gate-mark">${brandMark()}Campaign Ops</p>
        <h1>Enter your console key</h1>
        <p>Run <code>npm run console</code> on the computer running Campaign Ops. It opens this page with your key filled in, and the browser remembers it.</p>
        <form id="gate-form" autocomplete="off">
          <label for="gate-key">Console key</label>
          <input id="gate-key" name="key" type="password" required minlength="16" spellcheck="false">
          <button class="btn btn-sign btn-wide" type="submit">Open</button>
        </form>
        ${message ? `<p class="error">${esc(message)}</p>` : ''}
      </div>
    </main>`;
    document.getElementById('gate-form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const value = document.getElementById('gate-key').value.trim();
      if (!value) return;
      S.key = value;
      store(KEY_NAME, value);
      refresh(true);
    });
    document.getElementById('gate-key').focus();
  }

  /** The page lost its sign-in: ask for the key again here, or the passkey in the cloud. */
  function authLost(message) {
    if (S.cloud) {
      const wasIn = Boolean(S.data);
      S.session = Object.assign({}, S.session, { signedIn: false });
      renderCloudGate(wasIn ? 'Your sign-in ended. Sign in again to carry on.' : '');
      return;
    }
    store(KEY_NAME, null);
    S.key = null;
    renderGate(message);
  }

  // ---------- passkeys ----------

  function b64urlToBuf(s) {
    const text = String(s).replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(text + '==='.slice((text.length + 3) % 4));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out.buffer;
  }

  function bufToB64url(buf) {
    const u = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < u.length; i++) bin += String.fromCharCode(u[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function passkeysSupported() {
    return Boolean(window.PublicKeyCredential && navigator.credentials && window.isSecureContext);
  }

  function credentialList(list) {
    return (list || []).map((c) => ({ type: 'public-key', id: b64urlToBuf(c.id), transports: c.transports }));
  }

  async function createPasskey(o) {
    const cred = await navigator.credentials.create({
      publicKey: {
        rp: o.rp,
        user: { id: b64urlToBuf(o.user.id), name: o.user.name, displayName: o.user.displayName },
        challenge: b64urlToBuf(o.challenge),
        pubKeyCredParams: o.pubKeyCredParams,
        timeout: o.timeout,
        attestation: o.attestation,
        authenticatorSelection: o.authenticatorSelection,
        excludeCredentials: credentialList(o.excludeCredentials),
      },
    });
    const r = cred.response;
    return {
      id: cred.id,
      rawId: bufToB64url(cred.rawId),
      type: cred.type,
      response: { clientDataJSON: bufToB64url(r.clientDataJSON), attestationObject: bufToB64url(r.attestationObject), transports: typeof r.getTransports === 'function' ? r.getTransports() : undefined },
    };
  }

  async function usePasskey(o) {
    const cred = await navigator.credentials.get({ publicKey: { challenge: b64urlToBuf(o.challenge), rpId: o.rpId, timeout: o.timeout, userVerification: o.userVerification, allowCredentials: credentialList(o.allowCredentials) } });
    const r = cred.response;
    return {
      id: cred.id,
      rawId: bufToB64url(cred.rawId),
      type: cred.type,
      response: { clientDataJSON: bufToB64url(r.clientDataJSON), authenticatorData: bufToB64url(r.authenticatorData), signature: bufToB64url(r.signature), userHandle: r.userHandle ? bufToB64url(r.userHandle) : null },
    };
  }

  /** A passkey signature for one action. The server decides what is signed: for an approval, the exact change. */
  async function passkeyProof(purpose, target, extra) {
    const o = await api('POST', '/api/passkey/options', Object.assign({ purpose, target }, extra || {}));
    const assertion = await usePasskey(o.options);
    return { challengeId: o.challengeId, assertion };
  }

  function passkeyMessage(e) {
    if (e && e.name === 'NotAllowedError') return 'The passkey was cancelled or timed out. Nothing was signed.';
    if (e && e.name === 'InvalidStateError') return 'This device already has a passkey for Campaign Ops.';
    if (e && e.name === 'SecurityError') return 'Passkeys need this page at its own https address.';
    return (e && e.message) || 'Something went wrong. Try again.';
  }

  function guessDevice() {
    const ua = navigator.userAgent || '';
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iPad';
    if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android phone' : 'Android tablet';
    if (/Macintosh/.test(ua)) return 'Mac';
    if (/Windows/.test(ua)) return 'Windows PC';
    if (/CrOS/.test(ua)) return 'Chromebook';
    if (/Linux/.test(ua)) return 'Linux computer';
    return 'This device';
  }

  function isIos() {
    const ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  }

  function isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  }

  async function postJson(path, body) {
    const res = await fetch(path, { method: 'POST', cache: 'no-store', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    let data = {};
    try { data = await res.json(); } catch (e) { /* empty body */ }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
    return data;
  }

  async function loadSession() {
    try {
      const res = await fetch('/auth/session', { cache: 'no-store', credentials: 'same-origin' });
      S.session = await res.json();
    } catch (e) {
      S.session = { signedIn: false, hasPasskeys: true, setupOpen: false, offline: true };
    }
  }

  // ---------- sign-in: passkeys in the cloud ----------

  function renderCloudGate(message) {
    stopPolling();
    S.data = null;
    S.booted = false;
    S.sig = '';
    S.auto = null;
    sheetEl.innerHTML = '';
    if (message !== undefined) S.gate.error = message;
    const s = S.session || {};
    const focus = S.pendingSheet ? `<p class="gate-note">${ICON.chat}<span>Sign in to see ${esc(S.pendingSheet)}.</span></p>` : '';
    let inner;
    if (s.offline) inner = '<h1>Cannot reach Campaign Ops</h1><p>Check your connection, then reload this page.</p>';
    else if (!passkeysSupported()) inner = '<h1>This browser cannot use passkeys</h1><p>Open this page in a current version of Safari, Chrome, Edge or Firefox.</p>';
    else if (!s.hasPasskeys || S.gate.mode === 'setup') {
      inner = s.setupOpen
        ? setupFormHtml(s)
        : `<h1>Setup is closed</h1><p>A setup code works once, for one hour. On your computer, in the campaign-ops-mcp folder, run:</p><p class="gate-cmd"><code>npm run cloud:code</code></p><p>It prints a new code. Then reload this page.</p>${s.hasPasskeys ? '<button class="link" type="button" data-gate="signin">Sign in with a passkey instead</button>' : ''}`;
    } else {
      inner = `<h1>Sign in to Campaign Ops</h1>
        <p>Your passkey signs you in. Every approval you give is signed by it too.</p>
        ${focus}
        <button class="btn btn-sign btn-wide" type="button" data-gate="login"${S.gate.busy ? ' disabled' : ''}>${S.gate.busy ? 'Waiting for your passkey' : 'Sign in with passkey'}</button>
        <p class="gate-fine">On a computer without your passkey, pick the option to use a phone, then scan the code with the phone that has it. Afterwards you can add this computer in Settings.</p>
        ${s.setupOpen ? '<button class="link" type="button" data-gate="setup">I have a setup code</button>' : ''}`;
    }
    root.innerHTML = `${DEFS}<main class="gate gate-cloud"><div><p class="gate-mark">${brandMark()}Campaign Ops</p>${inner}${S.gate.error ? `<p class="error" role="alert">${esc(S.gate.error)}</p>` : ''}</div></main>`;
    const first = root.querySelector('#setup-code');
    if (first && !first.value) first.focus();
  }

  function setupFormHtml(s) {
    return `<h1>${s.hasPasskeys ? 'Add a passkey with a setup code' : 'Set up your passkey'}</h1>
      <p>A passkey lives on this device and opens with your face, fingerprint or screen lock. Only it can approve changes, undo them, or unlock a live account.</p>
      <form id="setup-form" autocomplete="off" novalidate>
        <label for="setup-code">Setup code<span>Printed on your computer by npm run cloud:setup</span></label>
        <input id="setup-code" name="code" required autocapitalize="characters" autocomplete="one-time-code" spellcheck="false" maxlength="20">
        <label for="setup-name">Your name<span>Shown on every approval you sign</span></label>
        <input id="setup-name" name="name" required maxlength="40" autocomplete="given-name" value="${esc(s.owner || '')}">
        <label for="setup-device">This device</label>
        <input id="setup-device" name="device" required maxlength="40" value="${esc(guessDevice())}">
        <button class="btn btn-sign btn-wide" type="submit"${S.gate.busy ? ' disabled' : ''}>${S.gate.busy ? 'Waiting for your passkey' : 'Create passkey'}</button>
      </form>
      ${s.hasPasskeys ? '<button class="link" type="button" data-gate="signin">Sign in with a passkey instead</button>' : ''}`;
  }

  async function gateLogin() {
    if (S.gate.busy) return;
    S.gate.busy = true;
    S.gate.error = '';
    renderCloudGate();
    try {
      const o = await postJson('/auth/login/options', {});
      const assertion = await usePasskey(o.options);
      const done = await postJson('/auth/login/finish', { challengeId: o.challengeId, assertion });
      S.session = Object.assign({}, S.session, { signedIn: true, owner: done.owner });
      S.gate.busy = false;
      S.gate.mode = '';
      await refresh(true);
      return;
    } catch (e) {
      S.gate.error = passkeyMessage(e);
    }
    S.gate.busy = false;
    renderCloudGate();
  }

  async function gateSetup(form) {
    if (S.gate.busy) return;
    const code = form.elements.code.value.trim();
    const name = form.elements.name.value.trim();
    const device = form.elements.device.value.trim();
    if (!code || !name || !device) {
      S.gate.error = 'Fill in the setup code, your name and this device.';
      renderCloudGate();
      return;
    }
    S.gate.busy = true;
    S.gate.error = '';
    renderCloudGate();
    try {
      const o = await postJson('/auth/setup/options', { code, name });
      const credential = await createPasskey(o.options);
      const done = await postJson('/auth/setup/finish', { challengeId: o.challengeId, credential, device });
      S.session = { signedIn: true, owner: name, hasPasskeys: true, setupOpen: false };
      S.gate.busy = false;
      S.gate.mode = '';
      toast(`Passkey created on ${done.passkey}. You are signed in.`);
      await refresh(true);
      return;
    } catch (e) {
      S.gate.error = passkeyMessage(e);
    }
    S.gate.busy = false;
    renderCloudGate();
    const f = document.getElementById('setup-form');
    if (f) {
      f.elements.code.value = code;
      f.elements.name.value = name;
      f.elements.device.value = device;
    }
  }

  root.addEventListener('submit', (ev) => {
    if (ev.target && ev.target.id === 'setup-form') {
      ev.preventDefault();
      gateSetup(ev.target);
    }
  });

  root.addEventListener('click', (ev) => {
    const g = ev.target.closest('[data-gate]');
    if (!g) return;
    if (g.dataset.gate === 'login') gateLogin();
    if (g.dataset.gate === 'setup' || g.dataset.gate === 'signin') {
      S.gate.mode = g.dataset.gate === 'setup' ? 'setup' : '';
      S.gate.error = '';
      renderCloudGate();
    }
  });

  // ---------- notifications ----------

  let swReg = null;

  async function serviceWorker() {
    if (!('serviceWorker' in navigator)) return null;
    if (!swReg) swReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return swReg;
  }

  function pushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  async function checkPushHere() {
    if (!pushSupported()) {
      S.pushHere = false;
      return;
    }
    try {
      const reg = await serviceWorker();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      S.pushHere = Boolean(sub) && Notification.permission === 'granted';
    } catch (e) {
      S.pushHere = false;
    }
    if (S.data) softRender();
  }

  async function pushOn() {
    // Ask first, straight from the tap: Safari only shows the question then.
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error(permission === 'denied' ? 'Notifications are blocked for this site. Allow them in your browser or phone settings, then try again.' : 'Notifications were not turned on.');
    const key = S.data && S.data.cloud && S.data.cloud.push && S.data.cloud.push.publicKey;
    if (!key) throw new Error('Notifications are not set up on the server. Run npm run cloud:setup again on your computer.');
    const reg = await serviceWorker();
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64urlToBuf(key) });
    await api('POST', '/api/push/subscribe', { subscription: sub.toJSON(), device: guessDevice() });
    S.pushHere = true;
    store(NUDGE_NAME, 'done');
  }

  async function pushOff() {
    const reg = await serviceWorker();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) {
      await api('POST', '/api/push/unsubscribe', { endpoint: sub.endpoint });
      await sub.unsubscribe();
    }
    S.pushHere = false;
  }

  async function addPasskeyHere() {
    let o;
    try {
      o = await postJson('/auth/passkeys/add/options', {});
    } catch (e) {
      // Adding needs a fresh sign-in: sign in again, then carry on.
      if (!/Sign in again/.test(e.message)) throw e;
      toast('Confirm with a passkey you already have first.');
      const lo = await postJson('/auth/login/options', {});
      const assertion = await usePasskey(lo.options);
      await postJson('/auth/login/finish', { challengeId: lo.challengeId, assertion });
      o = await postJson('/auth/passkeys/add/options', {});
    }
    const credential = await createPasskey(o.options);
    const done = await postJson('/auth/passkeys/add/finish', { challengeId: o.challengeId, credential, device: guessDevice() });
    toast(`Passkey added on ${done.passkey}.`);
  }

  async function settingsAction(action, id, button) {
    if (action === 'nudge-hide') {
      store(NUDGE_NAME, 'hidden');
      render();
      return;
    }
    if (action === 'passkey-remove' && !confirmFor(action, id)) {
      S.confirm = { act: action, id };
      render();
      return;
    }
    if (S.settingsBusy) return;
    S.confirm = null;
    S.settingsBusy = action;
    if (button) button.disabled = true;
    try {
      if (action === 'signout') {
        await postJson('/auth/logout', {});
        S.settingsBusy = '';
        S.session = Object.assign({}, S.session, { signedIn: false });
        S.gate.mode = '';
        S.view = 'home';
        S.acct = null;
        S.sheet = null;
        S.sigCheck = null;
        renderCloudGate('');
        return;
      }
      if (action === 'push-on') {
        await pushOn();
        toast('Notifications are on for this device.');
      } else if (action === 'push-off') {
        await pushOff();
        toast('Notifications are off for this device.');
      } else if (action === 'push-test') {
        const r = await api('POST', '/api/push/test', {});
        toast(r.sent ? `Test sent to ${r.sent} ${plural(r.sent, 'device')}.` : 'The test did not go out. Turn notifications off and on again.', !r.sent);
      } else if (action === 'passkey-add') {
        await addPasskeyHere();
      } else if (action === 'passkey-remove') {
        const proof = await passkeyProof('remove_passkey', id);
        await api('POST', '/api/passkeys/remove', { id, proof });
        toast('Passkey removed.');
      } else if (action === 'sig-check') {
        const r = await api('GET', '/api/signatures');
        const byId = {};
        for (const x of r.signatures || []) byId[x.proposalId] = x;
        S.sigCheck = { total: r.total, valid: r.valid, byId };
      }
    } catch (e) {
      if (e.auth) {
        S.settingsBusy = '';
        authLost(e.message);
        return;
      }
      toast(passkeyMessage(e), true);
    }
    S.settingsBusy = '';
    await refresh(true);
  }

  // ---------- data, polling and links ----------

  function dataSignature(data) {
    const copy = Object.assign({}, data);
    delete copy.serverTime;
    return JSON.stringify(copy);
  }

  async function refresh(force) {
    if (!S.cloud && !S.key) return renderGate('');
    if (S.cloud && !(S.session && S.session.signedIn)) return renderCloudGate('');
    try {
      const data = await api('GET', '/api/state');
      const sig = dataSignature(data);
      const changed = sig !== S.sig;
      noticeApplied(data);
      S.data = data;
      S.sig = sig;
      const first = !S.booted;
      S.booted = true;
      if (first && !S.seen) S.seen = new Set(data.proposals.filter((p) => p.status === 'pending_approval').map((p) => p.id));
      if (force || first || ((changed || S.dirty) && !isTyping())) render();
      else if (changed) S.dirty = true;
      if (first) {
        if (S.pendingSheet) {
          const id = S.pendingSheet;
          S.pendingSheet = null;
          openSheet(id, true);
        }
        if (S.view === 'accounts') loadAllInsights();
      }
      if (S.view === 'activity' || S.view === 'settings' || S.view === 'accounts') loadAutopilot(false);
      startPolling();
    } catch (e) {
      if (e.auth) authLost(e.message);
      else toast(`Cannot reach Campaign Ops: ${e.message}`, true);
    }
  }

  function startPolling() {
    if (S.timer) return;
    S.timer = setInterval(() => {
      if (!document.hidden && !S.busy && !S.settingsBusy) refresh(false);
    }, S.pollMs);
  }

  function stopPolling() {
    clearInterval(S.timer);
    S.timer = null;
  }

  document.addEventListener('visibilitychange', () => {
    const signedIn = S.cloud ? Boolean(S.session && S.session.signedIn) : Boolean(S.key);
    if (!document.hidden && signedIn) refresh(false);
  });

  /**
   * #key=... comes from npm run console. #p=P-0007 comes from an approve link or a
   * notification and opens that proposal. #a=<account> opens an account. #approvals,
   * #activity and the other section names open that section.
   */
  function readHash() {
    const h = location.hash || '';
    const key = /(?:^|[#&])key=([A-Za-z0-9_-]+)/.exec(h);
    const p = /(?:^|[#&])p=(P-\d{4,})/.exec(h);
    const a = /(?:^|[#&])a=([A-Za-z0-9-]{3,40})/.exec(h);
    const v = /^#(home|approvals|accounts|activity|settings)$/.exec(h);
    if (key) {
      S.key = key[1];
      store(KEY_NAME, S.key);
    }
    let link = null;
    if (a) {
      S.view = 'accounts';
      S.acct = a[1];
    }
    if (v) {
      S.view = v[1];
      S.acct = null;
    }
    if (p) link = p[1];
    if (key || p || a || v) {
      try { history.replaceState(null, '', location.pathname); } catch (e) { /* ignore */ }
    }
    if (!S.key) S.key = load(KEY_NAME);
    return link;
  }

  window.addEventListener('hashchange', () => {
    const link = readHash();
    const signedIn = S.cloud ? Boolean(S.session && S.session.signedIn) : Boolean(S.key);
    if (!signedIn) {
      S.pendingSheet = link;
      if (S.cloud) renderCloudGate();
      return;
    }
    window.scrollTo(0, 0);
    // Fresh data first: a link or a notification is often about a proposal made seconds ago.
    refresh(true).then(() => {
      if (link) openSheet(link, true);
      if (S.acct && !S.insights[S.acct]) loadInsights(S.acct, false);
    });
  });

  window.addEventListener('popstate', (ev) => {
    const st = ev.state || {};
    if (S.sheet && !st.sheet) {
      closeSheet(true);
      return;
    }
    if (S.view === 'accounts' && S.acct && !st.acct) {
      S.acct = null;
      render();
    }
  });

  /** Asks the server which sign-in it uses, then starts. */
  async function boot() {
    S.pendingSheet = readHash();
    if (DEMO) {
      S.key = 'demo';
      refresh(true);
      return;
    }
    try {
      const res = await fetch('/mode', { cache: 'no-store' });
      const m = res.ok ? await res.json() : {};
      S.cloud = m.mode === 'cloud';
    } catch (e) {
      S.cloud = false;
    }
    if (!S.cloud) {
      refresh(true);
      return;
    }
    S.pollMs = CLOUD_POLL_MS;
    serviceWorker().then(checkPushHere).catch(() => undefined);
    await loadSession();
    if (S.session && S.session.signedIn) refresh(true);
    else renderCloudGate('');
  }

  boot();
})();
