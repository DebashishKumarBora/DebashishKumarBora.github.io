/* =====================================================================
   JARVIS  ·  voice layer for the portfolio assistant
   Concept and build by Debashish Kumar Bora.

   Wraps the existing DataBot rather than replacing it:
     - speaks every reply the bot renders
     - listens for "hey jarvis" and for tap-to-talk
     - runs real actions on the page (open demos, filter, navigate, book)
     - remembers visitors between sessions
     - speaks first when something is worth saying
   No backend, no API key, no data leaves the browser.
   ===================================================================== */
(function(){
  'use strict';

  /* ---------- config ---------- */
  var NAME      = 'Jarvis';                 // change this string to rename the assistant
  var WAKE      = ['hey jarvis','hi jarvis','ok jarvis','jarvis'];
  var STORE     = 'dkb_jarvis_v1';
  var VOICE_PREF= [/en-GB.*(male|daniel|arthur)/i, /daniel/i, /arthur/i, /google uk english male/i,
                   /en-GB/i, /en-US/i, /^en/i];

  /* ---------- environment ---------- */
  var SR   = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var TTS  = window.speechSynthesis || null;
  var RM   = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------- memory ---------- */
  var mem = load();
  function load(){
    var d={visits:0, last:0, name:'', seen:[], muted:false, wake:false, toldAbout:[]};
    try{ var r=JSON.parse(localStorage.getItem(STORE)||'{}');
         for(var k in d) if(r[k]!==undefined) d[k]=r[k];
    }catch(e){}
    return d;
  }
  function save(){ try{ localStorage.setItem(STORE, JSON.stringify(mem)); }catch(e){} }

  /* ---------- elements ---------- */
  var fab   = document.getElementById('chatFab');
  var panel = document.getElementById('chatPanel');
  var logEl = document.getElementById('chatLog');
  var input = document.getElementById('chatInput');
  if(!fab || !panel) return;

  /* build the orb */
  fab.classList.add('jv');
  fab.setAttribute('aria-label','Talk to '+NAME);
  var orb = document.createElement('span'); orb.className='jv-core';
  var r1  = document.createElement('span'); r1.className='jv-ring';
  var r2  = document.createElement('span'); r2.className='jv-ring';
  var bars= document.createElement('span'); bars.className='jv-bars';
  bars.innerHTML='<i></i><i></i><i></i><i></i><i></i>';
  var mini= document.createElement('span'); mini.className='jv-mini'; mini.textContent='J';
  fab.appendChild(orb); fab.appendChild(r1); fab.appendChild(r2); fab.appendChild(bars); fab.appendChild(mini);

  /* header controls */
  var top = panel.querySelector('.chat-top');
  var ctl = document.createElement('div'); ctl.className='jv-ctl';
  var bMic  = mk('&#127908;','Tap to talk');
  var bSpk  = mk('&#128266;','Voice replies');
  var bWake = mk('&#128225;','Wake word: say "hey '+NAME.toLowerCase()+'"');
  function mk(html,title){var b=document.createElement('button');b.innerHTML=html;b.title=title;b.type='button';return b;}
  ctl.appendChild(bMic); ctl.appendChild(bSpk); ctl.appendChild(bWake);
  if(top){ var closeBtn=top.querySelector('.x'); top.insertBefore(ctl, closeBtn||null); }

  /* the assistant takes the configured name (single source of truth) */
  var whoEl=panel.querySelector('.who'), statEl=panel.querySelector('.stat'), avEl=panel.querySelector('.av');
  if(whoEl) whoEl.textContent=NAME.toUpperCase();
  if(statEl) statEl.innerHTML='<span class="d"></span>Voice assistant '+(SR?'\u00b7 say "hey '+NAME.toLowerCase()+'"':'\u00b7 ready');
  if(avEl) avEl.textContent='\u25C9';
  if(!SR){ bMic.style.display='none'; bWake.style.display='none'; }
  if(!TTS){ bSpk.style.display='none'; }
  if(!mem.muted) bSpk.classList.add('on');
  fab.classList.toggle('muted', !!mem.muted);

  /* live transcript strip */
  var hear=document.createElement('div'); hear.className='jv-hear';
  hear.innerHTML='<span class="dot"></span><span id="jvHeard">Listening</span>';
  var inputRow=panel.querySelector('.chat-input');
  if(inputRow) panel.insertBefore(hear, inputRow); else panel.appendChild(hear);
  var heardEl=document.getElementById('jvHeard');

  /* ---------- state ---------- */
  var state='idle', armed=false, wantWake=false, recog=null, recogOn=false, voiceUnlocked=false;
  function setState(s){
    state=s;
    fab.classList.remove('listening','thinking','speaking');
    if(s!=='idle') fab.classList.add(s);
    hear.classList.toggle('on', s==='listening');
    if(s==='listening'){ mini.textContent=''; } else { mini.textContent = mem.muted?'\u2715':'J'; }
  }

  /* =====================================================================
     VOICE OUT
     ===================================================================== */
  var voice=null;
  function pickVoice(){
    if(!TTS) return null;
    var vs=TTS.getVoices()||[];
    if(!vs.length) return null;
    for(var i=0;i<VOICE_PREF.length;i++){
      for(var j=0;j<vs.length;j++){
        if(VOICE_PREF[i].test(vs[j].name+' '+vs[j].lang)) return vs[j];
      }
    }
    return vs[0];
  }
  if(TTS){
    voice=pickVoice();
    TTS.onvoiceschanged=function(){ voice=pickVoice(); };
  }
  function strip(html){
    var d=document.createElement('div'); d.innerHTML=String(html||'');
    var t=(d.textContent||'').replace(/\s+/g,' ').trim();
    return t.replace(/https?:\/\/\S+/g,'the link on screen');
  }
  function speak(text,opts){
    if(!TTS || mem.muted || !voiceUnlocked) return;
    var t=strip(text); if(!t) return;
    if(t.length>420) t=t.slice(0,420)+'.';
    try{ TTS.cancel(); }catch(e){}
    var u=new SpeechSynthesisUtterance(t);
    if(voice) u.voice=voice;
    u.rate=(opts&&opts.rate)||1.02; u.pitch=(opts&&opts.pitch)||0.92; u.volume=1;
    u.onstart=function(){ if(state!=='listening') setState('speaking'); };
    u.onend=function(){ if(state==='speaking') setState('idle'); if(armedAfterSpeak){armedAfterSpeak=false; listenOnce();} };
    u.onerror=function(){ if(state==='speaking') setState('idle'); };
    try{ TTS.speak(u); }catch(e){}
  }
  var armedAfterSpeak=false;
  function shutUp(){ try{ TTS&&TTS.cancel(); }catch(e){} if(state==='speaking') setState('idle'); }

  /* unlock audio on the first real gesture (browsers block autoplay) */
  function unlock(){
    if(voiceUnlocked||!TTS) return;
    voiceUnlocked=true;
    try{ var u=new SpeechSynthesisUtterance(' '); u.volume=0; TTS.speak(u); }catch(e){}
  }
  ['click','touchstart','keydown'].forEach(function(ev){
    document.addEventListener(ev, unlock, {once:true, passive:true});
  });

  /* =====================================================================
     VOICE IN
     ===================================================================== */
  function buildRecog(){
    if(!SR) return null;
    var r=new SR();
    r.lang='en-US'; r.interimResults=true; r.maxAlternatives=1; r.continuous=true;
    r.onresult=function(e){
      var interim='', finalTxt='';
      for(var i=e.resultIndex;i<e.results.length;i++){
        var tr=e.results[i][0].transcript;
        if(e.results[i].isFinal) finalTxt+=tr; else interim+=tr;
      }
      var shown=(finalTxt||interim).trim();
      if(shown) heardEl.textContent=shown;

      if(!armed){
        var low=(finalTxt||interim).toLowerCase();
        for(var w=0;w<WAKE.length;w++){
          if(low.indexOf(WAKE[w])>=0){
            var after=low.split(WAKE[w]).pop().trim();
            arm();
            if(after && after.split(' ').length>1){ armed=false; handle(after); }
            return;
          }
        }
        return;
      }
      if(finalTxt.trim()){
        var cmd=finalTxt.trim(); armed=false;
        setState('thinking'); heardEl.textContent=cmd;
        handle(cmd);
      }
    };
    r.onerror=function(e){
      if(e.error==='not-allowed'||e.error==='service-not-allowed'){
        wantWake=false; bWake.classList.remove('on'); mem.wake=false; save();
        recogOn=false; setState('idle');
        botTell('I need microphone permission for voice. You can still type to me.');
      }
    };
    r.onend=function(){
      recogOn=false;
      if(wantWake){ setTimeout(startRecog,350); }      // Chrome auto-stops, so restart
      else if(state==='listening'){ setState('idle'); armed=false; }
    };
    return r;
  }
  function startRecog(){
    if(!SR||recogOn) return;
    if(!recog) recog=buildRecog();
    try{ recog.start(); recogOn=true; }catch(e){}
  }
  function stopRecog(){
    wantWake=false; armed=false;
    try{ recog&&recog.stop(); }catch(e){}
    recogOn=false; setState('idle');
  }
  function arm(){
    armed=true; setState('listening');
    heardEl.textContent='Listening';
    if(!panel.classList.contains('open') && typeof window.openChat==='function') window.openChat();
    beep();
  }
  function listenOnce(){
    unlock();
    if(!SR){ botTell('Voice input is not supported in this browser, but you can type to me.'); return; }
    wantWake = wantWake || mem.wake;
    startRecog(); arm();
  }

  /* soft chime so it feels responsive */
  function beep(){
    try{
      var C=window.AudioContext||window.webkitAudioContext; if(!C) return;
      var c=new C(), o=c.createOscillator(), g=c.createGain();
      o.type='sine'; o.frequency.value=880;
      g.gain.setValueAtTime(0.0001,c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.09,c.currentTime+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+0.22);
      o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+0.24);
      setTimeout(function(){ try{c.close();}catch(e){} },400);
    }catch(e){}
  }

  /* =====================================================================
     WIRE THE BOT: speak whatever it renders, intercept commands
     ===================================================================== */
  var origBotSay = window.botSay;
  if(typeof origBotSay==='function'){
    window.botSay=function(html,next){
      origBotSay.apply(this,arguments);
      speak(html);
      if(state==='thinking') setState(mem.muted?'idle':'speaking');
    };
  }
  function botTell(html,next){
    if(typeof window.botSay==='function') window.botSay(html,next);
    else speak(html);
  }
  function userEcho(t){ if(typeof window.addUser==='function') window.addUser(t); }

  var origRespond = window.respond;
  if(typeof origRespond==='function'){
    window.respond=function(q){
      if(runAction(q)) return;          // Jarvis handles it
      setState('thinking');
      origRespond.apply(this,arguments); // fall through to the existing brain
    };
  }
  function handle(text){
    userEcho(text);
    if(typeof window.respond==='function') window.respond(text);
    else if(!runAction(text)) botTell('I did not catch that.');
  }

  /* =====================================================================
     ACTIONS  ·  the part that makes it an assistant, not a chatbot
     ===================================================================== */
  var DEMOS=[
    {k:'hub',    n:'Marketing Intelligence Hub', m:['hub','intelligence hub','control room','marketing hub']},
    {k:'ga4',    n:'Analytics Dashboard',        m:['ga4','analytics','google analytics','traffic']},
    {k:'lease',  n:'Leasing Dashboard',          m:['leasing','snowflake','lease','occupancy']},
    {k:'gbp',    n:'Reviews Dashboard',          m:['review','reviews','business profile','gbp','listing']},
    {k:'gsc',    n:'Search Console Dashboard',   m:['search console','gsc','organic','seo']},
    {k:'ads',    n:'AdCommand',                  m:['ad command','adcommand','ads','google ads','ppc','command center']}
  ];
  function findDemo(t){
    for(var i=0;i<DEMOS.length;i++){
      for(var j=0;j<DEMOS[i].m.length;j++){ if(t.indexOf(DEMOS[i].m[j])>=0) return DEMOS[i]; }
    }
    return null;
  }
  function cardFor(d){
    var cards=[].slice.call(document.querySelectorAll('.proj'));
    for(var i=0;i<cards.length;i++){
      var h=cards[i].querySelector('h3'); if(!h) continue;
      var t=h.textContent.toLowerCase();
      if(d.k==='hub'   && t.indexOf('hub')>=0) return cards[i];
      if(d.k==='ga4'   && t.indexOf('analytics dashboard')>=0) return cards[i];
      if(d.k==='lease' && t.indexOf('leasing')>=0) return cards[i];
      if(d.k==='gbp'   && t.indexOf('reviews')>=0) return cards[i];
      if(d.k==='gsc'   && t.indexOf('search console')>=0) return cards[i];
    }
    return null;
  }
  function go(sel,quiet){
    var el=document.querySelector(sel); if(!el) return false;
    el.scrollIntoView({behavior:RM?'auto':'smooth', block:'start'});
    return true;
  }
  function openDemoFor(d){
    if(d.k==='ads'){
      var fl=document.querySelector('.flag-actions a[href^="http"]');
      if(fl && window.__openDemo){ window.__openDemo(fl.getAttribute('href'), d.n); return true; }
      if(fl){ fl.click(); return true; }
      return false;
    }
    var card=cardFor(d);
    if(card){
      var thumb=card.querySelector('.thumb[data-live]');
      var url=thumb&&thumb.getAttribute('data-live');
      if(url && window.__openDemo){ window.__openDemo(url, d.n); return true; }
      card.scrollIntoView({behavior:RM?'auto':'smooth',block:'center'}); return true;
    }
    return false;
  }
  function remember(k){ if(mem.seen.indexOf(k)<0){ mem.seen.push(k); save(); } }

  function runAction(raw){
    var t=String(raw||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
    if(!t) return false;

    /* stop talking */
    if(/^(stop|quiet|shut up|be quiet|silence|pause)$/.test(t)){ shutUp(); return true; }

    /* name capture */
    var nm=t.match(/(?:my name is|i am|i'm|this is|call me) ([a-z][a-z ]{1,28})$/);
    if(nm){
      mem.name=nm[1].replace(/\b\w/g,function(c){return c.toUpperCase();}).trim(); save();
      botTell('Good to meet you, <b>'+esc(mem.name)+'</b>. Ask me to open any dashboard, or say "give me a tour".');
      return true;
    }

    /* open a demo */
    if(/(open|show|launch|run|see|view|demo|try)/.test(t)){
      var d=findDemo(t);
      if(d){
        botTell('Opening the <b>'+esc(d.n)+'</b> live demo now.');
        remember(d.k);
        setTimeout(function(){ openDemoFor(d); }, 420);
        return true;
      }
    }

    /* tour */
    if(/(tour|walk me|walkthrough|show me around|guide me)/.test(t)){ tour(); return true; }

    /* filters */
    if(/(live app|apps only|built apps|web app)/.test(t)){ chip('app'); botTell('Filtered to the live apps. Each of these opens a working demo.'); return true; }
    if(/(looker)/.test(t)){ chip('looker'); botTell('Here are the Looker Studio builds.'); return true; }
    if(/(all work|everything|show all)/.test(t)){ chip('all'); botTell('Showing everything.'); return true; }

    /* navigate */
    if(/(work|project|dashboard)/.test(t) && /(show|see|go|take|scroll|where)/.test(t)){
      go('#work'); botTell('Here is the work. Say "open the leasing dashboard" and I will launch it.'); return true; }
    if(/(about|who is he|background|experience|story)/.test(t) && /(go|show|tell|scroll)/.test(t)){
      go('#about'); botTell('Scrolling to the background.'); return true; }
    if(/(skill|stack|tool)/.test(t) && /(go|show|scroll)/.test(t)){ go('#skills'); botTell('Here is the stack.'); return true; }
    if(/(client|brand)/.test(t) && /(go|show|scroll)/.test(t)){ go('#clients'); botTell('These are the brands he has delivered for.'); return true; }

    /* booking and contact */
    if(/(book|call|meeting|schedule|hire|available|talk to deb|contact)/.test(t)){
      go('#contact');
      botTell('Booking is at the bottom of the page. You can grab a slot on his calendar, or email <b>debashishbora30@gmail.com</b>.');
      return true;
    }
    if(/(email|mail address)/.test(t)){
      copy('debashishbora30@gmail.com');
      botTell('His email is <b>debashishbora30@gmail.com</b>. I copied it to your clipboard.');
      return true;
    }

    /* theme */
    if(/(dark mode|light mode|switch theme|change theme|toggle theme)/.test(t)){
      var tb=document.getElementById('themeBtn'); if(tb){ tb.click(); botTell('Theme switched.'); return true; }
    }

    /* top of page */
    if(/^(top|go to top|home|start over)$/.test(t)){ window.scrollTo({top:0,behavior:RM?'auto':'smooth'}); botTell('Back to the top.'); return true; }

    /* identity */
    if(/(who are you|what are you|your name|what can you do|help me|commands)/.test(t)){
      botTell('I am '+NAME+', the assistant on this site. I can <b>open any live dashboard</b>, give you a <b>guided tour</b>, filter the work, answer questions about his experience, and take you to <b>booking</b>. Try saying "open the leasing dashboard".');
      return true;
    }
    return false;
  }
  function chip(f){
    var c=document.querySelector('#filters .chip[data-f="'+f+'"]');
    if(c) c.click();
  }
  function copy(s){ try{ navigator.clipboard&&navigator.clipboard.writeText(s); }catch(e){} }
  function esc(s){ return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  /* guided tour: narrated, cancellable */
  var tourTimers=[];
  function tour(){
    tourTimers.forEach(clearTimeout); tourTimers=[];
    var steps=[
      {t:0,    sel:'#proof',  say:'Quick tour. These are the numbers behind the work: three million pounds a year in managed ad spend, and one hundred and twenty one million impressions surfaced.'},
      {t:7000, sel:'.flagship', say:'This is AdCommand, the flagship. A Google Ads command center running sixteen accounts with a Claude analyst built in.'},
      {t:14000,sel:'#work',   say:'Below are six live dashboards. Every one of them opens and runs right here in the browser.'},
      {t:20000,sel:'#contact',say:'And if you like what you see, booking a call takes about thirty seconds. Say "book a call" any time.'}
    ];
    steps.forEach(function(s){
      tourTimers.push(setTimeout(function(){
        var el=document.querySelector(s.sel);
        if(el) el.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});
        botTell(s.say);
      }, s.t));
    });
  }

  /* =====================================================================
     PROACTIVE  ·  speaks first, but never before a gesture
     ===================================================================== */
  var toast=document.createElement('div'); toast.className='jv-toast';
  toast.innerHTML='<p id="jvTMsg"></p><div class="row"><button class="pri" id="jvTYes"></button><button id="jvTNo">Not now</button></div>';
  document.body.appendChild(toast);
  var tMsg=document.getElementById('jvTMsg'), tYes=document.getElementById('jvTYes'), tNo=document.getElementById('jvTNo');
  var toastTimer=null, toastAction=null, shownCount=0;

  function nudge(msg, yesLabel, action, key){
    if(shownCount>=2) return;                        // never nag
    if(key && mem.toldAbout.indexOf(key)>=0) return;
    if(panel.classList.contains('open')) return;
    if(document.getElementById('dm') && document.getElementById('dm').classList.contains('open')) return;
    shownCount++;
    if(key){ mem.toldAbout.push(key); save(); }
    tMsg.innerHTML=msg; tYes.textContent=yesLabel; toastAction=action;
    toast.classList.add('up');
    speak(msg);
    clearTimeout(toastTimer);
    toastTimer=setTimeout(hideToast, 14000);
  }
  function hideToast(){ toast.classList.remove('up'); }
  tNo.addEventListener('click', hideToast);
  tYes.addEventListener('click', function(){ hideToast(); if(toastAction) toastAction(); });

  /* returning visitor */
  mem.visits=(mem.visits||0)+1;
  var gap=Date.now()-(mem.last||0);
  mem.last=Date.now(); save();

  setTimeout(function(){
    if(mem.visits>1 && gap>60000){
      var who=mem.name?(', '+esc(mem.name)):'';
      var unseen=DEMOS.filter(function(d){ return mem.seen.indexOf(d.k)<0 && d.k!=='ads'; })[0];
      if(unseen){
        nudge('Welcome back'+who+'. You have not seen the <b>'+esc(unseen.n)+'</b> yet. Want me to open it?',
              'Open it', function(){ remember(unseen.k); openDemoFor(unseen); });
      }else{
        nudge('Welcome back'+who+'. Want to book a quick call with Deb?','Book a call',function(){ go('#contact'); });
      }
    }
  }, 2600);

  /* idle on the work section without opening anything */
  var idleTimer=null, openedAny=false;
  var workIO=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){
        clearTimeout(idleTimer);
        idleTimer=setTimeout(function(){
          if(openedAny) return;
          nudge('These all run live. Want me to open one and walk you through it?','Give me a tour',tour,'worknudge');
        }, 22000);
      } else { clearTimeout(idleTimer); }
    });
  },{threshold:.25});
  var workSec=document.getElementById('work'); if(workSec) workIO.observe(workSec);
  document.addEventListener('click',function(e){
    if(e.target.closest && (e.target.closest('.thumb[data-live]')||e.target.closest('.links a.live'))) openedAny=true;
  });

  /* exit intent, desktop only */
  var exitDone=false;
  document.addEventListener('mouseout',function(e){
    if(exitDone||e.relatedTarget||e.clientY>12||window.innerWidth<900) return;
    exitDone=true;
    nudge('Before you go: I can send you straight to Deb\u2019s calendar.','Book a call',function(){ go('#contact'); },'exit');
  });

  /* =====================================================================
     CONTROLS
     ===================================================================== */
  bMic.addEventListener('click', function(e){
    e.stopPropagation(); unlock();
    if(armed){ stopRecog(); return; }
    listenOnce();
  });
  bSpk.addEventListener('click', function(e){
    e.stopPropagation();
    mem.muted=!mem.muted; save();
    bSpk.classList.toggle('on', !mem.muted);
    fab.classList.toggle('muted', mem.muted);
    if(mem.muted){ shutUp(); } else { unlock(); speak('Voice on.'); }
    mini.textContent = mem.muted?'\u2715':'J';
  });
  bWake.addEventListener('click', function(e){
    e.stopPropagation(); unlock();
    mem.wake=!mem.wake; save();
    bWake.classList.toggle('on', mem.wake);
    if(mem.wake){
      wantWake=true; startRecog();
      botTell('Wake word is on. Say <b>"hey '+NAME.toLowerCase()+'"</b> and I will listen.');
    }else{
      stopRecog();
      botTell('Wake word is off. Tap the microphone when you want me.');
    }
  });
  if(mem.wake){ bWake.classList.add('on'); }

  /* restore wake listening after the first gesture (mic needs one anyway) */
  document.addEventListener('click', function once(){
    if(mem.wake && SR && !recogOn){ wantWake=true; startRecog(); }
    document.removeEventListener('click', once);
  });

  /* pause everything when the tab is hidden */
  document.addEventListener('visibilitychange', function(){
    if(document.hidden){ shutUp(); try{ recog&&recog.stop(); }catch(e){} }
    else if(mem.wake && SR){ setTimeout(startRecog,400); }
  });

  /* let the rest of the page talk to Jarvis */
  window.Jarvis={
    say:function(t){ botTell(t); },
    listen:listenOnce,
    tour:tour,
    open:function(k){ var d=findDemo(String(k).toLowerCase()); if(d) openDemoFor(d); },
    memory:function(){ return JSON.parse(JSON.stringify(mem)); },
    forget:function(){ try{ localStorage.removeItem(STORE); }catch(e){} mem=load(); }
  };
})();
