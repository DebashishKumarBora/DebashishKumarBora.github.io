/* A real Claude Desktop session with the Campaign Ops MCP server, recorded
   November 24, 2026 on the sandbox account. Text is lightly trimmed for length.
   Every number comes from the synthetic sandbox, not a real business. */
window.CAMPAIGN_OPS_REPLAY = [
  { t: 'you', text: 'Run a health check on my ad account. Explain the problems in plain English with dollar amounts, then propose the top 3 fixes.' },
  { t: 'tools', items: [['list_accounts', '1 account'], ['run_diagnostics', '5 findings'], ['check_ad_copy', 'looks good'], ['propose_change', 'P-0001'], ['propose_change', 'P-0002'], ['propose_change', 'P-0003']] },
  {
    t: 'claude',
    html:
      '<p><strong>Health check: Demo Property Group (Sandbox)</strong></p>' +
      '<p>This is a sandbox account with synthetic data, covering Oct 25 to Nov 23. Over that period it spent $5,731.62, got 3,002 clicks and 198 leads, at an average of $28.95 per lead. Five problems turned up. None of the fixes below are live yet, because each needs a person to approve it first.</p>' +
      '<h4>The problems in plain English</h4>' +
      '<table><thead><tr><th>#</th><th>Problem</th><th>Dollars</th></tr></thead><tbody>' +
      '<tr><td>F1</td><td>Ashgrove ad says "adults-only community" and "Ideal for Young Professionals"</td><td>Legal exposure</td></tr>' +
      '<tr><td>F2</td><td>Juniper Yard pays for job, storage and cleaning searches</td><td>$360/mo wasted</td></tr>' +
      '<tr><td>F3</td><td>Ashgrove Display spent 30 days with zero leads</td><td>$592/mo wasted</td></tr>' +
      '<tr><td>F4</td><td>Ashgrove Search pays for "apartment hotel nightly" and job searches</td><td>$131/mo wasted</td></tr>' +
      '<tr><td>F5</td><td>Northlight Lofts converts at $18.13 per lead but loses 38% of impressions to budget</td><td>Up to $300/mo of good spend</td></tr>' +
      '</tbody></table>' +
      '<h4>Top 3 fixes, proposed and awaiting approval</h4>' +
      '<table><thead><tr><th>Proposal</th><th>Fix</th><th>Risk</th></tr></thead><tbody>' +
      '<tr><td>P-0001</td><td>Rewrite the Ashgrove ad. The compliance exposure outweighs the dollar items, and the new copy passed the Fair Housing screen.</td><td>Medium</td></tr>' +
      '<tr><td>P-0002</td><td>Pause Ashgrove Display, the single biggest waste</td><td>High</td></tr>' +
      '<tr><td>P-0003</td><td>Add 5 negative keywords to Juniper Yard. None would block a converting search.</td><td>Low</td></tr>' +
      '</tbody></table>' +
      '<p><strong>Check before approving P-0002.</strong> If that Display campaign is meant for awareness rather than leads, zero conversions may be expected.</p>' +
      '<p><strong>Don\'t exclude these searches.</strong> "wheelchair accessible apartments" ($44), "section 8 apartments" ($49) and "family friendly apartments" ($52) had no conversions, but excluding them could keep those groups from seeing your ads. Improving the landing pages is the safer route.</p>' +
      '<p>A person must approve each proposal in the Campaign Ops approval console. Once approved, tell me and I\'ll apply them.</p>',
  },
  { t: 'note', text: 'Deb approves all three in the approval console' },
  { t: 'you', text: 'I approved them. Apply the changes and confirm they went through.' },
  { t: 'tools', items: [['apply_change', 'P-0001 applied, verified'], ['apply_change', 'P-0002 applied, verified'], ['apply_change', 'P-0003 applied, verified']] },
  {
    t: 'claude',
    html:
      '<p>All three changes went through. Each was approved in the console, applied, and then read back from the account to confirm it matched.</p>' +
      '<table><thead><tr><th>Proposal</th><th>Change</th><th>Verification</th></tr></thead><tbody>' +
      '<tr><td>P-0001</td><td>Rewrote ad a-3011 (Ashgrove Commons | Search | Generic)</td><td>Passed</td></tr>' +
      '<tr><td>P-0002</td><td>Paused Ashgrove Commons | Display | Prospecting</td><td>Passed</td></tr>' +
      '<tr><td>P-0003</td><td>Added 5 negative keywords to Juniper Yard | Search | Generic</td><td>Passed</td></tr>' +
      '</tbody></table>' +
      '<p>Headline 2 changed from "Ideal for Young Professionals" to "Resort-Style Pool Community", and "adults-only" is gone from the first description. Together, the pause and the negatives should save about $952 per month, based on last month\'s spend. Check the actual numbers in a week or two.</p>' +
      '<p>If you change your mind on any of these, I can roll it back with request_rollback, which needs a new approval.</p>',
  },
];
