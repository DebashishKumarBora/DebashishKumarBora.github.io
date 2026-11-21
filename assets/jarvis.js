/* =====================================================================
   JARVIS  ·  v5, the portfolio assistant
   Concept and build by Debashish Kumar Bora.

   Sits on top of the chat shell in index.html:
     - understands questions through assets/jarvis-brain.js
     - runs real actions on the page: open demos, filter, scroll, book
     - keeps context, so "open it" and "tell me more" just work
     - tap to talk, with optional spoken replies (off until you turn them on)
     - speaks first only when it is genuinely useful, at most twice a visit
   No backend, no API key, nothing leaves the browser.
   ===================================================================== */
(function(){
  'use strict';

  var STORE='dkb_jarvis_v5';
  var NAME='Jarvis';
  var B=window.JARVIS_BRAIN||null;
  var E=(B&&B.links.email)||'debashishbora30@gmail.com';

  var S={
    status:'Knows Deb’s work',
    placeholder:'Ask me anything about Deb’s work',
    fallback:'I don’t have that one, and I’d rather not guess. Deb can answer it on a quick call, or start with one of these.',
    tour:['Quick tour. These are the numbers behind the work: over three million pounds a year in managed Google Ads budget, and more than a hundred ad accounts.',
          'These are the AI agents he builds for marketing teams: a Claude-style analyst over sixteen ad accounts, a performance review that writes itself, and private client reports.',
          'And these are the live dashboards. Every one of them opens and runs right here in the browser.',
          'If you like what you see, booking a call takes about thirty seconds. Just ask me any time.'],
    greet:'Good to meet you, <b>{n}</b>. Ask me anything, or say “show me his best work”.',
    micDenied:'I need microphone permission for voice. You can still type to me.',
    noSR:'Voice input is not supported in this browser, but you can type to me.',
    insecure:'The microphone only works on the live site over https, not from a local file.',
    voiceOn:'Voice replies on.', voiceOff:'Voice replies off.',
    backUnseen:'Welcome back{n}. You have not opened <b>{x}</b> yet. Want to see it?',
    backBook:'Welcome back{n}. Want to book a quick call with Deb?',
    nudge:'These all run live. Want a one minute tour?',
    exit:'Before you go: his calendar is one tap away.',
    yOpen:'Open it', yTour:'Give me a tour', yBook:'Book a call', no:'Not now',
    theme:'Theme switched.', top:'Back to the top.', stopped:'Stopped.'
  };

  /* ---------- environment ---------- */
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition||null;
  var TTS=window.speechSynthesis||null;
  var RM=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------- memory (per browser, never sent anywhere) ---------- */
  var mem=load();
  function load(){
    var d={visits:0,last:0,name:'',seen:[],voice:false,told:[]};
    try{var r=JSON.parse(localStorage.getItem(STORE)||'{}');for(var k in d)if(r[k]!==undefined)d[k]=r[k];}catch(e){}
    return d;
  }
  function save(){try{localStorage.setItem(STORE,JSON.stringify(mem));}catch(e){}}
  try{localStorage.removeItem('dkb_jarvis_v2');}catch(e){}      /* the old trilingual settings */
  function fill(s,v){if(v)for(var k in v)s=s.split('{'+k+'}').join(v[k]);return s;}
  function esc(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}

  /* ---------- elements ---------- */
  var fab=document.getElementById('chatFab');
  var panel=document.getElementById('chatPanel');
  var input=document.getElementById('chatInput');
  if(!fab||!panel) return;

  function el(tag,cls){var n=document.createElement(tag);n.className=cls;return n;}
  fab.classList.add('jv');
  fab.setAttribute('aria-label','Ask '+NAME+' about Deb');
  fab.innerHTML='';
  var halo=el('span','jv-halo'), body=el('span','jv-body'), orb=el('span','jv-core'),
      gloss=el('span','jv-gloss'), r1=el('span','jv-ring'), r2=el('span','jv-ring'),
      bars=el('span','jv-bars'), mini=el('span','jv-mini');
  bars.innerHTML='<i></i><i></i><i></i><i></i><i></i>'; mini.textContent='AI';
  [halo,body,orb,gloss,r1,r2,bars,mini].forEach(function(n){fab.appendChild(n);});
  var barEls=[].slice.call(bars.querySelectorAll('i'));
  try{ if(!localStorage.getItem('dkb_jv_seen')){ setTimeout(function(){
        fab.classList.add('bounce'); localStorage.setItem('dkb_jv_seen','1');
        setTimeout(function(){fab.classList.remove('bounce');},6000);
      },4200); } }catch(e){}

  /* header controls: tap to talk, and spoken replies */
  var SVG={
    mic:'<svg viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v4"/></svg>',
    spk:'<svg viewBox="0 0 24 24"><path d="M4 9v6h3l5 4V5L7 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8 8 0 0 1 0 12"/></svg>',
    mute:'<svg viewBox="0 0 24 24"><path d="M4 9v6h3l5 4V5L7 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>'
  };
  function mk(html,title){var b=document.createElement('button');b.innerHTML=html;b.title=title;b.type='button';b.setAttribute('aria-label',title);return b;}
  var top=panel.querySelector('.chat-top');
  var ctl=el('div','jv-ctl');
  var bMic=mk(SVG.mic,'Tap to talk');
  var bSpk=mk(mem.voice?SVG.spk:SVG.mute,'Spoken replies');
  ctl.appendChild(bMic); ctl.appendChild(bSpk);
  if(top){var x=top.querySelector('.x');top.insertBefore(ctl,x||null);}
  if(!SR) bMic.style.display='none';
  if(!TTS) bSpk.style.display='none';
  bSpk.classList.toggle('on',!!mem.voice);

  var whoEl=panel.querySelector('.who'), statEl=panel.querySelector('.stat'), avEl=panel.querySelector('.av');
  if(whoEl) whoEl.textContent=NAME.toUpperCase();
  if(statEl) statEl.innerHTML='<span class="d"></span>'+S.status;
  if(avEl) avEl.innerHTML='';
  if(input) input.setAttribute('placeholder',S.placeholder);

  var hear=el('div','jv-hear');
  hear.innerHTML='<span class="dot"></span><span id="jvHeard"></span>';
  var inputRow=panel.querySelector('.chat-input');
  if(inputRow) panel.insertBefore(hear,inputRow); else panel.appendChild(hear);
  var heardEl=document.getElementById('jvHeard');

  /* ---------- state ---------- */
  var state='idle';
  function setState(s){
    state=s;
    fab.classList.remove('listening','thinking','speaking');
    if(s!=='idle') fab.classList.add(s);
    hear.classList.toggle('on',s==='listening');
    mini.textContent=(s==='listening')?'':'AI';
  }

  /* =====================================================================
     VOICE OUT  (only after the visitor turns it on)
     ===================================================================== */
  var voice=null;
  function pickVoice(){
    if(!TTS) return null;
    var vs=TTS.getVoices()||[], pats=[/en-GB.*(daniel|arthur|male)/i,/daniel/i,/google uk english male/i,/en-GB/i,/en-US/i,/^en/i];
    for(var i=0;i<pats.length;i++) for(var j=0;j<vs.length;j++) if(pats[i].test(vs[j].name+' '+vs[j].lang)) return vs[j];
    return null;
  }
  if(TTS){ voice=pickVoice(); TTS.onvoiceschanged=function(){ voice=pickVoice(); }; }
  function strip(html){var d=document.createElement('div');d.innerHTML=String(html||'');return (d.textContent||'').replace(/\s+/g,' ').trim();}
  function speak(html){
    if(!TTS||!mem.voice) return;
    var s=strip(html); if(!s) return; if(s.length>420) s=s.slice(0,420);
    try{TTS.cancel();}catch(e){}
    var u=new SpeechSynthesisUtterance(s);
    if(voice){u.voice=voice;u.lang=voice.lang;} else u.lang='en-GB';
    u.rate=1.02; u.pitch=0.95;
    u.onstart=function(){ if(state!=='listening') setState('speaking'); };
    u.onend=u.onerror=function(){ if(state==='speaking') setState('idle'); };
    try{TTS.speak(u);}catch(e){}
  }
  function shutUp(){ try{TTS&&TTS.cancel();}catch(e){} if(state==='speaking')setState('idle'); }

  /* =====================================================================
     VOICE IN  ·  one question per tap
     ===================================================================== */
  var recog=null, listening=false;
  function isSecure(){return location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1';}
  function listenOnce(){
    if(!SR){ botTell(S.noSR); return; }
    if(!isSecure()){ botTell(S.insecure); return; }
    if(listening){ try{recog.stop();}catch(e){} return; }
    shutUp();
    if(!panel.classList.contains('open')&&typeof window.openChat==='function') window.openChat();
    recog=new SR(); recog.lang='en-US'; recog.interimResults=true; recog.maxAlternatives=1; recog.continuous=false;
    var finalText='';
    recog.onresult=function(e){
      var interim='';
      for(var i=e.resultIndex;i<e.results.length;i++){
        if(e.results[i].isFinal) finalText+=e.results[i][0].transcript; else interim+=e.results[i][0].transcript;
      }
      if(heardEl) heardEl.textContent=(finalText||interim).trim()||'…';
    };
    recog.onerror=function(e){
      if(e.error==='not-allowed'||e.error==='service-not-allowed') botTell(S.micDenied);
    };
    recog.onend=function(){
      listening=false; stopMeter(); bMic.classList.remove('on'); setState('idle');
      var q=finalText.trim(); if(q) handle(q);
    };
    try{ recog.start(); listening=true; bMic.classList.add('on'); setState('listening'); if(heardEl) heardEl.textContent='…'; beep(); startMeter(); }
    catch(err){ listening=false; }
  }

  /* live microphone meter, drives the orb bars while listening */
  var meterCtx=null, meterStream=null, meterRAF=null;
  function startMeter(){
    if(meterCtx||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia) return;
    navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
      var C=window.AudioContext||window.webkitAudioContext; if(!C||!listening){stream.getTracks().forEach(function(t){t.stop();});return;}
      meterStream=stream; meterCtx=new C();
      var an=meterCtx.createAnalyser(); an.fftSize=256; meterCtx.createMediaStreamSource(stream).connect(an);
      var data=new Uint8Array(an.frequencyBinCount);
      (function loop(){
        if(!meterCtx) return;
        an.getByteFrequencyData(data);
        for(var i=0;i<barEls.length;i++){ var v=data[3+i*4]||0; barEls[i].style.height=Math.max(6,Math.min(24,6+(v/255)*20)).toFixed(1)+'px'; }
        meterRAF=requestAnimationFrame(loop);
      })();
    }).catch(function(){});
  }
  function stopMeter(){
    if(meterRAF) cancelAnimationFrame(meterRAF); meterRAF=null;
    try{ meterStream&&meterStream.getTracks().forEach(function(t){t.stop();}); }catch(e){}
    try{ meterCtx&&meterCtx.close(); }catch(e){}
    meterCtx=null; meterStream=null; barEls.forEach(function(b){ b.style.height=''; });
  }
  function beep(){
    try{
      var C=window.AudioContext||window.webkitAudioContext; if(!C) return;
      var c=new C(),o=c.createOscillator(),g=c.createGain();
      o.type='sine';o.frequency.value=880;
      g.gain.setValueAtTime(0.0001,c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08,c.currentTime+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+0.2);
      o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+0.22);
      setTimeout(function(){try{c.close();}catch(e){}},400);
    }catch(e){}
  }

  /* =====================================================================
     TALKING THROUGH THE CHAT SHELL
     ===================================================================== */
  var origBotSay=window.botSay;
  if(typeof origBotSay==='function'){
    window.botSay=function(html){
      origBotSay.apply(this,arguments);
      speak(html);
      if(state==='thinking') setState('idle');
    };
  }
  function botTell(html,card,next){
    if(typeof window.botSay==='function') window.botSay(html,next||undefined,card?{topic:card}:undefined);
  }
  function userEcho(t){ if(typeof window.addUser==='function') window.addUser(t); }

  /* =====================================================================
     UNDERSTANDING
     ===================================================================== */
  var CTX={project:null,facet:null,intent:null,offer:null};

  function act(a){ if(a&&window.DKB&&window.DKB.act) window.DKB.act(a); }
  function chip(f){var c=document.querySelector('#filters .chip[data-f="'+f+'"]');if(c&&!c.classList.contains('active'))c.click();}

  function run(ans){
    if(ans.clear) CTX.offer=null;
    if(ans.project){ CTX.project=ans.project; CTX.facet=ans.facet||CTX.facet||'what'; }
    if(ans.intent){ CTX.intent=ans.intent; if(!ans.project){ CTX.project=null; CTX.facet=null; } }
    CTX.offer=ans.offer||null;
    botTell(ans.text,ans.card,ans.next);
    if(ans.filter) chip(ans.filter);
    if(ans.act){
      var a=ans.act;
      if(a.indexOf('demo:')===0){ remember(a.slice(5)); setTimeout(function(){act(a);},650); }
      else if(a==='tour') setTimeout(tour,500);
      else act(a);
    }
  }

  /* Chrome's built in model, used only when present, still facts only */
  var nano=null, nanoGone=false;
  async function nanoAsk(q){
    try{
      if(nanoGone||!('LanguageModel' in window)){ nanoGone=true; return null; }
      if((await window.LanguageModel.availability())!=='available'){ nanoGone=true; return null; }
      if(!nano){
        var sys='You are Jarvis, the assistant on Debashish Kumar Bora’s portfolio site. Answer only from these facts, '+
                'in two short sentences, warm and plain. If the facts do not cover it, say you do not have that detail and suggest a quick call. '+
                'Never invent numbers, names or dates. FACTS: '+(B?B.facts:'');
        try{ nano=await window.LanguageModel.create({initialPrompts:[{role:'system',content:sys}],
               expectedInputs:[{type:'text',languages:['en']}],expectedOutputs:[{type:'text',languages:['en']}]}); }
        catch(e1){ nano=await window.LanguageModel.create({initialPrompts:[{role:'system',content:sys}]}); }
      }
      var out=await Promise.race([nano.prompt(q),new Promise(function(_,rej){setTimeout(function(){rej(new Error('slow'));},9000);})]);
      return (out||'').trim()||null;
    }catch(e){ return null; }
  }

  function local(raw){
    var x=String(raw||'').toLowerCase().trim();
    var nm=x.match(/^(?:hi |hello |hey )?(?:my name is|i am|i'm|this is|call me) ([a-z][a-z]{1,20}(?: [a-z]{2,20})?)$/);
    if(nm&&!/\b(looking|interested|hiring|from|a |an |the )/.test(nm[1])){
      mem.name=nm[1].replace(/\b\w/g,function(c){return c.toUpperCase();});save();
      botTell(fill(S.greet,{n:esc(mem.name)}),null,B?B.chips.start:null); return true;
    }
    if(/^(stop|quiet|silence|shh+|stop talking)$/.test(x)){ shutUp(); botTell(S.stopped); return true; }
    if(/\b(dark mode|light mode|switch theme|change theme)\b/.test(x)){ var tb=document.getElementById('themeBtn'); if(tb){tb.click();botTell(S.theme);return true;} }
    if(/^(top|go to top|back to top|scroll to top)$/.test(x)){ window.scrollTo({top:0,behavior:RM?'auto':'smooth'}); botTell(S.top); return true; }
    var nav=x.match(/\b(?:go to|take me to|scroll to|jump to|show me)(?: the)? (about|services|clients|brands|contact|skills|stack|work|before and after|calculator|roi|estimator)(?: section)?$/);
    if(nav){
      var map={about:'#about',services:'#services',clients:'#clients',brands:'#clients',contact:'#contact',skills:'#skills',stack:'#skills',work:'#work','before and after':'#transform',calculator:'#roi',roi:'#roi',estimator:'#roi'};
      act('go:'+map[nav[1]]); botTell('Here you go.'); return true;
    }
    if(/^(show|filter)( me)?( only)?( the)? (looker( studio)?( builds| work| reports)?|looker studio work\??)$/.test(x)||/^looker studio work\??$/.test(x)||/^show the looker studio builds$/.test(x)){
      chip('looker'); act('go:#work'); botTell('Here are the two Looker Studio builds. They are reports rather than live apps, so tap a screenshot to zoom in.',null,['Show me an AI agent','Book a call']); return true;
    }
    if(/^(show( me)? (all|everything)|all work|show all projects)$/.test(x)){ chip('all'); botTell('Showing everything.'); return true; }
    return false;
  }

  function resolve(q){
    var ans=B?B.answer(q,CTX):null;
    if(ans){ run(ans); return; }
    setState('thinking');
    nanoAsk(q).then(function(txt){
      setState('idle');
      if(txt){ CTX.offer=null; botTell(esc(txt),null,B?B.chips.start:null); return; }
      CTX.offer=null;
      botTell(S.fallback,'welcome',B?B.chips.start:null);
    });
  }

  var origRespond=window.respond;
  window.respond=function(q){
    if(window.DKB&&window.DKB.egg&&window.DKB.egg(q)) return;
    if(local(q)) return;
    if(B) resolve(q); else if(typeof origRespond==='function') origRespond.call(window,q);
  };
  function handle(text){ userEcho(text); window.respond(text); }

  /* =====================================================================
     TOUR
     ===================================================================== */
  var tourTimers=[];
  function tour(){
    tourTimers.forEach(clearTimeout); tourTimers=[];
    var steps=[['#proof',''],['#work','agent'],['#work','app'],['#contact','all']];
    var narrow=window.innerWidth<680;
    if(narrow&&typeof window.closeChat==='function') window.closeChat();
    steps.forEach(function(st,i){
      tourTimers.push(setTimeout(function(){
        if(st[1]) chip(st[1]);
        var e=document.querySelector(st[0]); if(e) e.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});
        if(narrow) showToast(S.tour[i],null,null,true); else botTell(S.tour[i]);
        speak(S.tour[i]);
      }, i*6500));
    });
  }

  /* =====================================================================
     SPEAKING FIRST, sparingly
     ===================================================================== */
  var toast=el('div','jv-toast');
  toast.innerHTML='<p id="jvTMsg"></p><div class="row"><button class="pri" id="jvTYes"></button><button id="jvTNo"></button></div>';
  document.body.appendChild(toast);
  var tMsg=document.getElementById('jvTMsg'),tYes=document.getElementById('jvTYes'),tNo=document.getElementById('jvTNo');
  var toastTimer=null,toastAction=null,shown=0;
  function showToast(msg,yes,action,info){
    tMsg.innerHTML=msg;
    tYes.style.display=yes?'':'none'; tNo.style.display=yes?'':'none';
    tYes.textContent=yes||''; tNo.textContent=S.no; toastAction=action;
    toast.classList.add('up');
    clearTimeout(toastTimer); toastTimer=setTimeout(hideToast,info?6200:14000);
  }
  function nudge(msg,yes,action,key){
    if(shown>=2) return;
    if(key&&mem.told.indexOf(key)>=0) return;
    if(panel.classList.contains('open')) return;
    var dm=document.getElementById('dm'); if(dm&&dm.classList.contains('open')) return;
    shown++; if(key){mem.told.push(key);save();}
    showToast(msg,yes,action);
  }
  function hideToast(){toast.classList.remove('up');}
  tNo.addEventListener('click',hideToast);
  tYes.addEventListener('click',function(){hideToast();if(toastAction)toastAction();});

  function demos(){return (window.DKB&&window.DKB.demos)||[];}
  function remember(k){if(mem.seen.indexOf(k)<0){mem.seen.push(k);save();}}

  mem.visits=(mem.visits||0)+1;
  var gap=Date.now()-(mem.last||0); mem.last=Date.now(); save();
  setTimeout(function(){
    if(mem.visits>1&&gap>60000){
      var who=mem.name?(', '+esc(mem.name)):'';
      var unseen=demos().filter(function(d){return mem.seen.indexOf(d.k)<0;})[0];
      if(unseen) nudge(fill(S.backUnseen,{n:who,x:esc(unseen.t)}),S.yOpen,function(){remember(unseen.k);act('demo:'+unseen.k);});
      else nudge(fill(S.backBook,{n:who}),S.yBook,function(){act('book');});
    }
  },2600);

  var idleTimer=null,openedAny=false;
  var ws=document.getElementById('work');
  if(ws&&window.IntersectionObserver){
    new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){ clearTimeout(idleTimer); idleTimer=setTimeout(function(){ if(!openedAny) nudge(S.nudge,S.yTour,tour,'worknudge'); },24000); }
        else clearTimeout(idleTimer);
      });
    },{threshold:.25}).observe(ws);
  }
  document.addEventListener('click',function(e){
    var t=e.target.closest&&(e.target.closest('.thumb[data-live]')||e.target.closest('.links a.live'));
    if(t){ openedAny=true; var card=t.closest('.proj'); var h=card&&card.querySelector('h3');
      if(h) demos().forEach(function(d){ if(d.t===h.textContent) remember(d.k); }); }
  });
  var exitDone=false, T0=Date.now();
  document.addEventListener('mouseout',function(e){
    if(exitDone||e.relatedTarget||e.clientY>12||window.innerWidth<900) return;
    if(Date.now()-T0<25000||(window.scrollY||0)<900) return;
    exitDone=true; nudge(S.exit,S.yBook,function(){act('book');},'exit');
  });

  /* =====================================================================
     CONTROLS
     ===================================================================== */
  bMic.addEventListener('click',function(e){ e.stopPropagation(); listenOnce(); });
  bSpk.addEventListener('click',function(e){
    e.stopPropagation();
    mem.voice=!mem.voice; save();
    bSpk.classList.toggle('on',mem.voice);
    bSpk.innerHTML=mem.voice?SVG.spk:SVG.mute;
    if(mem.voice){ speak(S.voiceOn); } else { shutUp(); }
    if(typeof window.dkbToast==='function') window.dkbToast(mem.voice?S.voiceOn:S.voiceOff);
  });
  document.addEventListener('visibilitychange',function(){ if(document.hidden){ shutUp(); try{recog&&recog.stop();}catch(e){} } });

  window.Jarvis={
    say:function(x){botTell(x);},
    ask:function(q){handle(q);},
    listen:listenOnce,
    tour:tour,
    open:function(k){act('demo:'+k);},
    context:function(){return JSON.parse(JSON.stringify(CTX));},
    memory:function(){return JSON.parse(JSON.stringify(mem));},
    forget:function(){try{localStorage.removeItem(STORE);}catch(e){} mem=load();}
  };
})();
