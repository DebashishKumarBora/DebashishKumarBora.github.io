/* =====================================================================
   JARVIS BRAIN  ·  v5, English
   Answers questions about Deb and his work from the facts on this page.
   It never invents a number: if a question is not covered here, it says
   so and offers a call. Everything runs in the visitor's browser.

   How it understands a question:
     1. clean it up: lower case, shorthand ("hw", "u", "cv") expanded,
        typos corrected against its own vocabulary ("lookr" -> "looker")
     2. find the things it names: a project, a tool, a contact channel
     3. read the intent: what they want to know or do about that thing
     4. keep context, so "open it", "how was it built" and "tell me more"
        work after any answer
   ===================================================================== */
window.JARVIS_BRAIN = (function(){
  'use strict';

  var E  = 'debashishbora30@gmail.com';
  var LI = 'https://www.linkedin.com/in/debashish-kumar-bora-367845159/';
  var GH = 'https://github.com/DebashishKumarBora';

  /* =====================================================================
     1. FACTS.  The only things Jarvis is allowed to say about Deb.
     ===================================================================== */
  var CHIPS = {
    start:   ['What does he do?','Show me his best work','Is he available?','Book a call'],
    project: ['How was it built?','Open the live demo','Show me another one'],
    hire:    ['How much does he charge?','How long does a build take?','Book a call'],
    proof:   ['Which brands?','Show me his best work','Book a call'],
    work:    ['Show me an AI agent','Show the dashboards','What is his best project?'],
    about:   ['What has he built?','Where is he based?','Is he available?']
  };

  /* projects that are not live apps, keyed by title */
  var EXTRA_KEYS = {'Client Campaign Performance':'ccp','GA4 Traffic Analytics':'gta'};

  var PROJ_ALIAS = [
    ['adsintel', /\b(ads intelligence|ads intel|superdash|super dash|claude style chat|chat agent|ads agent|ads chat|ai analyst for ads)\b/],
    ['perf',     /\b(performance review|perf review|year over year review|yoy review|annual review|review that (builds|writes) itself|self building review)\b/],
    ['clients',  /\b(client reports?|clientone|client one|client portal|per client reports?)\b/],
    ['ads',      /\b(adcommand|ad command|ads command|command center)\b/],
    ['hub',      /\b(intelligence hub|marketing hub|marketing intelligence|control room|the hub|hub)\b/],
    ['lease',    /\b(leasing( dashboard)?|lease|snowflake dashboard|occupancy dashboard)\b/],
    ['gbp',      /\b(reviews? dashboard|business profile|gbp|google reviews)\b/],
    ['gsc',      /\b(search console|gsc|seo dashboard)\b/],
    ['gta',      /\b(ga4 traffic|traffic analytics)\b/],
    ['ga4',      /\b(analytics dashboard|ga4 dashboard|google analytics dashboard)\b/],
    ['ccp',      /\b(client campaign performance|campaign performance)\b/]
  ];

  var TOOLS = [
    {k:'looker', re:/\b(looker studio|looker|data studio)\b/, n:'Looker Studio',
     know:'Yes. Looker Studio is one of his main tools. Two Looker Studio builds are on this page, including one that mapped <b>121M+ impressions</b> for a travel client.',
     card:'looker', next:['Show the Looker Studio builds','Book a call']},
    {k:'powerbi', re:/\b(power bi|powerbi|dax|power query)\b/, n:'Power BI',
     know:'Yes. He is <b>Microsoft Power BI certified</b> and works with DAX and Power Query.',
     card:'tools'},
    {k:'tableau', re:/\btableau\b/, n:'Tableau',
     know:'Tableau is in his toolkit, though his recent builds lean on Looker Studio, Power BI and Apps Script.',
     card:'tools'},
    {k:'appsscript', re:/\b(apps script|app script|google apps script|gas)\b/, n:'Google Apps Script',
     know:'Apps Script is the engine behind most of the builds here. All three <b>AI agents</b> and the live dashboards are Apps Script web apps.',
     card:'agents'},
    {k:'snowflake', re:/\bsnowflake\b/, n:'Snowflake',
     know:'Yes. The <b>Leasing Dashboard</b> was built on raw Snowflake tables, turning them into a funnel from prospect to signed lease.',
     card:'one:lease', offer:'demo:lease'},
    {k:'bigquery', re:/\b(bigquery|big query)\b/, n:'BigQuery',
     know:'Yes. BigQuery is part of his data stack, with SQL for the modelling underneath the dashboards.',
     card:'tools'},
    {k:'sql', re:/\b(sql|mysql|queries|query)\b/, n:'SQL',
     know:'Yes. SQL is how he models the data before it reaches a dashboard, across Snowflake, BigQuery and MySQL.',
     card:'tools'},
    {k:'python', re:/\bpython\b/, n:'Python',
     know:'Yes. He uses Python for pipelines and automation alongside Apps Script.',
     card:'tools'},
    {k:'ga4', re:/\b(ga4|google analytics|analytics 4)\b/, n:'GA4',
     know:'Yes. GA4 setup and conversion tracking are part of his core work, and two GA4 dashboards are on this page.',
     card:'one:ga4', offer:'demo:ga4'},
    {k:'gads', re:/\b(google ads|adwords|paid search|search ads|pmax|performance max)\b/, n:'Google Ads',
     know:'Google Ads is where he started. He has managed <b>£3M+ a year</b> in budget and <b>100+ ad accounts</b>, and builds AI tools on top of the Google Ads data.',
     card:'results'},
    {k:'meta', re:/\b(meta( ads)?|facebook ads)\b/, n:'Meta Ads',
     know:'Yes. Meta Ads is part of his day to day stack, and his dashboards blend Meta with Google Ads, GA4 and CRM data.',
     card:'tools'},
    {k:'claude', re:/\b(claude|anthropic|llms?|large language models?|gpt|openai|chatgpt|gen ai|generative ai)\b/, n:'Claude',
     know:'He builds with <b>Claude</b>. It powers the AI layer in Ads Intelligence and AdCommand, reading the account data and returning what to fix first.',
     card:'one:adsintel', offer:'demo:adsintel'},
    {k:'azure', re:/\bazure\b/, n:'Azure',
     know:'Azure is part of his cloud toolkit.',
     card:'tools'},
    {k:'excel', re:/\b(excel|spreadsheets?|google sheets|sheets)\b/, n:'Excel',
     know:'Yes. He is a certified <b>Advanced Excel Practitioner</b>, though most of his work now replaces spreadsheets with live dashboards.',
     card:'tools'},
    {k:'react', re:/\b(react|fastapi|javascript|web apps?)\b/, n:'web apps',
     know:'When something needs a real app, he builds it. The demos here are web apps, and he uses React and FastAPI for full stack work.',
     card:'work'},
    {k:'stackadapt', re:/\bstackadapt\b/, n:'StackAdapt',
     know:'Yes. StackAdapt is on his marketing stack alongside Google Ads and Meta.',
     card:'tools'},
    {k:'gsc', re:/\b(search console|seo)\b/, n:'Search Console',
     know:'Yes. The <b>Search Console Dashboard</b> here shows clicks, rankings and the exact queries and pages behind organic search.',
     card:'one:gsc', offer:'demo:gsc'}
  ];

  /* =====================================================================
     2. INTENTS.  Regexes run on the cleaned question, each with a weight.
        The highest total wins. Answers rotate so repeats never read the same.
     ===================================================================== */
  var I = [
    {id:'self', re:[[/\b(who|what) are you\b/,4],[/\bare you (a |an )?(bot|robot|ai|human|real|chatgpt|gpt|person)\b/,5],[/\bwhat can you do\b/,4],[/\b(your name|who made you|who built you)\b/,4],[/^help$/,4],[/\bhow do (i|you) use (this|you)\b/,3]],
     a:['I am <b>Jarvis</b>, the assistant Deb built into this page. I answer from what is on this site, open any live demo for you, and can book you a call. Nothing you type leaves your browser.'],
     card:'welcome', next:CHIPS.start},

    {id:'about', re:[[/\bwho (is|s) (he|deb|debashish|bora|this guy|the guy)\b/,5],[/\bwhat does (he|deb|debashish) do\b/,5],[/\b(tell me|talk) about (him|deb|debashish)\b/,5],[/\babout (him|deb|debashish)\b/,3],[/\b(introduce|introduction|summary|in short|elevator pitch|overview of him)\b/,3],[/\bwhat is (his|deb s) (job|role|work)\b/,4],[/^(deb|debashish|debashish kumar bora)$/,4]],
     a:['Deb is a marketer turned data and automation builder. He builds <b>AI agents</b> and <b>live dashboards</b> for marketing teams, so they see what to do next and nobody builds the weekly report by hand. <b>4+ years</b> with US and UK brands.',
        'Short version: he ran the ad budgets first, then learned to build the reporting himself. Now he does both, and automates the dull parts so the numbers update on their own.'],
     card:'about', next:CHIPS.about},

    {id:'why', re:[[/\bwhy (should|would|do) (i|we|you) (hire|choose|pick|work with)\b/,6],[/\bwhy (him|deb)\b/,5],[/\bwhat makes (him|deb) (different|special|unique|stand out)\b/,6],[/\b(strengths?|usp|edge|advantage|stand out)\b/,3],[/\bis (he|deb) (good|any good|worth it|legit)\b/,4]],
     a:['He sits between marketing and engineering, which is rare. He has spent the budget himself, <b>£3M+ a year</b> of it, so the tools he builds answer the marketing question instead of just displaying numbers.',
        'Most people do the ads or the data. He does both, then adds an AI layer that watches the account, so nothing gets lost between the person running campaigns and the person building reports.'],
     card:'results', next:CHIPS.proof},

    {id:'results', re:[[/\b(results?|numbers|impact|achievements?|accomplishments?|track record|proof|stats|metrics|outcomes?)\b/,4],[/\bwhat has he (achieved|delivered|done)\b/,5],[/\bhow (big|much) (budget|spend)\b/,5],[/\b(budget|spend) (has he|he has|did he) (managed|handled|run)\b/,5],[/\bhow many (accounts|ad accounts|brands|clients)\b/,5]],
     a:['The headline numbers: <b>£3M+ a year</b> in Google Ads budget managed, <b>100+ ad accounts</b>, <b>8 brands</b> across travel, property and tech, and <b>4+ years</b> of it. One Looker Studio build alone mapped <b>121M+ impressions</b> and <b>86K conversions</b>.'],
     card:'results', next:CHIPS.proof},

    {id:'brands', re:[[/\b(clients?|brands?|companies|customers|who has he worked (with|for))\b/,4],[/\bworked (with|for)\b/,3],[/\b(travel|tourism|holidays?|airline|flights?)\b/,3],[/\b(property|real estate|apartments?|multifamily|multi family|housing|rental)\b/,3]],
     a:['Eight brands across UK travel, US property and car rental, BPM and tech. The two biggest are <b>Southall Travel</b> and <b>Away Holidays</b>, about <b>£1.5M</b> and <b>£1.6M</b> a year in Google Ads.'],
     card:'brands', next:['Show me his best work','What results has he delivered?','Book a call']},

    {id:'experience', re:[[/\b(experience|career|background|cv history|work history|previous (jobs|roles))\b/,4],[/\bhow many years\b/,5],[/\bhow long has he been\b/,5],[/\b(seniority|senior|junior)\b/,2]],
     a:['Four plus years across marketing and data. He started freelancing in 2019, then worked as a data analyst, a digital marketing analyst for US clients, and ran paid search at Southall Travel. He is now a <b>Senior Marketing Executive at QX Global</b>.'],
     card:'about', next:['Where does he work now?','Education?','Is he available?']},

    {id:'current', re:[[/\b(where|who) does he work (now|currently|today)\b/,6],[/\b(current|present) (job|role|employer|company|position)\b/,6],[/\bwhat is he doing now\b/,5],[/\bis he employed\b/,5]],
     a:['He is a <b>Senior Marketing Executive at QX Global</b>, where his work covers Google Ads, data and automation for a US property management company. The AI agents on this page come from that work.'],
     card:'agents', next:['Is he available?','Show me an AI agent','Book a call']},

    {id:'edu', re:[[/\b(education|degree|mba|university|college|studied|study|qualification|iit|ism|dhanbad|kaziranga)\b/,5]],
     a:['He holds an <b>MBA from IIT (ISM) Dhanbad</b> and a degree from Kaziranga University.'],
     card:'edu', next:['Certifications?','What has he built?','Is he available?']},

    {id:'certs', re:[[/\b(certifications?|certificates?|certified|credentials?|courses?)\b/,5]],
     a:['Four certifications: <b>Google Data Analytics Professional</b>, <b>Microsoft Power BI</b>, Advanced Excel Practitioner and a Data Analytics Certification from Henry Harvin.'],
     card:'edu', next:['Education?','What tools does he use?','Book a call']},

    {id:'location', re:[[/\b(where (is|s) (he|deb) (based|from|located)|based where|location|located|lives?|city|country)\b/,5],[/\b(time ?zones?|timezone|hours overlap|overlap|remote|remotely|on site|onsite|relocat\w*)\b/,4],[/\b(india|guwahati|assam)\b/,3],[/\bwhere is he\b/,4],[/\b(us|uk|american|british|est|pst|gmt|bst|european) (hours|time|timezone|time zone|business hours)\b/,7]],
     a:['He is based in <b>Guwahati, India</b> and works remotely, overlapping with UK and US working hours. Remote has never been the blocker.'],
     card:'hire', next:['Is he available?','How much does he charge?','Book a call']},

    {id:'available', re:[[/\b(available|availability|open to work|open for work|free to start|start date|can he start|taking (on )?(new )?(work|projects|clients))\b/,5],[/\b(full ?time|part ?time|freelanc\w*|contract|contractor|permanent|job|role|position|hiring|hire him|employment|vacancy|opening)\b/,3],[/\bis he looking\b/,5],[/\bcan (i|we) hire\b/,5]],
     a:['Yes. He is open to <b>freelance projects</b> and to the right <b>full time role</b>, working remotely across UK and US hours. The quickest next step is a short call.',
        'He is taking on new work right now, both projects and roles. Book a thirty minute intro or email him to start the conversation.'],
     card:'hire', next:CHIPS.hire},

    {id:'salary', re:[[/\b(salary|ctc|compensation|package|expected pay|pay expectations?|notice period)\b/,8]],
     a:['That is best discussed with him directly. Email <b>'+E+'</b> or book a short call, and he will walk you through it.'],
     card:'contact', next:['Is he available?','Where is he based?','Book a call']},

    {id:'rates', re:[[/\b(price|pricing|prices|cost|costs|charge|charges|rate|rates|fee|fees|quote|budget for|how much|expensive|cheap|affordable|hourly|day rate|salary|ctc|compensation|pay)\b/,5]],
     a:['He prices per project once he knows the scope, so nothing is templated. A short intro call is free, and he gives you a number after it.',
        'It depends on the build. A focused dashboard and a full AI agent are very different jobs, so he quotes after a quick call rather than guessing.'],
     card:'hire', next:['How long does a build take?','Book a call','Is he available?']},

    {id:'timeline', re:[[/\bhow (long|fast|quick|quickly)\b/,4],[/\b(timeline|turnaround|deadline|weeks?|days|deliver|delivery|time frame|timeframe|eta)\b/,3]],
     a:['A focused dashboard usually lands in <b>one to two weeks</b>. AI agents and data pipelines take longer, and he tells you that up front rather than after.'],
     card:'hire', next:['How does he work?','How much does he charge?','Book a call']},

    {id:'process', re:[[/\bhow does he (work|start|operate)\b/,5],[/\b(process|workflow|steps|approach|methodology|way of working|what happens (next|after))\b/,4]],
     a:['Four steps: <b>understand</b> the business question, <b>connect and clean</b> the data, <b>build</b> the dashboard or agent, then <b>automate and improve</b> it. You get something clickable early, not a document.'],
     card:'hire', next:['How long does a build take?','How much does he charge?','Book a call']},

    {id:'services', re:[[/\b(services?|offer|offerings?|what can he (do|build|help)|help (me|us|my team) with|specialit(y|ies)|specializ\w*)\b/,4],[/\bwhat does he build\b/,4]],
     a:['Three things: <b>live marketing dashboards</b> in Looker Studio, Power BI or Apps Script, <b>AI agents and automation</b> so the weekly report builds itself, and <b>Google Ads and analytics</b> work, from campaigns to conversion tracking.'],
     card:'work', next:CHIPS.work},

    {id:'build', re:[[/\b(can|could|would|will) (he|you|deb) (build|make|create|set up|setup|design|develop|automate|do|help)\b/,4],[/\b(i|we) (need|want|are looking for|would like) (a|an|some|help)\b/,4],[/\bfor (my|our) (agency|company|team|business|brand|clients?|startup|store|shop)\b/,3]],
     a:['Very likely, yes. Live dashboards, AI agents and reporting automation for marketing teams are exactly what he builds. Tell him what you report by hand today and he will show you what a live version could look like.'],
     card:'hire', next:['Show me his best work','How much does he charge?','Book a call']},

    {id:'work', re:[[/\b(work|projects?|portfolio|builds?|demos?|examples?|samples?)\b/,3],[/\bcase stud(y|ies)\b/,7],[/\bwhat (has|did) he (built|build|made|make|created)\b/,6],[/\bshow me (his|the|some) (work|projects|stuff)\b/,6]],
     a:['Eleven builds on this page, and nine run live in your browser: <b>three AI agents</b> and <b>six dashboards</b>, all on sample data. Pick one and I will open it.',
        'Everything here is a real build shown on invented data: three AI agents, six live dashboards and two Looker Studio reports. Want me to open the best one first?'],
     card:'work', next:CHIPS.work, offer:'demo:adsintel'},

    {id:'best', re:[[/\b(best|favou?rite|top|strongest|most impressive|flagship|proudest|coolest|signature)\b/,4],[/\bwhere (should|do) i start\b/,5],[/\b(recommend|suggest)\b/,3],[/\bwhich (one|project|demo) (first|should)\b/,5]],
     a:['Start with <b>Ads Intelligence</b>. Ask it anything about 16 ad accounts in plain English and it answers with tables, charts and a fix list. Want me to open it?'],
     card:'one:adsintel', next:['Open it','How was it built?','Show me another one'], offer:'demo:adsintel', project:'adsintel'},

    {id:'agents', re:[[/\b(ai )?agents?\b/,4],[/\b(agentic|assistants? he built|bots? he built)\b/,4]],
     a:['Three AI agents for marketing teams: <b>Ads Intelligence</b> answers questions about 16 ad accounts, <b>Performance Review</b> writes a year over year review and turns it into slides, and <b>Client Reports</b> gives every client a private link to their own results.'],
     card:'agents', next:['Open Ads Intelligence','How do the agents use AI?','Show the dashboards'], filter:'agent'},

    {id:'dashboards', re:[[/\b(dashboards?|dash boards?|reports?|reporting|bi)\b/,3],[/\blive apps?\b/,4]],
     a:['Six live dashboards: <b>AdCommand</b> for Google Ads, a <b>Marketing Intelligence Hub</b>, a <b>Leasing Dashboard</b> on Snowflake, plus GA4, Business Profile reviews and Search Console. Each one opens right here.'],
     card:'dash', next:['Open AdCommand','Show me an AI agent','Looker Studio work?'], filter:'app'},

    {id:'ai', re:[[/\bhow (does|do) (he|the agents?|it|they) use ai\b/,6],[/\bhow (does|do|is) (the )?ai (work|works|help|used)\b/,7],[/\b(ai|artificial intelligence|machine learning|ml)\b/,3],[/\bwhat does the ai do\b/,6]],
     a:['The AI is not decoration. It reads the actual account data, explains what changed and ranks what to fix first. In Ads Intelligence you ask in plain English and every number traces back to the query behind it.'],
     card:'agents', next:['Open Ads Intelligence','What tools does he use?','Book a call']},

    {id:'data', re:[[/\b(data (stack|engineering|pipeline|pipelines|warehouse)|warehous\w*|pipelines?|etl|elt|data modell?ing|data cleaning)\b/,5]],
     a:['He works the whole path: warehouse, query, pipeline, then the dashboard on top. Snowflake and BigQuery for the data, SQL for the modelling, Apps Script and Python for the pipelines.'],
     card:'tools', next:['Open the Leasing Dashboard','What tools does he use?','Book a call']},

    {id:'demodata', re:[[/\b(is|are) (the |this |that )?(data|numbers|demos?) (real|fake|live|made up|actual)\b/,7],[/\b(data|numbers|demos?)\b.*\b(real|fake|made up|actual|genuine)\b/,6],[/\b(real data|fake data|sample data|dummy data|made up|fictional|anonymi[sz]ed|confidential|privacy|nda|sensitive)\b/,5],[/\bis (it|this) real\b/,4]],
     a:['The demos run on invented sample data for a fictional brand, so nothing confidential is shown. The production versions run on live data, and real client data never leaves the client.'],
     card:'work', next:['Show me his best work','What has he built?','Book a call']},

    {id:'property', re:[[/\b(real estate|property|properties|multifamily|multi family|apartments?|housing|leasing|landlords?|rentals?)\b/,5]],
     a:['Yes. His current work is for <b>Sail</b>, a US property management company: Google Ads, data and AI tools across 16 ad accounts. The three AI agents on this page come from that world.'],
     card:'agents', next:['Show me an AI agent','Open the Leasing Dashboard','Book a call']},

    {id:'travel', re:[[/\b(travel|tourism|holidays?|airlines?|flights?|tour operators?|ota)\b/,5]],
     a:['Yes. Most of his paid search years were in UK travel: <b>Southall Travel</b> and <b>Away Holidays</b>, about <b>£3M a year</b> in Google Ads between them, plus FlySharp and Travel Trolley.'],
     card:'brands', next:['What results has he delivered?','Show me his best work','Book a call']},

    {id:'industries', re:[[/\b(industr(y|ies)|sectors?|verticals?|domains?|niches?)\b/,6]],
     a:['Mostly <b>travel</b> and <b>property</b>, plus car rental, business process management and tech. Travel means Southall Travel, Away Holidays, FlySharp and Travel Trolley in the UK. Property means Sail, a US property management company.'],
     card:'brands', next:['What results has he delivered?','Show me his best work','Book a call']},

    {id:'dev', re:[[/\b(developer|engineer|programmer|coder|technical|coding|code himself|does he code|can he code|software)\b/,6]],
     a:['He is a marketer who builds his own tools. Every demo here is his code: Apps Script and JavaScript web apps, SQL for the data, with Python and React when a project needs them.'],
     card:'work', next:['How was this site built?','What tools does he use?','Show me his best work']},

    {id:'email', re:[[/\b(email|e mail|mail address|email address|mail id)\b/,7]],
     a:['His email is <b>'+E+'</b>. The Copy email button below grabs it for you.'],
     card:'contact', next:['Book a call','Is he available?']},

    {id:'whatsapp', re:[[/\b(whatsapp|whats app|phone|phone number|mobile|call him|text him)\b/,7]],
     a:['WhatsApp is the quickest way to reach him directly. Tap the WhatsApp button below and it opens a chat with Deb.'],
     card:'contact', next:['Book a call','Is he available?']},

    {id:'social', re:[[/\b(linkedin|github|git hub|socials?|social media profiles?|profile links?)\b/,7]],
     a:['Here are his profiles. LinkedIn has his full history, and GitHub has the code behind the demos.'],
     card:'links', next:['Book a call','What has he built?']},

    {id:'tools', re:[[/\b(tools?|stack|tech stack|technolog(y|ies)|software|platforms?|skills?|skillset|languages he codes)\b/,4],[/\bwhat does he use\b/,5]],
     a:['Looker Studio, Power BI and Google Apps Script for the builds, Snowflake, BigQuery and SQL for the data, GA4, Google Ads and Meta Ads on the marketing side, and <b>Claude</b> for the AI layer.'],
     card:'tools', next:['Does he know Power BI?','Snowflake experience?','Show me his best work']},

    {id:'resume', re:[[/\b(resume|cv|curriculum vitae|linkedin profile|full history|download)\b/,6]],
     a:['There is no PDF on the page yet. His <b>LinkedIn</b> has the full history, and the About section lists every role. Want the link?'],
     card:'links', next:['Education?','Where does he work now?','Book a call']},

    {id:'contact', re:[[/\b(contact|reach|get in touch|message)\b/,4],[/\bhow (do|can) i (reach|contact|talk to|speak to|get hold of)\b/,6]],
     a:['Email <b>'+E+'</b>, message him on WhatsApp, or book a thirty minute call. All three are one tap away below.'],
     card:'contact', next:['Book a call','Is he available?','How much does he charge?']},

    {id:'book', re:[[/\b(book|schedule|set up|arrange) (a |an )?(call|meeting|chat|intro|time|slot)\b/,8],[/\b(book|calendly|calendar|meeting|appointment|consultation|discovery call)\b/,4],[/\b(talk|speak) (to|with) (him|deb)\b/,5],[/^(call|book a call|book)$/,6]],
     a:['Opening his calendar now. Pick any thirty minute slot that suits you.'],
     act:'book', card:'hire', next:['How much does he charge?','Is he available?','Show me his best work']},

    {id:'clean', re:[[/\b(clean(s|ing)? (up )?(the |your |my )?data|data clean(ing|up)|messy data|dirty data|data quality|prepare (the )?data|data prep)\b/,7]],
     a:['In steps: fix numbers saved as text, remove duplicate and blank rows, merge names spelled several ways, and mark missing values instead of counting them as zero. The <b>data lab</b> does exactly that, live, on any CSV you drop in.'],
     act:'go:#lab', next:['What tools does he use?','Show me his best work','Book a call']},

    {id:'lab', re:[[/\b(data lab|lab|try it( myself| yourself)?|upload|csv|my own data|my data|my file|messy (data|export|file))\b/,6]],
     a:['Try the <b>data lab</b>. Drop in a CSV, or pick a sample, and it cleans the file, charts it and writes the insights right in your browser. Nothing is uploaded.'],
     act:'go:#lab', next:['How does he clean data?','Show me his best work','Book a call']},

    {id:'tour', re:[[/\b(tour|walk ?through|walk me|show me around|guide me|give me a tour|quick tour)\b/,6]],
     a:['Here is a one minute tour. I will scroll as I talk.'],
     act:'tour', next:CHIPS.work},

    {id:'langs', re:[[/\bwhat languages\b/,6],[/\b(does he|can he) speak\b/,6],[/\b(hindi|assamese|bengali|english speaking|spoken languages?)\b/,4]],
     a:['He works in <b>English</b>, and also speaks Hindi and Assamese.'],
     card:'about', next:CHIPS.start},

    {id:'site', re:[[/\bhow (was|is|did he) (this|the) (site|website|page|portfolio|assistant|chatbot|bot)\b/,7],[/\b(this|the) (site|website|portfolio) (built|made)\b/,6]],
     a:['He hand built this site in plain HTML, CSS and JavaScript, hosted free on GitHub Pages. I run entirely in your browser, with no paid AI service behind me.'],
     next:CHIPS.work},

    {id:'compliment', re:[[/^(nice|cool|great|awesome|amazing|impressive|wow|love it|beautiful|neat|sick|brilliant|very nice|so cool|looks great)( site| work| portfolio| page)?$/,6],[/\b(great|nice|amazing|impressive|beautiful) (site|work|portfolio|page|website|job)\b/,5]],
     a:['Thank you, I will pass that on to Deb. Want to see the work in action?','Glad you like it. The live demos are even better than the screenshots.'],
     card:'work', next:CHIPS.work},

    {id:'greet', re:[[/^(hi|hello|hey|hiya|yo|howdy|hola|namaste|good (morning|afternoon|evening)|greetings|sup|whats up|what is up)( there| jarvis)?$/,6]],
     a:['Hi. Ask me anything about Deb’s work, or pick a starting point below.','Hello. Want the quick tour, or shall I open his best project?'],
     card:'welcome', next:CHIPS.start},

    {id:'howareyou', re:[[/^how are you( doing)?( today)?$/,7],[/^how s it going$/,7]],
     a:['Doing well, thanks. Ready to show you around whenever you are.'], next:CHIPS.start},

    {id:'thanks', re:[[/^(thanks|thank you|thx|cheers|appreciate it|great thanks|ok thanks|thanks a lot|many thanks)( jarvis)?$/,6]],
     a:['Any time.','Happy to help. Anything else you want to see?'], next:CHIPS.start},

    {id:'bye', re:[[/^(bye|goodbye|see you|see ya|later|cya|good night|that s all|thats all|nothing else)$/,6]],
     a:['Thanks for stopping by. If you want to talk, his calendar is one tap away.'], next:['Book a call']},

    {id:'joke', re:[[/\b(joke|make me laugh|something funny)\b/,6]],
     a:['A SQL query walks into a bar, spots two tables and asks: mind if I JOIN you? Right, back to dashboards.'], next:CHIPS.start}
  ];

  /* =====================================================================
     3. CLEANING THE QUESTION
     ===================================================================== */
  var SHORT = {u:'you',ur:'your',yr:'year',yrs:'years',r:'are',hw:'how',wat:'what',wht:'what',wut:'what',abt:'about',
    pls:'please',plz:'please',thx:'thanks',tnx:'thanks',ty:'thanks',cv:'cv',exp:'experience',info:'information',
    ok:'ok',okay:'ok',k:'ok',kk:'ok',ya:'yes',yea:'yes',yeah:'yes',yep:'yes',yup:'yes',yess:'yes',nope:'no',nah:'no',
    dashbaord:'dashboard',dashbord:'dashboard',dashborad:'dashboard',dahsboard:'dashboard',db:'dashboard',
    ppc:'google ads',sem:'google ads',fb:'facebook',insta:'meta',instagram:'meta',hes:'he is',whats:'what is',
    im:'i am',wanna:'want to',gonna:'going to',gimme:'give me',lemme:'let me',dont:'do not',doesnt:'does not',
    cant:'can not',isnt:'is not',thats:'that is',theres:'there is',bc:'because',coz:'because',cuz:'because',
    asap:'quickly',w:'with',ai:'ai',deb:'deb'};

  function clean(s){
    var x=String(s||'').toLowerCase().replace(/[’‘']/g,' ').replace(/&/g,' and ');
    try{ x=x.replace(/[^\p{L}\p{N} ]/gu,' '); }catch(e){ x=x.replace(/[^a-z0-9 ]/g,' '); }
    return x.replace(/\s+/g,' ').trim();
  }

  /* vocabulary for typo correction, harvested from the patterns themselves */
  var VOCAB={};
  function harvest(re){
    String(re.source).replace(/\\b|\\s|\?|\^|\$|\(|\)|\[|\]|\{|\}|\*|\+|\./g,' ').split(/[|\s]+/).forEach(function(w){
      w=w.replace(/[^a-z0-9]/g,''); if(w.length>=4) VOCAB[w]=1; });
  }
  I.forEach(function(it){ it.re.forEach(function(r){ harvest(r[0]); }); });
  TOOLS.forEach(function(t){ harvest(t.re); });
  PROJ_ALIAS.forEach(function(p){ harvest(p[1]); });
  var DOMAIN=[];
  ['dashboard','dashboards','looker','studio','intelligence','performance','review','reports','leasing','snowflake',
   'bigquery','analytics','search','console','business','profile','available','experience','certifications',
   'education','charge','pricing','timeline','process','services','projects','portfolio','agents','resume',
   'contact','whatsapp','linkedin','results','clients','brands','tableau','python','meta','claude','automation',
   'build','built','open','show','launch','tell','more','about','where','based','remote','hire','freelance',
   'connect','connects','connected','integrate','integration','integrations','automate','automation','report','weekly','monthly','agency','company','business','client','developer','engineer','analyst','marketing','campaign','campaigns','industry','industries','someone','something','anything','studies','study','case','phone','hours','timezone','github','linkedin','email','code','coding']
   .forEach(function(w){VOCAB[w]=1;DOMAIN.push(w);});
  /* domain words first, so a tie goes to "looker" rather than "looks" */
  var VLIST=DOMAIN.concat(Object.keys(VOCAB).filter(function(w){return DOMAIN.indexOf(w)<0;}));

  function dist(a,b,lim){
    /* Damerau Levenshtein with an early exit */
    var la=a.length, lb=b.length; if(Math.abs(la-lb)>lim) return lim+1;
    var d=[],i,j;
    for(i=0;i<=la;i++){ d[i]=[i]; }
    for(j=0;j<=lb;j++){ d[0][j]=j; }
    for(i=1;i<=la;i++){
      var rowMin=lim+1;
      for(j=1;j<=lb;j++){
        var c=a[i-1]===b[j-1]?0:1;
        d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c);
        if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]) d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
        if(d[i][j]<rowMin) rowMin=d[i][j];
      }
      if(rowMin>lim) return lim+1;
    }
    return d[la][lb];
  }
  var COMMON={'what':1,'when':1,'where':1,'with':1,'have':1,'this':1,'that':1,'they':1,'them':1,'your':1,'from':1,
    'does':1,'done':1,'been':1,'like':1,'just':1,'some':1,'show':1,'more':1,'much':1,'many':1,'very':1,'want':1,'need':1,
    'make':1,'take':1,'tell':1,'give':1,'good':1,'nice':1,'here':1,'there':1,'would':1,'could':1,'should':1,'about':1,
    'which':1,'their':1,'other':1,'into':1,'than':1,'then':1,'also':1,'only':1,'over':1,'work':1,'year':1,'years':1,
    'team':1,'help':1,'know':1,'look':1,'same':1,'still':1,'thing':1,'things':1,'time':1,'call':1,'sure':1,'okay':1};
  function fix(tok){
    if(tok.length<4||VOCAB[tok]||COMMON[tok]||/\d/.test(tok)) return tok;
    var lim=tok.length>=7?2:1, best=tok, bd=lim+1;
    for(var i=0;i<VLIST.length;i++){
      var w=VLIST[i]; if(w[0]!==tok[0]&&tok.length<7) continue;
      var dd=dist(tok,w,lim); if(dd<bd){bd=dd;best=w;}
    }
    return bd<=lim?best:tok;
  }
  function prep(raw){
    var toks=clean(raw).split(' ').filter(Boolean).map(function(t){return SHORT[t]!==undefined?SHORT[t]:t;}).join(' ').split(' ');
    toks=toks.map(fix);
    var x=toks.join(' ');
    /* stitch common two word names that typos may have split */
    x=x.replace(/\bpower b i\b/g,'power bi').replace(/\blooker studios\b/g,'looker studio').replace(/\bai agent s\b/g,'ai agents');
    return x;
  }

  /* =====================================================================
     4. ENTITIES
     ===================================================================== */
  function projects(){
    var list=(window.DKB&&window.DKB.projects)||[], out={};
    list.forEach(function(p){ var k=p.k||EXTRA_KEYS[p.t]; if(k) out[k]=p; });
    return out;
  }
  function findProject(x){
    for(var i=0;i<PROJ_ALIAS.length;i++) if(PROJ_ALIAS[i][1].test(x)) return PROJ_ALIAS[i][0];
    return null;
  }
  function findTool(x){
    for(var i=0;i<TOOLS.length;i++) if(TOOLS[i].re.test(x)) return TOOLS[i];
    return null;
  }

  var RX={
    open:/\b(open|launch|run|play|load|start|try|pull up|take me to|go to|demo it|show it|show me it|let me see|see it|view it|show me)\b/,
    how:/\b(how (was|is|did|does) (it|this|that|he build|he make|.* built)|how (it|this) works|built|tech behind|tech stack behind|under the hood|architecture|made with|what powers|stack behind)\b/,
    problem:/\b(why (did|was|would) he|what problem|problem|solve|solves|purpose|pain|reason)\b/,
    result:/\b(result|results|impact|outcome|outcomes|achieve|value|benefit)\b/,
    ref:/\b(it|this|that|this one|that one|the demo|the project|the app|the agent|the dashboard)\b/,
    more:/^(tell me more|more|go on|continue|and|and then|details|more details|what else|keep going|explain|expand|elaborate|anything else|tell me more about (it|that|this)|more about (it|that|this)|what more)$/,
    another:/\b(another|next|something else|different one|other one|other projects?|show me more|more projects|more work)\b/,
    yes:/^(yes|yes please|sure|ok|ok sure|go ahead|please|do it|sounds good|why not|absolutely|definitely|of course|open it|show me|show it|let s go|go|yes open it|launch it|ok open it|yes show me)$/,
    no:/^(no|no thanks|no thank you|not now|later|maybe later|nope|not really|i am good|im good|all good)$/,
    knowq:/\b(know|knows|use|uses|used|using|experience|experienced|familiar|good at|expert|skilled|proficient|work with|works with|worked with|handle|comfortable|certified|can he|does he|has he|do you)\b/,
    buildq:/\b(build|make|create|set up|setup|design|develop|automate|need|want|looking for|help|run|manage|handle)\b/
  };

  /* =====================================================================
     5. ANSWERING
     ===================================================================== */
  var rot={};
  function pick(id,list){
    if(!list||!list.length) return '';
    var n=((rot[id]===undefined)?-1:rot[id])+1; if(n>=list.length) n=0; rot[id]=n;
    return list[n];
  }
  function title(p){return '<b>'+p.t+'</b>';}
  function theTitle(p){return (/(Dashboard|Hub|Review)/.test(p.t)?'the ':'')+title(p);}

  var STRONG=['clean','lab','property','travel','industries','dev','email','whatsapp','social','self','salary','rates','book','timeline','available','contact','resume','edu','certs','location','experience','current','brands','results','why','process','tour','langs','site','demodata','greet','thanks','bye','joke','compliment'];
  var FACET=['what','problem','how','result'];
  function projectAnswer(k,facet,ctx){
    var P=projects(), p=P[k]; if(!p) return null;
    var live=!!p.live, offer=live?('demo:'+k):'f:looker', txt;
    if(facet==='open'){
      if(live) return {text:'Opening '+theTitle(p)+' now. It runs live on sample data.',act:'demo:'+k,project:k,card:null,next:['How was it built?','Show me another one','Book a call']};
      return {text:title(p)+' is a Looker Studio report, so there is no live app to open. Here it is in the work section.',act:'f:looker',project:k,next:['Show me an AI agent','Book a call']};
    }
    if(facet==='how') txt=title(p)+' was built with <b>'+p.tool+'</b>. '+p.b;
    else if(facet==='problem') txt='The problem: '+p.p.charAt(0).toLowerCase()+p.p.slice(1)+' '+title(p)+' fixes that.';
    else if(facet==='result') txt=p.r;
    else txt=title(p)+': '+p.s+' Built with '+p.tool+'.';
    var ask=(live&&facet==='what')?' Want me to open it?':'';
    return {text:txt+ask,card:'one:'+k,project:k,facet:facet,offer:live?offer:null,
            next:live?['Open it','How was it built?','Show me another one']:['Show the Looker Studio builds','Show me an AI agent','Book a call']};
  }

  function toolAnswer(t,x){
    var building=RX.buildq.test(x)&&/\b(for (me|my|our|us)|my|our|can he|could he|would he|will he)\b/.test(x);
    var text=building?('Yes, he can. '+t.know.replace(/^Yes\. /,'')+' Tell him what you need and he will scope it on a short call.'):t.know;
    return {text:text,card:t.card||'tools',offer:t.offer||null,project:t.offer?t.offer.split(':')[1]:null,
            next:t.next||(building?['How much does he charge?','How long does a build take?','Book a call']:['What tools does he use?','Show me his best work','Book a call'])};
  }

  function answer(raw,ctx){
    ctx=ctx||{};
    var x=prep(raw); if(!x) return null;
    var words=x.split(' ').length;

    /* a yes or no right after an offer */
    if(ctx.offer&&RX.yes.test(x)) return {text:offerText(ctx.offer),act:ctx.offer,project:ctx.project,next:['Show me another one','Book a call']};
    if(ctx.offer&&RX.no.test(x))  return {text:'No problem. Ask me anything else, or pick one below.',next:CHIPS.start,clear:true};

    if(RX.no.test(x)) return {text:'No problem. Anything else you would like to know?',next:CHIPS.start,clear:true};

    /* "tell me more" and friends lean on the last answer */
    if(RX.more.test(x)){
      if(ctx.project){
        var i=FACET.indexOf(ctx.facet||'what'), nf=FACET[(i+1)%FACET.length];
        if(nf==='what'){ return {text:'That is the whole story for '+title(projects()[ctx.project]||{t:'this one'})+'. The best way to see the rest is to click around the live demo, or ask Deb on a call.',offer:'demo:'+ctx.project,project:ctx.project,next:['Open it','Show me another one','Book a call']}; }
        return projectAnswer(ctx.project,nf,ctx);
      }
      if(ctx.intent){
        var it0=byId(ctx.intent);
        if(it0&&it0.a.length>1) return {text:pick(it0.id,it0.a),card:it0.card,next:it0.next,intent:it0.id};
      }
      return {text:'That is the short version. For the detail behind it, a quick call with Deb is the fastest way. Want me to open his calendar?',offer:'book',next:['Book a call','Show me his best work']};
    }

    /* "show me another one" */
    if(RX.another.test(x)&&!findProject(x)){
      var order=['adsintel','perf','clients','ads','hub','lease','ga4','gbp','gsc'];
      var cur=order.indexOf(ctx.project), nk=order[(cur+1)%order.length];
      return projectAnswer(nk,'what',ctx);
    }

    /* named project, or "it" meaning the last one */
    var pk=findProject(x);
    var refOnly=!pk&&ctx.project&&(RX.ref.test(x)||words<=3)&&(RX.open.test(x)||RX.how.test(x)||RX.problem.test(x)||RX.result.test(x));
    if(refOnly) pk=ctx.project;
    if(pk){
      var facet=RX.open.test(x)?'open':RX.how.test(x)?'how':RX.problem.test(x)?'problem':RX.result.test(x)?'result':'what';
      var pa=projectAnswer(pk,facet,ctx); if(pa) return pa;
    }

    /* a bare "open it" with nothing to point at */
    if(RX.open.test(x)&&RX.ref.test(x)&&!ctx.project&&words<=4)
      return {text:'Which one? Here are the live demos. Tap any of them and it opens right here.',card:'work',next:CHIPS.work};

    /* intents */
    var best=null,bs=0;
    for(var n=0;n<I.length;n++){
      var s=0,rs=I[n].re;
      for(var r=0;r<rs.length;r++) if(rs[r][0].test(x)) s+=rs[r][1];
      if(s>bs){bs=s;best=I[n];}
    }

    /* a named tool wins unless the question is clearly about something else
       (pricing, booking, who Jarvis is, credentials...) */
    var tool=findTool(x);
    if(tool&&(RX.knowq.test(x)||RX.buildq.test(x)||words<=4)){
      var strong=best&&bs>=4&&STRONG.indexOf(best.id)>=0;
      if(!strong) return toolAnswer(tool,x);
    }
    if(best&&bs>=3){
      var out={text:pick(best.id,best.a),card:best.card||null,next:best.next||CHIPS.start,act:best.act||null,intent:best.id,
               offer:best.offer||null,project:best.project||null,filter:best.filter||null};
      return out;
    }
    if(tool) return toolAnswer(tool,x);
    return null;
  }
  function byId(id){for(var i=0;i<I.length;i++) if(I[i].id===id) return I[i]; return null;}
  function offerText(a){
    if(a==='book') return 'Opening his calendar now.';
    if(a.indexOf('demo:')===0){ var p=projects()[a.slice(5)]; return 'Opening '+(p?theTitle(p):'the demo')+' now.'; }
    if(a==='f:looker') return 'Here are the Looker Studio builds.';
    return 'On it.';
  }

  /* used only when Chrome's on device model is present, to answer the rare
     question none of the above covers. Still facts only. */
  var FACTS=[
    'Debashish Kumar Bora, called Deb, builds AI agents and live dashboards for marketing teams. 4+ years with US and UK brands.',
    'Managed £3M+ a year in Google Ads budget (Southall Travel about £1.5M, Away Holidays about £1.6M), 100+ ad accounts, 8 brands.',
    'Brands: Southall Travel, Away Holidays, FlySharp, Travel Trolley (UK travel), Advantage Rent A Car and Sail (USA), QX Global Group, Programming.com.',
    'Now Senior Marketing Executive at QX Global. Before: Southall Travel, Programming.com, Investosure Consultancy, freelance from 2019.',
    'MBA from IIT (ISM) Dhanbad. Certified in Google Data Analytics, Microsoft Power BI, Advanced Excel.',
    'Stack: Looker Studio, Power BI, Apps Script, Claude, SQL, BigQuery, Snowflake, GA4, Google Ads, Meta Ads, Python.',
    'Builds on this site: Ads Intelligence, Performance Review, Client Reports (AI agents), AdCommand, Marketing Intelligence Hub, Leasing Dashboard, GA4, Reviews and Search Console dashboards, two Looker Studio reports. Demos use invented sample data.',
    'Based in Guwahati, India, remote, overlapping UK and US hours. Open to projects and full time roles. Pricing is per project after a free intro call.',
    'Contact: '+E+', WhatsApp, LinkedIn, or book a 30 minute call on this page.'
  ].join(' ');

  return {answer:answer, prep:prep, facts:FACTS, chips:CHIPS, links:{email:E,linkedin:LI,github:GH}};
})();
