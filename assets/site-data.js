/* Shared facts for the mobile app (m/index.html). Generated from index.html, so both versions say the same thing.
   If you change a project or a fact on the desktop page, change it here too. */
window.SITE={
 "name": "Debashish Kumar Bora",
 "short": "Debashish Bora",
 "role": "AI agents and live dashboards for marketing teams",
 "calendly": "https://calendly.com/debashishbora/30min",
 "email": "debashishbora30@gmail.com",
 "whatsapp": "https://wa.me/917002820482?text=Hi%20Deb,%20I'd%20like%20to%20discuss%20a%20dashboard%20project",
 "linkedin": "https://www.linkedin.com/in/debashish-kumar-bora-367845159/",
 "github": "https://github.com/DebashishKumarBora",
 "stats": [
  [
   "£3M+",
   "Ads budget a year"
  ],
  [
   "100+",
   "Ad accounts"
  ],
  [
   "8",
   "Brands"
  ],
  [
   "4+",
   "Years, US & UK"
  ]
 ],
 "projects": [
  {
   "k": "adsintel",
   "s": "Ask anything about 16 ad accounts in plain English. Get tables, charts and a fix list.",
   "t": "Ads Intelligence",
   "shots": [
    "shots/intel-1.webp",
    "shots/intel-2.webp",
    "shots/intel-3.webp",
    "shots/intel-4.webp",
    "shots/intel-5.webp",
    "shots/intel-6.webp"
   ],
   "tool": "Apps Script + Claude",
   "tag": [
    "agent"
   ],
   "file": "shots/intel-1.webp",
   "live": "https://debashishkumarbora.github.io/demos/ads-intelligence/",
   "repo": null,
   "p": "A team running 16 Google Ads accounts paid for reporting tools and still worked out what to fix by hand.",
   "b": "A Claude-style chat over every account, plus nine tools (ad copy, sitelinks, recaps, why did it change, search term themes, a heatmap, negatives, budget pacing, landing page checks), daily alerts and a 24 check audit. Read only, with Fair Housing guardrails.",
   "r": "Plain English questions answered with tables, charts and a fix list, with every number traced to the query behind it.",
   "mshots": [
    "mshots/adsintel-1.webp",
    "mshots/adsintel-2.webp",
    "mshots/adsintel-3.webp",
    "mshots/adsintel-4.webp"
   ],
   "cover": "covers/adsintel.webp"
  },
  {
   "k": "perf",
   "s": "A year over year ads review that writes itself, then turns into slides in one click.",
   "t": "Performance Review",
   "shots": [
    "shots/perf-1.webp",
    "shots/perf-2.webp",
    "shots/perf-3.webp",
    "shots/perf-4.webp",
    "shots/perf-5.webp",
    "shots/perf-6.webp"
   ],
   "tool": "Apps Script + Claude",
   "tag": [
    "agent"
   ],
   "file": "shots/perf-1.webp",
   "live": "https://debashishkumarbora.github.io/demos/performance-review/",
   "repo": null,
   "p": "A year over year Google Ads review across 16 communities meant days of exports, pivots and slides.",
   "b": "A review that builds itself for any period and comparison: at a glance, spend, results, what went well, limited results, recommendations, every community side by side, a context log and a next year ideas board.",
   "r": "One click Present mode turns it into slides, exportable as PDF, with written findings that never point blame at a person.",
   "mshots": [
    "mshots/perf-1.webp",
    "mshots/perf-2.webp",
    "mshots/perf-3.webp",
    "mshots/perf-4.webp"
   ],
   "cover": "covers/perf.webp"
  },
  {
   "k": "clients",
   "s": "Every client gets a private link with only their own results and a swipeable recap.",
   "t": "Client Reports",
   "shots": [
    "shots/client-1.webp",
    "shots/client-2.webp",
    "shots/client-3.webp",
    "shots/client-4.webp",
    "shots/client-5.webp",
    "shots/client-6.webp"
   ],
   "tool": "Apps Script",
   "tag": [
    "agent"
   ],
   "file": "shots/client-1.webp",
   "live": "https://debashishkumarbora.github.io/demos/client-reports/",
   "repo": null,
   "p": "Property clients wanted their own Google Ads results without seeing other clients or internal notes.",
   "b": "One link with a different password per client, showing only that client: highlights, a swipeable recap, top campaign, best day, devices, live ads and top searches, with a PDF cover page.",
   "r": "Client ready reports with no manual prep, where every comparison reads as true good news and dips are flagged to the team privately.",
   "mshots": [
    "mshots/clients-1.webp",
    "mshots/clients-2.webp",
    "mshots/clients-3.webp",
    "mshots/clients-4.webp"
   ],
   "cover": "covers/clients.webp"
  },
  {
   "k": "campaignops",
   "s": "An AI agent that watches Google Ads around the clock and fixes it, but only after you approve on your phone.",
   "t": "Campaign Ops",
   "shots": [
    "shots/cops-1.webp",
    "shots/cops-2.webp",
    "shots/cops-3.webp",
    "shots/cops-4.webp",
    "shots/cops-5.webp",
    "shots/cops-6.webp"
   ],
   "tool": "MCP + Claude",
   "tag": [
    "agent"
   ],
   "file": "shots/cops-1.webp",
   "live": "https://debashishkumarbora.github.io/campaign-ops/",
   "repo": "https://github.com/DebashishKumarBora/campaign-ops-mcp",
   "p": "AI agents can read a Google Ads account, but no team would let one change budgets or ad copy without limits, a person approving it, and an undo.",
   "b": "A connector (MCP server) that lets AI apps like Claude work on Google Ads safely. Every change is proposed, checked against budget limits and Fair Housing rules, dry run, approved by a person, applied, verified and logged, with one click undo. It runs on Cloudflare's free plan, where Autopilot checks the account every hour, writes each fix, and every approval is signed with a passkey on a phone.",
   "r": "Now live on the Google Ads API. In a real Google Ads test account it found an ad that broke Fair Housing rules, rewrote it, waited for a person to approve, then made the change and confirmed it with Google. It is Agent 01 in the Agent series.",
   "mshots": [
    "mshots/campaignops-1.webp",
    "mshots/campaignops-2.webp",
    "mshots/campaignops-3.webp",
    "mshots/campaignops-4.webp"
   ],
   "cover": "covers/campaignops.webp"
  },
  {
   "k": "ads",
   "s": "Sixteen Google Ads accounts in one web app, with a Claude analyst on top.",
   "t": "AdCommand",
   "shots": [
    "shots/ads-1.webp",
    "shots/ads-2.webp",
    "shots/ads-3.webp",
    "shots/ads-4.webp",
    "shots/ads-5.webp",
    "shots/ads-6.webp"
   ],
   "tool": "Google Ads API + Claude",
   "tag": [
    "app"
   ],
   "file": "shots/ads-1.webp",
   "live": "https://script.google.com/macros/s/AKfycbxLdJehYqxPBmTLfTtMUhkcnE7OGgTpFx1iCNVaQD4TBOuvsmEN_n9KvrywxJ1Aq4dW/exec",
   "repo": "https://github.com/DebashishKumarBora/ads-command-center",
   "p": "Sixteen Google Ads accounts lived in sixteen browser tabs, with no single place to see what was working.",
   "b": "A Google Ads command center on the live API: accounts, analytics, a geo view, search terms, keywords, ads, budget pacing and a Claude analyst with chat and voice.",
   "r": "The whole portfolio in one web app, with the AI analyst flagging what to fix first.",
   "cover": "covers/ads.webp"
  },
  {
   "k": "hub",
   "s": "Ads, analytics, reviews, search and leasing data in one view, with an AI operator.",
   "t": "Marketing Intelligence Hub",
   "shots": [
    "shots/hub-1.webp",
    "shots/hub-2.webp",
    "shots/hub-3.webp",
    "shots/hub-4.webp",
    "shots/hub-5.webp",
    "shots/hub-6.webp"
   ],
   "tool": "Apps Script + AI",
   "tag": [
    "app"
   ],
   "file": "shots/hub-1.webp",
   "live": "https://debashishkumarbora.github.io/demos/property-marketing-intelligence-hub/",
   "repo": "https://github.com/DebashishKumarBora/property-marketing-intelligence-hub",
   "p": "A marketing lead had spend, leads, occupancy and reviews scattered across six different tools.",
   "b": "One control room unifying Google Ads, GA4, Business Profile, Search Console and leasing data, with an AI operator that answers questions in plain English.",
   "r": "Every channel, community and alert in a single portfolio view, with wasted spend and occupancy strategy surfaced automatically.",
   "mshots": [
    "mshots/hub-1.webp",
    "mshots/hub-2.webp",
    "mshots/hub-3.webp",
    "mshots/hub-4.webp"
   ],
   "cover": "covers/hub.webp"
  },
  {
   "k": "lease",
   "s": "Prospect to signed lease, live from Snowflake, with an AI analyst grading health.",
   "t": "Leasing Dashboard",
   "shots": [
    "shots/lease-1.webp",
    "shots/lease-2.webp",
    "shots/lease-3.webp",
    "shots/lease-4.webp",
    "shots/lease-5.webp",
    "shots/lease-6.webp"
   ],
   "tool": "Apps Script + Snowflake",
   "tag": [
    "app"
   ],
   "file": "shots/lease-1.webp",
   "live": "https://debashishkumarbora.github.io/demos/snowflake-leasing-dashboard/",
   "repo": "https://github.com/DebashishKumarBora/snowflake-leasing-dashboard",
   "p": "Leasing performance lived in raw Snowflake tables that no one on the team could read.",
   "b": "A live funnel from prospect to signed lease, plus occupancy, renewals, speed to lead and an availability board matched against demand.",
   "r": "The whole leasing operation in one view, with an AI analyst grading health and returning a prioritized plan.",
   "mshots": [
    "mshots/lease-1.webp",
    "mshots/lease-2.webp",
    "mshots/lease-3.webp",
    "mshots/lease-4.webp"
   ],
   "cover": "covers/lease.webp"
  },
  {
   "k": "ga4",
   "s": "Which channels and communities actually drive leads, across 16 communities.",
   "t": "Analytics Dashboard (GA4)",
   "shots": [
    "shots/ga4-1.webp",
    "shots/ga4-2.webp",
    "shots/ga4-3.webp",
    "shots/ga4-4.webp",
    "shots/ga4-5.webp",
    "shots/ga4-6.webp"
   ],
   "tool": "Apps Script + GA4",
   "tag": [
    "app"
   ],
   "file": "shots/ga4-1.webp",
   "live": "https://debashishkumarbora.github.io/demos/ga4-analytics-dashboard/",
   "repo": "https://github.com/DebashishKumarBora/ga4-analytics-dashboard",
   "p": "The team could not tell which channels and which communities actually drove leads.",
   "b": "A GA4-powered dashboard covering sessions, acquisition, engagement, conversions and audience across 16 communities.",
   "r": "Cross-channel performance at a glance, with a conversion tracking break at one community caught by the AI analyst.",
   "mshots": [
    "mshots/ga4-1.webp",
    "mshots/ga4-2.webp",
    "mshots/ga4-3.webp",
    "mshots/ga4-4.webp"
   ],
   "cover": "covers/ga4.webp"
  },
  {
   "k": "gbp",
   "s": "Rating, reviews and listing health across every Business Profile, with AI reply drafts.",
   "t": "Reviews Dashboard (Business Profile)",
   "shots": [
    "shots/gbp-1.webp",
    "shots/gbp-2.webp",
    "shots/gbp-3.webp",
    "shots/gbp-4.webp",
    "shots/gbp-5.webp",
    "shots/gbp-6.webp"
   ],
   "tool": "Apps Script + AI",
   "tag": [
    "app"
   ],
   "file": "shots/gbp-1.webp",
   "live": "https://debashishkumarbora.github.io/demos/gbp-reviews-dashboard/",
   "repo": "https://github.com/DebashishKumarBora/gbp-reviews-dashboard",
   "p": "Dozens of Google Business Profiles with no single view of rating, reviews or profile health.",
   "b": "A command center for listings audit, review management and performance, with an AI analyst that drafts replies and surfaces recurring themes.",
   "r": "Rating, review velocity and health across every listing, with unanswered negatives caught fast.",
   "mshots": [
    "mshots/gbp-1.webp",
    "mshots/gbp-2.webp",
    "mshots/gbp-3.webp",
    "mshots/gbp-4.webp"
   ],
   "cover": "covers/gbp.webp"
  },
  {
   "k": "gsc",
   "s": "Clicks, rankings and the exact queries and pages behind organic search.",
   "t": "Search Console Dashboard",
   "shots": [
    "shots/gsc-1.webp",
    "shots/gsc-2.webp",
    "shots/gsc-3.webp",
    "shots/gsc-4.webp",
    "shots/gsc-5.webp"
   ],
   "tool": "Apps Script + Search Console",
   "tag": [
    "app"
   ],
   "file": "shots/gsc-1.webp",
   "live": "https://debashishkumarbora.github.io/demos/search-console-dashboard/",
   "repo": "https://github.com/DebashishKumarBora/search-console-dashboard",
   "p": "Organic search data sat inside Search Console, unread and unactioned.",
   "b": "A clean dashboard for clicks, impressions, CTR and average position, with top queries, top pages and a device split.",
   "r": "Organic performance and the exact queries and pages driving it, in one trend-led view.",
   "mshots": [
    "mshots/gsc-1.webp",
    "mshots/gsc-2.webp",
    "mshots/gsc-3.webp",
    "mshots/gsc-4.webp"
   ],
   "cover": "covers/gsc.webp"
  },
  {
   "t": "Client Campaign Performance",
   "s": "121M+ impressions, 2.1M clicks and 86K conversions, paid and organic in one view.",
   "tool": "Looker Studio",
   "tag": [
    "looker"
   ],
   "file": "client-campaign-performance.png",
   "live": null,
   "repo": "https://github.com/DebashishKumarBora",
   "p": "A travel client needed paid and organic performance in one place, across millions of impressions.",
   "b": "Looker Studio dashboard blending Google Ads + Search Console: KPIs, Brand vs Generic keywords, match-type performance and location insights.",
   "r": "Surfaced 121M+ impressions, 2.1M clicks & 86K conversions, with clear wins in low-CTR, cost-heavy queries.",
   "k": "ccp",
   "cover": "covers/ccp.webp"
  },
  {
   "t": "GA4 Traffic Analytics",
   "s": "157K sessions mapped by channel, device and the landing pages that convert.",
   "tool": "Looker Studio",
   "tag": [
    "looker"
   ],
   "file": "ga4-traffic-analytics.png",
   "live": null,
   "repo": "https://github.com/DebashishKumarBora",
   "p": "The team could not tell where quality traffic came from, or how engagement was trending.",
   "b": "GA4-powered Looker Studio dashboard: channel performance (paid vs organic), device split, landing-page conversions and YoY/MoM views.",
   "r": "Mapped 157K sessions & 70K users, revealing 79.7% mobile traffic and the pages actually converting.",
   "k": "gta",
   "cover": "covers/gta.webp"
  }
 ],
 "brands": [
  {
   "n": "Southall Travel",
   "sector": "Travel · UK",
   "desc": "One of the UK's largest travel agencies, paid search at scale.",
   "budget": "£1.5M+/yr",
   "url": "https://www.southalltravel.co.uk/",
   "domain": "southalltravel.co.uk"
  },
  {
   "n": "Away Holidays",
   "sector": "Travel · UK",
   "desc": "UK holidays specialist, performance & paid media.",
   "budget": "£1.6M+/yr",
   "url": "https://www.awayholidays.co.uk/",
   "domain": "awayholidays.co.uk"
  },
  {
   "n": "Advantage Rent A Car",
   "sector": "Car Rental · USA",
   "desc": "Major US car-rental brand, paid search & analytics.",
   "budget": "",
   "url": "https://www.advantage.com/",
   "domain": "advantage.com"
  },
  {
   "n": "Sail",
   "sector": "Property Mgmt · USA",
   "desc": "US multi-family property marketing, Google Ads & data, the team behind the AdCommand build.",
   "budget": "",
   "url": "https://www.sailmgmt.com/",
   "domain": "sailmgmt.com"
  },
  {
   "n": "QX Global Group",
   "sector": "BPM · Global",
   "desc": "Global business process management, current marketing & data role.",
   "budget": "",
   "url": "https://qxglobalgroup.com/",
   "domain": "qxglobalgroup.com"
  },
  {
   "n": "FlySharp",
   "sector": "Travel · UK",
   "desc": "UK flights & holidays, campaign management.",
   "budget": "",
   "url": "https://www.flysharp.com/",
   "domain": "flysharp.com"
  },
  {
   "n": "Travel Trolley",
   "sector": "Travel · UK",
   "desc": "UK travel agency, analytics & paid media.",
   "budget": "",
   "url": "https://www.traveltrolley.co.uk/",
   "domain": "traveltrolley.co.uk"
  },
  {
   "n": "Programming.com",
   "sector": "Technology",
   "desc": "Software & technology services.",
   "budget": "",
   "url": "https://www.programming.com/",
   "domain": "programming.com"
  }
 ],
 "services": [
  [
   "chart",
   "Live marketing dashboards",
   "Auto-updating dashboards your team will actually open, in Looker Studio, Power BI or Apps Script."
  ],
  [
   "bolt",
   "AI agents & automation",
   "Ask your data questions in plain English, and let the weekly report build itself."
  ],
  [
   "target",
   "Google Ads & analytics",
   "Sharper campaigns and tracking you can trust, so budget stops funding clicks that go nowhere."
  ]
 ],
 "steps": [
  "Understand the goal",
  "Connect & clean the data",
  "Build the dashboard or agent",
  "Automate & improve"
 ],
 "bio": "I started out running campaigns and spending the actual budget. Tired of waiting two days for reports that were already out of date, I taught myself to build my own. Now I build the dashboards and AI tools that show where the money went, then automate the dull bits.",
 "facts": [
  [
   "Based in",
   "Guwahati, India"
  ],
  [
   "Now",
   "Sr. Marketing Exec · QX Global"
  ],
  [
   "Education",
   "MBA · IIT Dhanbad"
  ],
  [
   "Works with",
   "US · UK · Global clients"
  ]
 ],
 "experience": [
  [
   "Senior Marketing Executive",
   "QX Global",
   "2026 → now"
  ],
  [
   "Senior Digital Marketing Executive",
   "Southall Travel",
   "2025 → 2026"
  ],
  [
   "Digital Marketing Analyst",
   "Programming.com",
   "2024 → 2025"
  ],
  [
   "Digital Data Analyst",
   "Investosure Consultancy",
   "2023 → 2024"
  ],
  [
   "Freelance Digital Analyst",
   "Self-employed",
   "2019 → 2021"
  ]
 ],
 "tools": [
  "Looker Studio",
  "Power BI",
  "DAX",
  "Apps Script",
  "Claude AI",
  "SQL",
  "BigQuery",
  "Snowflake",
  "GA4",
  "Google Ads",
  "Meta Ads",
  "Azure",
  "Tableau"
 ],
 "certs": [
  [
   "Google Data Analytics Professional",
   "Google"
  ],
  [
   "Power BI Certification",
   "Microsoft"
  ],
  [
   "Advanced Excel Practitioner",
   "Certified"
  ],
  [
   "Data Analytics Certification",
   "Henry Harvin"
  ]
 ],
 "covers": true
};
