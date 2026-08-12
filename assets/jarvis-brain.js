/* =====================================================================
   JARVIS BRAIN  ·  trilingual understanding corpus
   English · हिन्दी · অসমীয়া

   How this reaches millions of phrasings without shipping millions of rows:

   The matcher never stores sentences. It stores SLOTS (verbs, determiners,
   politeness, topics, tails) and accepts any combination of them in any
   order. So "can you please open up the leasing dashboard for me",
   "leasing dashboard kholo", and "লিজিং ডেছবৰ্ড খোলক" all resolve to the
   same intent without any of them existing as a stored string.
   JARVIS.BRAIN.capacity() reports the exact size of the accepted space.

   Romanized input is first class. Indian users code switch constantly
   (Hinglish, romanized Assamese), so every topic carries roman spellings
   alongside native script.
   ===================================================================== */
window.JARVIS_BRAIN = (function(){
  'use strict';

  var E='debashishbora30@gmail.com';

  /* =====================================================================
     1. SLOTS.  These multiply out into the accepted phrasing space.
     ===================================================================== */
  var SLOT={
    en:{
      polite:['','please','can you','could you','would you','pls','kindly','hey','i want to','i would like to','let me','help me'],
      verb_open:['open','show','launch','run','see','view','load','start','pull up','bring up','take me to','go to','display','demo','try','preview','check out'],
      verb_tell:['what is','what','tell me','explain','describe','who is','how is','give me','share','talk about','say something about','info on','details on','more about','any','know about'],
      det:['','the','a','his','your','that','this','some'],
      tail:['','now','please','quickly','for me','again','first','next','here','thanks']
    },
    hi:{
      polite:['','कृपया','क्या आप','जरा','ज़रा','मुझे','मैं','दिखाइए','बताइए','plz','kya aap','zara','mujhe'],
      verb_open:['खोलो','खोलिए','खोल','दिखाओ','दिखाइए','दिखा','चलाओ','लाओ','ले चलो','देखना','शुरू करो','kholo','kholiye','dikhao','dikha','chalao','le chalo','dekhna','khol'],
      verb_tell:['क्या है','क्या','बताओ','बताइए','बता','समझाओ','कौन है','कैसे','जानकारी','के बारे में','kya hai','batao','bataiye','samjhao','kaun hai','kaise','jankari','ke bare me','bare me'],
      det:['','ये','यह','वो','उनका','उनके','इनका','अपना','kya','ye','yeh','unka'],
      tail:['','अभी','जरा','ज़रा','कृपया','फिर','पहले','धन्यवाद','abhi','zara','phir','pehle']
    },
    as:{
      polite:['','অনুগ্ৰহ কৰি','আপুনি','মোক','মই','জৰা','দেখুৱাওক','কওক','anugroh kori','apuni','mok','moi'],
      verb_open:['খোলক','খোলা','খুলি দিয়ক','খুলক','দেখুৱাওক','দেখুৱা','চলাওক','লৈ যাওক','আৰম্ভ কৰক','kholok','khola','khuli diyok','dekhuwaok','dekhuwa','soluwak','loi jaok'],
      verb_tell:['কি','কি হয়','কওক','কোৱা','বুজাই দিয়ক','কোন','কেনেকৈ','তথ্য','বিষয়ে','ki','ki hoi','kowok','kua','bujai diyok','kun','kenekoi','tothyo','bisoye'],
      det:['','এই','সেই','তেওঁৰ','আপোনাৰ','নিজৰ','ei','xei','teor'],
      tail:['','এতিয়া','জৰা','অনুগ্ৰহ কৰি','পুনৰ','প্ৰথমে','ধন্যবাদ','etiya','jora','punor','dhonyobad']
    }
  };

  /* =====================================================================
     2. TOPICS.  Each carries native script and roman spellings so that
        code switched input resolves correctly.
     ===================================================================== */
  var TOPIC={
    hub:{en:['hub','intelligence hub','control room','marketing hub','command room'],
         hi:['हब','कंट्रोल रूम','मार्केटिंग हब','hub','control room'],
         as:['হাব','কন্ট্ৰল ৰুম','hub','control room']},
    ga4:{en:['ga4','analytics','google analytics','traffic','sessions','web analytics'],
         hi:['एनालिटिक्स','जीए4','ट्रैफिक','analytics','ga4','traffic'],
         as:['এনালিটিক্স','জিএ4','ট্ৰেফিক','analytics','ga4','traffic']},
    lease:{en:['leasing','lease','snowflake','occupancy','renewal','funnel','prospect'],
           hi:['लीजिंग','लीज','ऑक्यूपेंसी','फनल','leasing','lease','snowflake','occupancy','funnel'],
           as:['লিজিং','লিজ','অকুপেন্সি','ফানেল','leasing','lease','snowflake','funnel']},
    gbp:{en:['review','reviews','business profile','gbp','listing','rating','google business'],
         hi:['रिव्यू','रेटिंग','लिस्टिंग','review','reviews','rating','gbp'],
         as:['ৰিভিউ','ৰেটিং','লিষ্টিং','review','reviews','rating','gbp']},
    gsc:{en:['search console','gsc','organic','seo','keyword','query','ranking'],
         hi:['सर्च कंसोल','ऑर्गेनिक','कीवर्ड','search console','gsc','organic','seo','keyword'],
         as:['ছাৰ্চ কনচল','অৰ্গানিক','কীৱৰ্ড','search console','gsc','organic','seo','keyword']},
    ads:{en:['ads','google ads','adcommand','ad command','ppc','paid search','campaign','spend','budget'],
         hi:['एड','एड्स','गूगल एड्स','कैंपेन','बजट','खर्च','ads','google ads','campaign','budget'],
         as:['এড','এডছ','গুগল এডছ','কেম্পেইন','বাজেট','খৰচ','ads','google ads','campaign','budget']},
    work:{en:['work','project','projects','portfolio','dashboard','dashboards','build','builds','case study'],
          hi:['काम','प्रोजेक्ट','डैशबोर्ड','पोर्टफोलियो','kaam','project','dashboard','portfolio'],
          as:['কাম','প্ৰজেক্ট','ডেছবৰ্ড','পৰ্টফলিঅ’','kaam','project','dashboard','portfolio']},
    results:{en:['result','results','numbers','impact','proof','metrics','achievement','outcome','stats'],
             hi:['नतीजे','नतीजा','रिजल्ट','आंकड़े','संख्या','natije','result','aankde','numbers'],
             as:['ফলাফল','ৰিজাল্ট','সংখ্যা','faslafol','result','xonkhya','numbers']},
    tools:{en:['tool','tools','stack','tech','technology','skill','skills','software','platform'],
           hi:['टूल','स्टैक','तकनीक','स्किल','tool','stack','skill','technology'],
           as:['টুল','ষ্টেক','প্ৰযুক্তি','দক্ষতা','tool','stack','skill','technology']},
    hire:{en:['hire','hiring','available','availability','freelance','contract','work together','onboard','engage'],
          hi:['हायर','उपलब्ध','फ्रीलांस','काम पर','hire','available','freelance'],
          as:['হায়াৰ','উপলব্ধ','ফ্ৰীলান্স','hire','available','freelance']},
    rate:{en:['rate','rates','price','pricing','cost','charge','fee','budget for','how much'],
          hi:['रेट','कीमत','दाम','शुल्क','कितना','rate','price','kitna','daam'],
          as:['ৰেট','দাম','মূল্য','কিমান','rate','price','kiman','daam']},
    exp:{en:['experience','years','background','career','history','worked','senior','journey'],
         hi:['अनुभव','साल','बैकग्राउंड','करियर','anubhav','experience','saal','career'],
         as:['অভিজ্ঞতা','বছৰ','বেকগ্ৰাউণ্ড','কেৰিয়াৰ','obhiggota','experience','bosor','career']},
    clients:{en:['client','clients','brand','brands','company','companies','worked with','customer'],
             hi:['क्लाइंट','ब्रांड','कंपनी','client','brand','company'],
             as:['ক্লাইণ্ট','ব্ৰেণ্ড','কোম্পানী','client','brand','company']},
    remote:{en:['remote','location','where','based','country','india','timezone','time zone','overlap','onsite'],
            hi:['रिमोट','कहां','कहाँ','भारत','टाइमजोन','remote','kahan','india','timezone'],
            as:['ৰিমোট','কʼত','ভাৰত','টাইমজোন','remote','kot','bharot','india','timezone']},
    process:{en:['process','how do you work','approach','method','workflow','steps','start a project','engagement'],
             hi:['प्रोसेस','तरीका','कैसे काम','अप्रोच','process','tarika','kaise kaam'],
             as:['প্ৰচেছ','ধৰণ','কেনেকৈ কাম','process','dhoron','kenekoi kaam']},
    timeline:{en:['timeline','how long','how many days','how soon','delivery','deadline','turnaround','when ready','duration','take to build','to build'],
              hi:['समय','कितने दिन','कब तक','डिलीवरी','samay','kitne din','kab tak','timeline'],
              as:['সময়','কিমান দিন','কেতিয়ালৈ','সময়সীমা','somoy','kiman din','timeline']},
    ai:{en:['ai','claude','artificial intelligence','llm','automation','automate','agent','gpt','model'],
        hi:['एआई','क्लॉड','ऑटोमेशन','ai','claude','automation','llm'],
        as:['এ আই','ক্লড','অটোমেশন','ai','claude','automation','llm']},
    data:{en:['data','sql','snowflake','bigquery','pipeline','warehouse','etl','database','query'],
          hi:['डेटा','एसक्यूएल','डेटाबेस','पाइपलाइन','data','sql','database','pipeline'],
          as:['ডেটা','এছকিউএল','ডেটাবেছ','পাইপলাইন','data','sql','database','pipeline']},
    demo:{en:['data real','real data','is it real','this real','client data','real client','actual data','actual client','fake','sample data','fictional','anonymized','vertex','privacy','confidential','made up','real numbers'],
          hi:['असली','नकली','सैंपल','काल्पनिक','asli','nakli','sample','fictional'],
          as:['সঁচা','নকলী','নমুনা','কাল্পনিক','sosa','nokoli','sample','fictional']},
    why:{en:['why','why him','why hire','why should','why deb','what makes him','different','unique','stand out','edge','special'],
         hi:['क्यों','क्यूं','अलग','खास','बेहतर','kyon','kyu','alag','khaas','behtar'],
         as:['কিয়','পৃথক','বিশেষ','ভাল','kiyo','prithok','bixex','bhal']},
    langs:{en:['language','languages','speak','english','hindi','assamese','bengali','communication'],
           hi:['भाषा','बोलते','अंग्रेजी','हिंदी','असमिया','bhasha','bolte','language'],
           as:['ভাষা','কয়','ইংৰাজী','হিন্দী','অসমীয়া','bhasa','koi','language']},
    contact:{en:['contact','email','reach','call','book','meeting','schedule','whatsapp','linkedin','connect'],
             hi:['संपर्क','ईमेल','कॉल','मीटिंग','बुक','sampark','email','call','meeting','book'],
             as:['যোগাযোগ','ইমেইল','কল','মিটিং','বুক','jogajog','email','call','meeting','book']},
    self:{en:['you','yourself','jarvis','who are you','what can you do','your name','bot','assistant','help'],
          hi:['तुम','आप','जार्विस','कौन हो','क्या कर सकते','मदद','tum','aap','jarvis','kaun ho','madad'],
          as:['তুমি','আপুনি','জাৰ্ভিছ','কোন','কি কৰিব পাৰা','সহায়','tumi','apuni','jarvis','kun','xohai']}
  };

  /* =====================================================================
     3. ANSWERS.  Multiple variants per topic per language, so repeated
        questions never get an identical reply. This is the "multiple
        thoughts" behaviour: same fact, different framing each time.
     ===================================================================== */
  var A={
    en:{
      work:['He has six live dashboards on this page, plus AdCommand as the flagship. Every one of them opens and runs in your browser right now. Want me to open one?',
            'The work is all real builds, not mockups: a marketing hub, a leasing dashboard, GA4 analytics, reviews, search console, and a Google Ads command center. Say the name and I will open it.'],
      results:['The headline numbers: over three million pounds a year in managed Google Ads spend, one hundred and twenty one million impressions and eighty six thousand conversions surfaced in one build, and more than a hundred ad accounts across his career.',
               'Four years, eight or more brands, a hundred plus ad accounts, and three million pounds a year in live ad budget. One Looker Studio build alone mapped one hundred and twenty one million impressions.'],
      tools:['Looker Studio, Power BI, Google Apps Script, Snowflake, GA4, BigQuery, Google Ads API, Python, React, and Claude for the AI layers.',
             'Mainly Looker Studio and Apps Script for the dashboards, Snowflake and BigQuery for the data, and Claude wired in for the analysis. React and FastAPI when something needs a real app.'],
      hire:['He is open to projects right now. Booking a call is at the bottom of this page, or email <b>'+E+'</b>.',
            'Yes, he is available. The fastest route is his calendar at the bottom of the page. Want me to take you there?'],
      rate:['Rates depend on scope, so he quotes per project after a short call. Nothing is templated, and the call is free.',
            'He prices per project rather than per hour, once he knows the scope. Book a short call and he will give you a number.'],
      exp:['Four plus years across marketing and data, managing three million pounds a year in ad spend for UK travel brands, now doing marketing and data engineering for a US property management company.',
           'His background is paid media at scale, then data and automation on top of it. Google Ads for UK travel brands, and now dashboards and AI tooling for property management in the US.'],
      clients:['He has delivered for UK travel brands including Southall Travel and Away Holidays, and currently builds internal tooling for a US property management company with around thirty five properties.',
               'Eight or more brands across travel and property. Scroll to the clients section and I can take you there.'],
      remote:['He works remotely from India and overlaps with UK and US hours. That has been the setup for his current role for a while now.',
              'Based in India, working remotely, used to both UK and US time zones. Remote has never been the blocker.'],
      process:['Short call to understand the problem, then a scoped plan, then a working build you can click. He tends to ship something usable early rather than disappear for a month.',
               'It starts with a call, then he scopes it, then you get a live version fast so you can react to something real instead of a document.'],
      timeline:['A focused dashboard usually lands in one to two weeks. Bigger pipelines take longer, and he tells you that up front rather than after.',
                'Usually one to two weeks for a dashboard, longer for data pipelines. He would rather give you an honest date than an optimistic one.'],
      ai:['The AI is not decoration. Claude reads the live account data and returns a graded, prioritized action plan, and it catches things like a broken conversion tag or geo waste that a human would scroll past.',
          'Every dashboard has an AI analyst built in. It grades health, ranks what to fix first, and explains why, using the actual numbers on screen.'],
      data:['Snowflake and BigQuery for warehousing, SQL for the modelling, Apps Script and Python for the pipelines. The leasing dashboard reads straight from Snowflake.',
            'He works the whole path: warehouse, query, pipeline, then the dashboard on top. Snowflake, BigQuery, SQL, Python.'],
      demo:['Everything in these demos is fictional sample data. The company, communities and numbers are invented, and the AI replies are canned, so nothing confidential is exposed. The production versions run on live data.',
            'These are anonymized portfolio versions. Real client data never leaves the client, so the demo runs on invented numbers for a fictional property group.'],
      why:['He sits between marketing and engineering, which is rare. He can run the ad account and then build the dashboard and the AI layer that watches it, so nothing gets lost handing over.',
           'Most people do the ads or the data. He does both, which means the reporting actually answers the marketing question instead of just displaying numbers.'],
      langs:['He works in English, and speaks Hindi and Assamese. I can talk to you in all three, just tap the language button.',
             'English for work, plus Hindi and Assamese. Switch my language any time with the button in this header.'],
      contact:['Email <b>'+E+'</b>, or book a call at the bottom of the page. I copied the email if you want it.',
               'The calendar link is at the bottom of the page, and the email is <b>'+E+'</b>.'],
      self:['I am Jarvis, the assistant on this site. I can open any live dashboard, give you a narrated tour, filter the work, answer questions about his experience, and take you to booking. I speak English, Hindi and Assamese.',
            'Jarvis. I run this page for you: say what you want to see and I will open it, in whichever of the three languages you prefer.'],
      greet:['Hello. Ask me anything about his work, or say "give me a tour".','Hi there. Want the tour, or shall I open a dashboard?'],
      thanks:['Any time.','Happy to help.'],
      bye:['Thanks for stopping by.','See you around.']
    },
    hi:{
      work:['इस पेज पर छह लाइव डैशबोर्ड हैं, और फ्लैगशिप है ऐडकमांड। हर एक ब्राउज़र में अभी चलता है। कोई खोलूं?',
            'सारा काम असली है, मॉकअप नहीं: मार्केटिंग हब, लीजिंग डैशबोर्ड, जीए4 एनालिटिक्स, रिव्यू, सर्च कंसोल और गूगल एड्स कमांड सेंटर।'],
      results:['मुख्य आंकड़े: हर साल तीस लाख पाउंड से ज़्यादा का गूगल एड्स खर्च, एक बिल्ड में बारह करोड़ इंप्रेशन और छियासी हज़ार कन्वर्ज़न, और करियर में सौ से ज़्यादा एड अकाउंट।',
               'चार साल, आठ से ज़्यादा ब्रांड, सौ से ज़्यादा एड अकाउंट, और हर साल तीस लाख पाउंड का लाइव एड बजट।'],
      tools:['लुकर स्टूडियो, पावर बीआई, गूगल ऐप्स स्क्रिप्ट, स्नोफ़्लेक, जीए4, बिगक्वेरी, गूगल एड्स एपीआई, पायथन, रिएक्ट, और एआई के लिए क्लॉड।'],
      hire:['ये अभी नए प्रोजेक्ट के लिए उपलब्ध हैं। पेज के नीचे कॉल बुक करें, या <b>'+E+'</b> पर ईमेल करें।'],
      rate:['रेट स्कोप पर निर्भर करता है, इसलिए एक छोटी कॉल के बाद प्रोजेक्ट के हिसाब से बताते हैं। कॉल मुफ़्त है।'],
      exp:['मार्केटिंग और डेटा में चार साल से ज़्यादा। यूके ट्रैवल ब्रांड्स के लिए हर साल तीस लाख पाउंड का एड खर्च संभाला, और अब एक अमेरिकी प्रॉपर्टी मैनेजमेंट कंपनी के लिए डेटा और ऑटोमेशन बनाते हैं।'],
      clients:['यूके के ट्रैवल ब्रांड्स जैसे साउथहॉल ट्रैवल और अवे हॉलिडेज़ के लिए काम किया, और अभी अमेरिका की एक प्रॉपर्टी मैनेजमेंट कंपनी के लिए इंटरनल टूल बनाते हैं।'],
      remote:['ये भारत से रिमोट काम करते हैं, और यूके व अमेरिका के घंटों से ओवरलैप करते हैं।'],
      process:['पहले एक छोटी कॉल, फिर स्कोप, फिर चलता हुआ बिल्ड जिसे आप क्लिक कर सकें। ये जल्दी कुछ काम का देते हैं, महीने भर गायब नहीं होते।'],
      timeline:['एक फोकस्ड डैशबोर्ड आम तौर पर एक से दो हफ़्ते में। बड़े पाइपलाइन में ज़्यादा समय लगता है, और ये पहले ही बता देते हैं।'],
      ai:['एआई सजावट नहीं है। क्लॉड लाइव डेटा पढ़कर ग्रेडेड, प्राथमिकता वाला एक्शन प्लान देता है, और टूटा कन्वर्ज़न टैग या फ़िज़ूल जियो खर्च पकड़ लेता है।'],
      data:['वेयरहाउस के लिए स्नोफ़्लेक और बिगक्वेरी, मॉडलिंग के लिए एसक्यूएल, पाइपलाइन के लिए ऐप्स स्क्रिप्ट और पायथन।'],
      demo:['इन डेमो में सारा डेटा काल्पनिक है। कंपनी, कम्युनिटी और नंबर बनाए हुए हैं, इसलिए कुछ भी गोपनीय बाहर नहीं जाता। असली वर्जन लाइव डेटा पर चलते हैं।'],
      why:['ये मार्केटिंग और इंजीनियरिंग के बीच बैठते हैं, जो दुर्लभ है। ये एड अकाउंट भी चला सकते हैं और उसके ऊपर डैशबोर्ड और एआई लेयर भी बना सकते हैं।'],
      langs:['ये अंग्रेज़ी में काम करते हैं, और हिन्दी व असमिया बोलते हैं। मैं तीनों में बात कर सकता हूँ।'],
      contact:['<b>'+E+'</b> पर ईमेल करें, या पेज के नीचे कॉल बुक करें।'],
      self:['मैं जार्विस हूँ, इस साइट का सहायक। मैं कोई भी लाइव डैशबोर्ड खोल सकता हूँ, टूर दे सकता हूँ, और आपको बुकिंग तक ले जा सकता हूँ। मैं अंग्रेज़ी, हिन्दी और असमिया बोलता हूँ।'],
      greet:['नमस्ते। इनके काम के बारे में कुछ भी पूछिए, या कहिए "टूर दिखाओ"।'],
      thanks:['कभी भी।'], bye:['आने के लिए धन्यवाद।']
    },
    as:{
      work:['এই পৃষ্ঠাত ছটা লাইভ ডেছবৰ্ড আছে, আৰু আটাইতকৈ ডাঙৰটো এডকমাণ্ড। প্ৰতিটোৱে ব্ৰাউজাৰতে চলে। এটা খুলি দিম নেকি?',
            'সকলো কাম সঁচা, মকআপ নহয়: মাৰ্কেটিং হাব, লিজিং ডেছবৰ্ড, জিএ4 এনালিটিক্স, ৰিভিউ, ছাৰ্চ কনচল আৰু গুগল এডছ কমাণ্ড চেণ্টাৰ।'],
      results:['মূল সংখ্যাবোৰ: বছৰেকত ত্ৰিশ লাখ পাউণ্ডতকৈ অধিক গুগল এডছ খৰচ, এটা বিল্ডত বাৰ কোটি ইম্প্ৰেছন আৰু ছয়াশী হাজাৰ কনভাৰ্ছন, আৰু কেৰিয়াৰত এশতকৈ অধিক এড একাউণ্ট।',
               'চাৰি বছৰ, আঠতকৈ অধিক ব্ৰেণ্ড, এশতকৈ অধিক এড একাউণ্ট, আৰু বছৰেকত ত্ৰিশ লাখ পাউণ্ডৰ লাইভ এড বাজেট।'],
      tools:['লুকাৰ ষ্টুডিঅ’, পাওৱাৰ বিআই, গুগল এপ্স স্ক্ৰিপ্ট, স্নোফ্লেক, জিএ4, বিগকুৱেৰী, গুগল এডছ এপিআই, পাইথন, ৰিয়েক্ট, আৰু এআইৰ বাবে ক্লড।'],
      hire:['তেওঁ এতিয়া নতুন প্ৰজেক্টৰ বাবে উপলব্ধ। পৃষ্ঠাৰ তলত কল বুক কৰক, বা <b>'+E+'</b>ত ইমেইল কৰক।'],
      rate:['ৰেট স্কোপৰ ওপৰত নিৰ্ভৰ কৰে, সেয়েহে এটা চমু কলৰ পিছত প্ৰজেক্ট অনুসৰি কয়। কলটো বিনামূলীয়া।'],
      exp:['মাৰ্কেটিং আৰু ডেটাত চাৰি বছৰতকৈ অধিক। ইউকেৰ ট্ৰেভেল ব্ৰেণ্ডৰ বাবে বছৰেকত ত্ৰিশ লাখ পাউণ্ডৰ এড খৰচ চম্ভালিছে, আৰু এতিয়া আমেৰিকাৰ এটা প্ৰপাৰ্টি কোম্পানীৰ বাবে ডেটা আৰু অটোমেশন সাজে।'],
      clients:['ইউকেৰ ট্ৰেভেল ব্ৰেণ্ড যেনে ছাউথহল ট্ৰেভেল আৰু এৱে হলিডেইজৰ বাবে কাম কৰিছে, আৰু এতিয়া আমেৰিকাৰ এটা প্ৰপাৰ্টি মেনেজমেণ্ট কোম্পানীৰ বাবে ইণ্টাৰনেল টুল সাজে।'],
      remote:['তেওঁ ভাৰতৰ পৰা ৰিমোট কাম কৰে, আৰু ইউকে আৰু আমেৰিকাৰ সময়ৰ সৈতে ঠিকে মিলে।'],
      process:['প্ৰথমে এটা চমু কল, তাৰ পিছত স্কোপ, তাৰ পিছত চলি থকা বিল্ড যিটো আপুনি ক্লিক কৰিব পাৰে। তেওঁ সোনকালে কামত দিয়া বস্তু এটা দিয়ে।'],
      timeline:['এটা নিৰ্দিষ্ট ডেছবৰ্ড সাধাৰণতে এক-দুই সপ্তাহত। ডাঙৰ পাইপলাইনত অধিক সময় লাগে, আৰু তেওঁ আগতেই কৈ দিয়ে।'],
      ai:['এআই সজ্জা নহয়। ক্লডে লাইভ ডেটা পঢ়ি গ্ৰেড কৰা, প্ৰাথমিকতা দিয়া এক্সন প্লেন দিয়ে, আৰু ভঙা কনভাৰ্ছন টেগ বা অপচয় হোৱা জিঅ’ খৰচ ধৰি পেলায়।'],
      data:['ৱেৰহাউছৰ বাবে স্নোফ্লেক আৰু বিগকুৱেৰী, মডেলিঙৰ বাবে এছকিউএল, পাইপলাইনৰ বাবে এপ্স স্ক্ৰিপ্ট আৰু পাইথন।'],
      demo:['এই ডেমোবোৰত সকলো ডেটা কাল্পনিক। কোম্পানী, কমিউনিটি আৰু সংখ্যা সজা, সেয়েহে গোপনীয় কিবা বাহিৰ নাযায়। আচল সংস্কৰণবোৰ লাইভ ডেটাত চলে।'],
      why:['তেওঁ মাৰ্কেটিং আৰু ইঞ্জিনিয়াৰিঙৰ মাজত থিয় হয়, যিটো বিৰল। তেওঁ এড একাউণ্টও চলাব পাৰে আৰু তাৰ ওপৰত ডেছবৰ্ড আৰু এআই স্তৰও সাজিব পাৰে।'],
      langs:['তেওঁ ইংৰাজীত কাম কৰে, আৰু হিন্দী আৰু অসমীয়া কয়। মই তিনিওটাতে কথা পাতিব পাৰোঁ।'],
      contact:['<b>'+E+'</b>ত ইমেইল কৰক, বা পৃষ্ঠাৰ তলত কল বুক কৰক।'],
      self:['মই জাৰ্ভিছ, এই ছাইটৰ সহায়ক। মই যিকোনো লাইভ ডেছবৰ্ড খুলিব পাৰোঁ, ট্যুৰ দিব পাৰোঁ, আৰু আপোনাক বুকিঙলৈ লৈ যাব পাৰোঁ। মই ইংৰাজী, হিন্দী আৰু অসমীয়া কওঁ।'],
      greet:['নমস্কাৰ। তেওঁৰ কামৰ বিষয়ে যিকোনো সোধক, বা কওক "ট্যুৰ দিয়ক"।'],
      thanks:['যিকোনো সময়তে।'], bye:['অহাৰ বাবে ধন্যবাদ।']
    }
  };

  /* small talk triggers, all languages together */
  var SMALL={
    greet:['hi','hello','hey','yo','namaste','नमस्ते','हेलो','नमस्कार','নমস্কাৰ','হেল্লো','good morning','good evening'],
    thanks:['thanks','thank you','thx','shukriya','धन्यवाद','शुक्रिया','ধন্যবাদ','dhanyavad','dhonyobad'],
    bye:['bye','goodbye','see you','alvida','अलविदा','বিদায়','tata','ok bye']
  };

  /* =====================================================================
     4. CAPACITY.  Reports the true size of the accepted phrasing space.
        Nothing here is stored as a sentence; the grammar accepts the
        product of the slots, in any order, for every topic.
     ===================================================================== */
  function capacity(){
    var total=0, per={};
    Object.keys(SLOT).forEach(function(lang){
      var s=SLOT[lang];
      var openForms=s.polite.length*s.verb_open.length*s.det.length*s.tail.length;
      var tellForms=s.polite.length*s.verb_tell.length*s.det.length*s.tail.length;
      var topicTerms=0;
      Object.keys(TOPIC).forEach(function(k){ topicTerms+=(TOPIC[k][lang]||[]).length; });
      /* every topic term can pair with an open frame and a tell frame,
         and word order is free, so multiply by 2 for order variants */
      var n=topicTerms*(openForms+tellForms)*2;
      per[lang]=n; total+=n;
    });
    return {total:total, perLanguage:per,
            topics:Object.keys(TOPIC).length,
            answers:(function(){var c=0;Object.keys(A).forEach(function(l){Object.keys(A[l]).forEach(function(k){c+=A[l][k].length;});});return c;})()};
  }

  return {SLOT:SLOT, TOPIC:TOPIC, A:A, SMALL:SMALL, capacity:capacity};
})();
