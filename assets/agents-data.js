/* =====================================================================
   THE AGENT SERIES
   One list feeds the Agents section on the desktop site (index.html) and
   the Agent series block in the phone app (m/index.html).

   To add the next agent: copy the Campaign Ops entry, give it the next
   number, fill in its facts, and add its write-up page at
   agents/<slug>/index.html. Every fact here must be true and checkable.
   Paths are relative to the site root.
   ===================================================================== */
window.DKB_AGENTS = [
  {
    no: '01',
    k: 'campaignops',
    name: 'Campaign Ops',
    status: 'Live on the Google Ads API',
    line: 'Watches a Google Ads account around the clock, writes the fix, and makes the change only after a person approves it on their phone.',
    /* [number, label, short label for the phone app] */
    proof: [
      ['5', 'issues found in a real Google Ads test account', 'issues found'],
      ['3 min', 'from proposal to a verified change', 'to a verified change'],
      ['$0', 'spent. Test accounts cannot spend', 'spent'],
      ['115', 'automated tests behind it', 'automated tests']
    ],
    stack: ['MCP server', 'Claude', 'Google Ads API', 'Cloudflare', 'Passkeys', 'Workers AI'],
    /* the real change from the first live run, shown as a before and after */
    change: {
      id: 'P-0004',
      kind: 'Ad copy update',
      where: 'Ashgrove Commons | Search | Generic',
      lines: [
        { field: 'Headline 2', was: 'Ideal for Young Professionals', flag: 'age', now: 'Resort-Style Pool Community' },
        { field: 'Description 1', was: 'Quiet adults-only community near downtown with a resort-style pool.', flag: 'familial status', now: 'Resort-style pool and a prime downtown location. Studios and 1 bedrooms available.' }
      ],
      steps: ['Found', 'Drafted', 'Screened', 'Approved', 'Applied', 'Verified'],
      approved: 'Approved by a person at 5:08 AM IST',
      hash: '0dd8bc578a489204'
    },
    page: 'agents/campaign-ops/',
    demo: 'https://debashishkumarbora.github.io/campaign-ops/',
    repo: 'https://github.com/DebashishKumarBora/campaign-ops-mcp'
  }
];
