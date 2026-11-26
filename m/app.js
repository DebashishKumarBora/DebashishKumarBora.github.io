/* =====================================================================
   DEB · MOBILE APP LOGIC
   Tabs, slide up sheets, a full screen demo viewer and the Jarvis chat,
   all driven by ../assets/site-data.js. The phone back button behaves
   like an app: it closes the demo, then the sheet, then goes home.
   ===================================================================== */
(function(){
  'use strict';
  var S=window.SITE; if(!S) return;
  function $(s,r){return (r||document).querySelector(s);}
  function $$(s,r){return [].slice.call((r||document).querySelectorAll(s));}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function ico(id){return '<svg class="ico"><use href="#i-'+id+'"/></svg>';}
  var IMG='../images/';
  var P=S.projects, byK={}; P.forEach(function(p){byK[p.k]=p;});
  var DESK=(location.protocol==='file:'?'../index.html':'../')+'?desktop=1';

  function shotsOf(p){return (p.shots&&p.shots.length?p.shots:[p.file]).map(function(s){return IMG+s;});}
  function phoneShotsOf(p){return (p.mshots||[]).map(function(s){return IMG+s;});}
  var BASE='https://debashishkumarbora.github.io/';
  function onSite(p){return !!p.live&&p.live.indexOf(BASE)===0;}
  /* demos on this site open in app mode: no credit badges, and the app's back
     button can close their panels. Demos hosted elsewhere open as they are. */
  function demoUrl(p,app){
    if(!p.live) return null;
    var u=onSite(p)?'../'+p.live.slice(BASE.length):p.live;
    if(location.protocol==='file:'&&onSite(p)&&/\/$/.test(u)) u+='index.html';   /* local preview only */
    if(app&&onSite(p)) u+=(u.indexOf('?')<0?'?':'&')+'embed=app';
    return u;
  }
  function shot(src,live,eager){
    return '<div class="shot"><img '+(eager?'':'data-lz loading="lazy" ')+'src="'+src+'" alt="" decoding="async">'+(live?'<span class="live">LIVE</span>':'')+'</div>';
  }
  /* images fade in once loaded, and quietly step aside if one is missing */
  document.addEventListener('load',function(e){var t=e.target;if(t&&t.tagName==='IMG')t.removeAttribute('data-lz');},true);
  document.addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='IMG'&&t.closest('.shot')){t.style.opacity=0;}},true);

  /* =====================================================================
     RENDERING
     ===================================================================== */
  function card(p,small,eager){
    return '<button class="pc'+(small?' sm':'')+' press" data-act="sheet:'+p.k+'">'+shot(shotsOf(p)[0],!!p.live,eager)+
      '<div class="pc-b"><b>'+esc(p.t)+'</b><span>'+esc(p.s)+'</span><small>'+esc(p.tool)+'</small></div></button>';
  }
  function tile(p){
    return '<button class="gc press" data-act="sheet:'+p.k+'">'+shot(shotsOf(p)[0],!!p.live,false)+
      '<div class="gc-b"><b>'+esc(p.t)+'</b><small>'+esc(p.tool)+'</small></div></button>';
  }
  function logo(b,big){
    var letter=esc(b.n.charAt(0));
    return '<span class="logo"><img src="https://www.google.com/s2/favicons?domain='+encodeURIComponent(b.domain)+'&sz='+(big?128:64)+'" alt="" loading="lazy" '+
      'onerror="this.parentNode.classList.add(\'mono\');this.parentNode.textContent=\''+letter+'\'"></span>';
  }
  var TINTS=[['rgba(34,211,238,.13)','#22D3EE'],['rgba(109,94,248,.16)','#9A90FF'],['rgba(52,211,153,.13)','#34D399'],['rgba(251,191,36,.13)','#FBBF24']];

  function renderHome(){
    $('#stats').innerHTML=S.stats.map(function(s){return '<div class="stat"><b>'+esc(s[0])+'</b><span>'+esc(s[1])+'</span></div>';}).join('');
    $('#railAgents').innerHTML=P.filter(function(p){return p.tag.indexOf('agent')>=0;}).map(function(p,i){return card(p,false,i<2);}).join('');
    $('#railDash').innerHTML=P.filter(function(p){return p.tag.indexOf('app')>=0;}).map(function(p){return card(p,true,false);}).join('');
    $('#brandGrid').innerHTML=S.brands.map(function(b,i){
      return '<button class="br press" data-act="brand:'+i+'">'+logo(b)+'<div><b>'+esc(b.n)+'</b><span>'+esc(b.sector)+'</span>'+(b.budget?'<em>'+esc(b.budget)+'</em>':'')+'</div></button>';}).join('');
    $('#services').innerHTML=S.services.map(function(s,i){
      return '<div class="row"><i style="--tint:'+TINTS[i][0]+';--ink:'+TINTS[i][1]+'">'+ico(s[0])+'</i><div><b>'+esc(s[1])+'</b><span>'+esc(s[2])+'</span></div><span></span></div>';}).join('');
    $('#steps').innerHTML=S.steps.map(function(s,i){return '<div><b>0'+(i+1)+'</b><span>'+esc(s)+'</span></div>';}).join('');
    renderAgents();
  }
  /* the Agent series, from the same list as the desktop site (../assets/agents-data.js) */
  var AG=window.DKB_AGENTS||[], agByK={}; AG.forEach(function(a){agByK[a.k]=a;});
  function renderAgents(){
    var box=$('#agentSeries'), head=$('#agentsHead'); if(!box) return;
    if(!AG.length){ box.hidden=true; if(head) head.hidden=true; return; }
    var html=AG.map(function(a){
      var c=a.change, l=c&&c.lines&&c.lines[0];
      return '<div class="agc">'+
        '<button class="agc-main press" data-act="agent:'+esc(a.k)+'" aria-label="See the '+esc(a.name)+' live run">'+
          '<div class="agc-top"><span class="agc-no">Agent '+esc(a.no)+'</span>'+(a.status?'<span class="agc-live"><i></i>'+esc(a.status)+'</span>':'')+'</div>'+
          '<b class="agc-nm">'+esc(a.name)+'</b><span class="agc-ln">'+esc(a.line)+'</span>'+
          (l?'<div class="agc-diff"><small>'+esc(l.field)+' · flagged for '+esc(l.flag)+'</small><div class="d"><span>'+esc(l.was)+'</span></div><div class="i">'+esc(l.now)+'</div></div>':'')+
          (c?'<div class="agc-steps">'+c.steps.map(function(s){return '<i>'+esc(s)+'</i>';}).join('')+'</div>':'')+
          '<div class="agc-proof">'+(a.proof||[]).map(function(p){return '<div><b>'+esc(p[0])+'</b><span>'+esc(p[2]||p[1])+'</span></div>';}).join('')+'</div>'+
        '</button>'+
        '<div class="agc-cta"><button class="btn pri press" data-act="agent:'+esc(a.k)+'">'+ico('play')+'See the live run</button>'+
          (byK[a.k]&&byK[a.k].live?'<button class="btn press" data-act="demo:'+esc(a.k)+'">Try it</button>':'')+'</div>'+
      '</div>';
    }).join('');
    var nx=String(AG.length+1); if(nx.length<2) nx='0'+nx;
    html+='<div class="agc-next"><span>Agent '+nx+'</span><div><b>Next in the series</b><small>It joins here when it ships.</small></div></div>';
    box.innerHTML=html;
  }
  /* an agent's write-up opens in the viewer, like a demo */
  function agentView(k){
    var a=agByK[k]; if(!a||!a.page) return null;
    return {k:'agent-'+k,t:a.name,live:BASE+a.page,sub:'Agent '+a.no+' · the live run',hash:'agent-'+k};
  }
  var filter='all';
  function renderWork(){
    var list=P.filter(function(p){return filter==='all'||p.tag.indexOf(filter)>=0;});
    $('#workGrid').innerHTML=list.map(tile).join('');
    var live=list.filter(function(p){return p.live;}).length;
    $('#workCount').textContent=list.length+(list.length===1?' build':' builds')+(live?' · '+live+' live':'');
    $$('#chips .chip').forEach(function(c){c.classList.toggle('on',c.getAttribute('data-f')===filter);});
  }
  function setFilter(f){ filter=f||'all'; renderWork(); }
  function renderAbout(){
    $('#bio').textContent=S.bio;
    $('#facts').innerHTML=S.facts.map(function(f){return '<div class="fact"><small>'+esc(f[0])+'</small><b>'+esc(f[1])+'</b></div>';}).join('');
    $('#timeline').innerHTML=S.experience.map(function(x){return '<div><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span><em>'+esc(x[2])+'</em></div>';}).join('');
    $('#tools').innerHTML=S.tools.map(function(t){return '<span>'+esc(t)+'</span>';}).join('');
    $('#certs').innerHTML=S.certs.map(function(c,i){
      return '<div class="row" style="cursor:default"><i style="--tint:'+TINTS[i%4][0]+';--ink:'+TINTS[i%4][1]+'">'+ico('cert')+'</i><div><b>'+esc(c[0])+'</b><span>'+esc(c[1])+'</span></div><span></span></div>';}).join('');
  }
  function renderContact(){
    var rows=[['msg','WhatsApp','Message Deb directly','wa','rgba(52,211,153,.13)','#34D399'],
              ['mail','Email',S.email,'email','rgba(34,211,238,.13)','#22D3EE'],
              ['brief','LinkedIn','Full work history','link:'+S.linkedin,'rgba(109,94,248,.16)','#9A90FF'],
              ['code','GitHub','The code behind the demos','link:'+S.github,'rgba(148,163,184,.14)','#AAB4C5']];
    $('#contactList').innerHTML=rows.map(function(r){
      return '<button class="row press" data-act="'+esc(r[3])+'"><i style="--tint:'+r[4]+';--ink:'+r[5]+'">'+ico(r[0])+'</i><div><b>'+esc(r[1])+'</b><span>'+esc(r[2])+'</span></div><svg class="ico chev"><use href="#i-chev"/></svg></button>';}).join('');
  }

  /* =====================================================================
     TABS AND THE BACK BUTTON
     ===================================================================== */
  var TABS=['home','work','ask','about','contact','lab'], cur=null, mem={};
  var bar=56;
  function urlFor(tab){return tab==='home'?location.pathname+location.search:'#'+tab;}
  function show(tab,opt){
    opt=opt||{};
    if(TABS.indexOf(tab)<0) tab='home';
    if(tab===cur&&!opt.force){
      if(opt.fromPop) return;
      if(tab==='ask') $('#askIn').focus();
      else window.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    if(cur) mem[cur]=window.scrollY;
    if(tab!=='ask') blurInput();
    var prev=cur; cur=tab;
    $$('.screen').forEach(function(s){s.classList.toggle('on',s.id==='s-'+tab);});
    $$('.tab').forEach(function(b){var g=b.getAttribute('data-go');b.classList.toggle('on',g===tab||(tab==='lab'&&g==='home'));});
    if(!opt.fromPop&&prev){
      var st={tab:tab};
      if(prev==='home'||tab==='lab'||prev==='lab') history.pushState(st,'',urlFor(tab));
      else history.replaceState(st,'',urlFor(tab));
    }
    var y=opt.top?0:(mem[tab]||0);
    window.scrollTo(0,y);
    if(tab==='ask') askOpened();
  }
  function jump(id){
    var el=document.getElementById(id); if(!el) return;
    window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-bar-10,behavior:'smooth'});
  }
  function goHash(h){
    var map={'#work':'work','#agents':'home:agentsHead','#workGrid':'work','#filters':'work','#clients':'home:brands','#trusted':'home:brands',
             '#lab':'lab','#roi':'lab','#transform':'lab','#about':'about','#skills':'about:toolsHead','#certs':'about:certsHead',
             '#contact':'contact','#services':'home:services','#process':'home:steps','#proof':'home','#top':'home'};
    var v=(map[h]||'home').split(':');
    show(v[0],{top:!v[1]});
    if(v[1]) setTimeout(function(){jump(v[1]);},80);
  }

  /* =====================================================================
     SHEET  (project details, brand details)
     ===================================================================== */
  var sheet=$('#sheet'), scrim=$('#scrim'), sBody=$('#sheetBody'), sFoot=$('#sheetFoot'), sheetOpen=false;
  function lockScroll(on){ document.documentElement.style.overflow=on?'hidden':''; }
  function blurInput(){ var a=document.activeElement; if(a&&a.blur&&a!==document.body) a.blur(); document.body.classList.remove('kb-open'); }
  function openSheet(tag){
    blurInput();
    var was=sheetOpen; sheetOpen=true;
    sBody.scrollTop=0; sheet.style.transform='';
    scrim.classList.add('on'); sheet.classList.add('on'); lockScroll(true);
    var st={tab:cur,overlay:'sheet'};
    if(was) history.replaceState(st,'','#'+tag); else history.pushState(st,'','#'+tag);
  }
  function closeSheet(fromPop){
    if(!sheetOpen) return;
    if(!fromPop&&history.state&&history.state.overlay==='sheet'){ history.back(); return; }
    sheetOpen=false; sheet.classList.remove('on','drag'); sheet.style.transform=''; scrim.classList.remove('on');
    if(!viewerOpen) lockScroll(false);
  }
  function openProject(k){
    var p=byK[k]; if(!p) return;
    var ph=phoneShotsOf(p), imgs=ph.length?ph:shotsOf(p), idx=P.indexOf(p), nx=P[(idx+1)%P.length];
    sBody.innerHTML='<div class="gal'+(ph.length?' ph':'')+'" id="gal">'+imgs.map(function(s,i){return shot(s,false,i<3);}).join('')+'</div>'+
      (imgs.length>1&&!ph.length?'<div class="dots" id="dots">'+imgs.map(function(_,i){return '<i'+(i?'':' class="on"')+'></i>';}).join('')+'</div>':'')+
      (ph.length?'<p class="gal-note">How the live demo looks on your phone</p>':(p.live&&!onSite(p)?'<p class="gal-note">Desktop screens. The live app runs on Google Apps Script</p>':''))+
      '<h3 class="ps-t">'+esc(p.t)+'</h3><div class="tags"><span class="tag">'+esc(p.tool)+'</span>'+
      (p.live?'<span class="tag ok">Live demo</span>':'<span class="tag">Report, no live app</span>')+'</div>'+
      '<p class="ps-one">'+esc(p.s)+'</p>'+
      '<div class="pbr"><div><small>The problem</small><p>'+esc(p.p)+'</p></div><div><small>What he built</small><p>'+esc(p.b)+'</p></div><div class="res"><small>The result</small><p>'+esc(p.r)+'</p></div></div>'+
      '<button class="next press" data-act="sheet:'+nx.k+'"><div><small>Next build</small><b>'+esc(nx.t)+'</b></div><svg class="ico" style="width:18px;height:18px;color:var(--faint)"><use href="#i-chev"/></svg></button>';
    sFoot.innerHTML=(p.live?'<button class="btn pri press" data-act="demo:'+p.k+'">'+ico('play')+'Open live demo</button>'
                           :'<button class="btn pri press" data-act="ask:Tell me about '+esc(p.t)+'">'+ico('spark')+'Ask Jarvis about it</button>')+
      (p.repo?'<a class="btn press" href="'+esc(p.repo)+'" target="_blank" rel="noopener" aria-label="View the code">'+ico('code')+'</a>':'')+
      (navigator.share?'<button class="btn press" data-act="share:'+p.k+'" aria-label="Share">'+ico('share')+'</button>':'');
    openSheet('p-'+k);
    var gal=$('#gal'), dots=$$('#dots i');
    if(gal&&dots.length) gal.addEventListener('scroll',function(){
      var i=Math.round(gal.scrollLeft/Math.max(1,gal.clientWidth)); dots.forEach(function(d,j){d.classList.toggle('on',j===i);});
    },{passive:true});
  }
  function openBrand(i){
    var b=S.brands[i]; if(!b) return;
    sBody.innerHTML='<div class="bsheet">'+logo(b,true)+'<h3>'+esc(b.n)+'</h3><div class="tags" style="justify-content:center;margin-top:8px"><span class="tag">'+esc(b.sector)+'</span>'+
      (b.budget?'<span class="tag ok">'+esc(b.budget)+' in Google Ads</span>':'')+'</div><p>'+esc(b.desc)+'</p></div>';
    sFoot.innerHTML='<a class="btn pri press" href="'+esc(b.url)+'" target="_blank" rel="noopener">'+ico('ext')+'Visit site</a>'+
      '<a class="btn press" href="'+esc(S.calendly)+'" target="_blank" rel="noopener">'+ico('cal')+'Book a call</a>';
    openSheet('brand');
  }
  $('#sheetX').addEventListener('click',function(){closeSheet();});
  scrim.addEventListener('click',function(){closeSheet();});
  /* drag the sheet down to close it */
  (function(){
    var y0=null,dy=0,fromBody=false;
    function start(e){
      fromBody=e.currentTarget===sBody;
      if(fromBody&&sBody.scrollTop>0) return;
      y0=e.touches[0].clientY; dy=0;
    }
    function move(e){
      if(y0===null) return;
      dy=e.touches[0].clientY-y0;
      if(dy<=0){ if(fromBody){y0=null;} sheet.style.transform=''; return; }
      if(fromBody&&sBody.scrollTop>0){y0=null;return;}
      sheet.classList.add('drag'); sheet.style.transform='translateY('+dy+'px)';
      if(e.cancelable) e.preventDefault();
    }
    function end(){
      if(y0===null) return; y0=null; sheet.classList.remove('drag');
      if(dy>110) closeSheet(); else sheet.style.transform='';
    }
    [$('#sheetGrab'),sBody].forEach(function(el){
      el.addEventListener('touchstart',start,{passive:true});
      el.addEventListener('touchmove',move,{passive:false});
      el.addEventListener('touchend',end); el.addEventListener('touchcancel',end);
    });
  })();

  /* =====================================================================
     LIVE DEMO VIEWER
     ===================================================================== */
  /* a fresh frame per demo: changing a frame's address would add steps to the phone's back history */
  var viewer=$('#viewer'), vBody=$('.vbody',viewer), vLoad=$('#vLoad'), vLoadTxt=$('span',vLoad), viewerOpen=false, vTimer=null, vSlow=null, vKey=null, vHash=null;
  var vSub=$('.vbar small',viewer), vSubDefault=vSub?vSub.textContent:'';
  var old=$('#vFrame'); if(old) old.remove();
  function openViewer(p,opt){
    opt=opt||{};
    var u=demoUrl(p,true); if(!u) return;
    blurInput();
    vKey=p.k; vHash=p.hash||('demo-'+p.k);
    $('#vTitle').textContent=p.t; $('#vExt').href=demoUrl(p,false);
    if(vSub) vSub.textContent=p.sub||vSubDefault;
    clearTimeout(vTimer); clearTimeout(vSlow); var prev=$('iframe',vBody); if(prev) prev.remove();
    vLoad.style.display='';
    var away=!onSite(p);
    vLoadTxt.textContent=away?'Starting the app on Google Apps Script':'Loading the live demo';
    vSlow=setTimeout(function(){ vLoadTxt.textContent='Still loading. You can also open it in a new tab with the button above.'; },away?9000:7000);
    var f=document.createElement('iframe'); f.title=p.t+' live demo'; f.src=u;
    f.setAttribute('allow','clipboard-write');
    f.addEventListener('load',function(){ vLoad.style.display='none'; clearTimeout(vSlow); });
    vBody.appendChild(f);
    var wasOpen=viewerOpen;
    viewer.classList.add('on'); viewerOpen=true; lockScroll(true);
    if(opt.replace&&wasOpen) history.replaceState({tab:cur,overlay:'viewer'},'','#'+vHash);
    else history.pushState({tab:cur,overlay:'viewer'},'','#'+vHash);
  }
  /* a page inside the viewer (an agent write-up) can ask to show its live demo instead */
  window.addEventListener('message',function(e){
    if(e.origin!==location.origin) return;
    var d=e.data||{};
    if(d&&d.dkb==='demo'&&byK[d.k]&&byK[d.k].live&&viewerOpen) openViewer(byK[d.k],{replace:true});
  });
  /* back inside a demo: let it close its own drawer, chat or page first */
  function innerBack(){
    var f=$('iframe',vBody); if(!f) return false;
    try{ var d=f.contentWindow&&f.contentWindow.DKB_DEMO; return !!(d&&typeof d.closeTop==='function'&&d.closeTop()); }
    catch(e){ return false; }   /* a demo on another site keeps its panels to itself */
  }
  function closeViewer(fromPop){
    if(!viewerOpen) return;
    if(!fromPop&&history.state&&history.state.overlay==='viewer'){ history.back(); return; }
    viewerOpen=false; viewer.classList.remove('on'); clearTimeout(vSlow);
    vTimer=setTimeout(function(){ if(!viewerOpen){ var f=$('iframe',vBody); if(f) f.remove(); } },360);
    if(!sheetOpen) lockScroll(false);
  }
  $('#vBack').addEventListener('click',function(){ if(innerBack()) return; closeViewer(); });

  window.addEventListener('popstate',function(e){
    var st=e.state||{tab:'home'};
    if(st.overlay!=='viewer'&&viewerOpen){
      /* the phone's back gesture closes the demo's own panel first, and the demo stays open */
      if(innerBack()){ history.pushState({tab:cur,overlay:'viewer'},'','#'+(vHash||('demo-'+vKey))); return; }
      closeViewer(true);
    }
    if(!st.overlay&&sheetOpen) closeSheet(true);
    show(st.tab||'home',{fromPop:true});
  });

  /* =====================================================================
     ACTIONS  (shared by buttons, cards and Jarvis)
     ===================================================================== */
  var toastT=null;
  function toast(t){var el=$('#toast');el.textContent=t;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('on');},2200);}
  function copyEmail(){
    var mail=function(){location.href='mailto:'+S.email;};
    try{ navigator.clipboard.writeText(S.email).then(function(){toast('Email copied: '+S.email);},mail); }catch(e){ mail(); }
  }
  function act(a){
    if(!a) return;
    var i=a.indexOf(':'), t=i<0?a:a.slice(0,i), arg=i<0?'':a.slice(i+1);
    if(t==='sheet') openProject(arg);
    else if(t==='brand') openBrand(+arg);
    else if(t==='demo'){ var p=byK[arg]; if(p) openViewer(p); }
    else if(t==='agent'){ var av=agentView(arg); if(av){ if(sheetOpen) closeSheet(); openViewer(av); } }
    else if(t==='book') window.open(S.calendly,'_blank','noopener');
    else if(t==='wa') window.open(S.whatsapp,'_blank','noopener');
    else if(t==='email') copyEmail();
    else if(t==='link') window.open(arg,'_blank','noopener');
    else if(t==='go') goHash(arg);
    else if(t==='f'){ setFilter(arg); show('work',{top:true}); }
    else if(t==='demos'){ setFilter('all'); show('work',{top:true}); }
    else if(t==='tab') show(arg,{top:true});
    else if(t==='ask'){ if(sheetOpen) closeSheet(); setTimeout(function(){ show('ask'); send(arg); },sheetOpen?60:0); }
    else if(t==='share'){ var q=byK[arg]; if(q&&navigator.share) navigator.share({title:q.t,text:q.s,url:location.origin+location.pathname+'#p-'+q.k}).catch(function(){}); }
  }
  document.addEventListener('click',function(e){
    var el=e.target.closest('[data-act],[data-go],[data-jump],[data-back]');
    if(!el) return;
    if(el.hasAttribute('data-back')){ history.state&&history.state.tab==='lab'?history.back():show('home'); return; }
    if(el.hasAttribute('data-act')){ e.preventDefault(); act(el.getAttribute('data-act')); return; }
    if(el.hasAttribute('data-jump')){ show('home'); setTimeout(function(){jump(el.getAttribute('data-jump'));},60); return; }
    var go=el.getAttribute('data-go'), f=el.getAttribute('data-f');
    if(f) setFilter(f); else if(go==='work'&&el.classList.contains('tab')===false&&!f) setFilter('all');
    show(go,{top:!!f});
  });
  $('#chips').addEventListener('click',function(e){var c=e.target.closest('.chip');if(c){setFilter(c.getAttribute('data-f'));window.scrollTo({top:0,behavior:'smooth'});}});

  /* =====================================================================
     JARVIS  (the same brain as the desktop site)
     ===================================================================== */
  var msgs=$('#msgs'), qchips=$('#qchips'), askIn=$('#askIn'), started=false;
  var CTX={project:null,facet:null,intent:null,offer:null};
  function brain(){return window.JARVIS_BRAIN||null;}
  function START(){var b=brain();return (b&&b.chips&&b.chips.start)||['What does he do?','Show me his best work','Is he available?','Book a call'];}
  function scrollDown(){ requestAnimationFrame(function(){ msgs.scrollTop=msgs.scrollHeight; }); }
  /* a card's picture arriving late should not push its buttons out of view */
  msgs.addEventListener('load',function(){ if(msgs.scrollHeight-msgs.scrollTop-msgs.clientHeight<420) scrollDown(); },true);
  function add(cls,html){var d=document.createElement('div');d.className=cls;d.innerHTML=html;msgs.appendChild(d);scrollDown();return d;}
  function bot(html){return add('msg bot',html);}
  function me(text){return add('msg you',esc(text));}
  function chipsSet(list){ qchips.innerHTML=(list||[]).map(function(c){return '<button type="button" class="press">'+esc(c)+'</button>';}).join(''); qchips.scrollLeft=0; }
  qchips.addEventListener('click',function(e){var b=e.target.closest('button');if(b) send(b.textContent);});
  function btns(list){
    return '<div class="att abtn">'+list.map(function(b){return '<button type="button" class="press'+(b[2]?' p':'')+'" data-act="'+esc(b[1])+'">'+esc(b[0])+'</button>';}).join('')+'</div>';
  }
  function mrail(list){
    return '<div class="att"><div class="mrail">'+list.map(function(p){return '<button class="mini press" data-act="sheet:'+p.k+'">'+shot(shotsOf(p)[0],!!p.live,true)+'<b>'+esc(p.t)+'</b></button>';}).join('')+'</div></div>';
  }
  function attach(topic){
    if(!topic) return '';
    var live=P.filter(function(p){return p.live;});
    if(topic==='welcome') return '<div class="att tiles">'+[
        ['grid','See the work',live.length+' live demos','tab:work'],['flask','Try the data lab','Clean a messy CSV','tab:lab'],
        ['chart','The numbers','Budget, accounts, brands','ask:What results has he delivered?'],['cal','Book a call','Thirty minute intro','book']]
      .map(function(t){return '<button class="tile press" data-act="'+t[3]+'">'+ico(t[0])+'<b>'+t[1]+'</b><span>'+t[2]+'</span></button>';}).join('')+'</div>';
    if(topic.indexOf('one:')===0){
      var p=byK[topic.slice(4)]; if(!p) return '';
      return '<div class="att one">'+shot(shotsOf(p)[0],!!p.live,true)+'<div class="one-b">'+
        (p.live?'<button class="btn pri press" data-act="demo:'+p.k+'">'+ico('play')+'Open live demo</button>':'')+
        '<button class="btn press" data-act="sheet:'+p.k+'">Details</button></div></div>';
    }
    if(topic==='series'){ var ag=AG[0]; return ag?btns([['See the live run','agent:'+ag.k,1],['Try it','demo:'+ag.k],['Agent series','go:#agents']]):''; }
    if(topic==='agents') return mrail(P.filter(function(p){return p.tag.indexOf('agent')>=0;}));
    if(topic==='dash') return mrail(P.filter(function(p){return p.tag.indexOf('app')>=0;}));
    if(/^(work|demo|demos)$/.test(topic)) return mrail(live);
    if(topic==='results') return '<div class="att mstats">'+S.stats.map(function(s){return '<div><b>'+esc(s[0])+'</b><span>'+esc(s[1])+'</span></div>';}).join('')+'</div>'+btns([['Which brands?','ask:Which brands has he worked with?'],['Book a call','book',1]]);
    if(topic==='brands') return btns([['See the brands','go:#clients'],['Book a call','book',1]]);
    if(topic==='hire'||topic==='contact') return btns([['Book a call','book',1],['WhatsApp','wa'],['Copy email','email']]);
    if(topic==='links') return btns([['LinkedIn','link:'+S.linkedin,1],['GitHub','link:'+S.github],['Copy email','email']]);
    if(topic==='looker') return btns([['Show the Looker Studio builds','f:looker',1],['Book a call','book']]);
    if(topic==='about') return btns([['About Deb','tab:about'],['See the work','tab:work'],['Book a call','book',1]]);
    if(topic==='edu') return btns([['See the credentials','go:#certs'],['LinkedIn','link:'+S.linkedin]]);
    if(topic==='tools') return btns([['See his tools','go:#skills'],['See the work','tab:work']]);
    return '';
  }
  function goLabel(h){return {'#lab':'Open the data lab','#clients':'See the brands','#work':'See the work','#agents':'See the Agent series','#contact':'Contact','#about':'About Deb'}[h]||null;}
  function typing(on){
    var t=$('.typing',msgs); if(t) t.remove();
    if(on){ add('typing','<i></i><i></i><i></i>'); }
  }
  function reply(a){
    if(!a){
      CTX.offer=null;
      bot('I don’t have that one, and I’d rather not guess. Deb can answer it on a quick call, or start with one of these.');
      msgs.insertAdjacentHTML('beforeend',attach('welcome')); chipsSet(START()); scrollDown(); return;
    }
    if(a.clear) CTX.offer=null;
    if(a.project){CTX.project=a.project;CTX.facet=a.facet||CTX.facet||'what';}
    if(a.intent){CTX.intent=a.intent;if(!a.project){CTX.project=null;CTX.facet=null;}}
    CTX.offer=a.offer||null;
    var text=a.text, topic=a.card, action=a.act;
    if(action==='tour'){ text='The quick version: start with the four AI agents, then the live dashboards. If you like what you see, booking a call takes thirty seconds.'; topic='agents'; action=null; }
    bot(text);
    var extra=attach(topic);
    if(action&&action.indexOf('go:')===0){ var l=goLabel(action.slice(3)); if(l) extra+=btns([[l,action,1]]); }
    if(extra){ msgs.insertAdjacentHTML('beforeend',extra); scrollDown(); }
    chipsSet(a.next||START());
    if(action&&action.indexOf('demo:')===0) setTimeout(function(){act(action);},650);
  }
  function send(q){
    q=String(q||'').trim(); if(!q) return;
    if(!started) greet(true);
    me(q); askIn.value='';
    var b=brain(), a=b?b.answer(q,CTX):null;
    if(a&&a.act==='book') window.open(S.calendly,'_blank','noopener');   /* inside the tap, so it is never blocked */
    typing(true);
    setTimeout(function(){ typing(false); reply(a); },380+Math.min(520,((a&&a.text)||'').length*2));
  }
  function greet(quiet){
    if(started) return; started=true;
    bot('Hi, I’m <b>Jarvis</b>. Ask me anything about Deb’s work, or tap a starting point.');
    if(!quiet) msgs.insertAdjacentHTML('beforeend',attach('welcome'));
    chipsSet(START()); scrollDown();
  }
  function askOpened(){ greet(false); scrollDown(); }
  $('#askForm').addEventListener('submit',function(e){ e.preventDefault(); send(askIn.value); });
  askIn.addEventListener('focus',function(){ document.body.classList.add('kb-open'); setTimeout(scrollDown,250); });
  askIn.addEventListener('blur',function(){ setTimeout(function(){document.body.classList.remove('kb-open');},120); });
  /* tap to talk, where the phone supports it */
  (function(){
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition, btn=$('#micBtn');
    if(!SR||!window.isSecureContext) return;
    btn.hidden=false; var rec=null;
    btn.addEventListener('click',function(){
      if(rec){ try{rec.stop();}catch(e){} return; }
      rec=new SR(); rec.lang='en-US'; rec.interimResults=true; rec.continuous=false;
      var fin='';
      rec.onresult=function(e){ var t=''; for(var i=e.resultIndex;i<e.results.length;i++){ if(e.results[i].isFinal) fin+=e.results[i][0].transcript; else t+=e.results[i][0].transcript; } askIn.value=(fin||t).trim(); };
      rec.onerror=function(e){ if(e.error==='not-allowed') toast('Microphone permission is needed for voice.'); };
      rec.onend=function(){ btn.classList.remove('on'); rec=null; if(fin.trim()) send(fin); };
      try{ rec.start(); btn.classList.add('on'); }catch(e){ rec=null; }
    });
  })();

  /* =====================================================================
     THEME, LINKS, START
     ===================================================================== */
  var root=document.documentElement, tb=$('#themeBtn');
  function paintTheme(){
    var light=root.getAttribute('data-theme')==='light';
    tb.innerHTML='<svg class="ico"><use href="#i-'+(light?'sun':'moon')+'"/></svg>';
    var m=document.querySelector('meta[name="theme-color"]'); if(m) m.setAttribute('content',light?'#F3F4F9':'#0A0B14');
  }
  tb.addEventListener('click',function(){
    var nx=root.getAttribute('data-theme')==='light'?'dark':'light';
    root.setAttribute('data-theme',nx); try{localStorage.setItem('dkb_theme',nx);}catch(e){} paintTheme();
  });
  paintTheme();
  $$('[data-wa]').forEach(function(a){a.href=S.whatsapp;});
  $$('[data-book]').forEach(function(a){a.href=S.calendly;});
  $$('.deskLink').forEach(function(a){a.href=DESK;});
  var wn=$('#wideNote'); if(wn) wn.href=DESK;
  $$('.yr').forEach(function(y){y.textContent=new Date().getFullYear();});

  renderHome(); renderWork(); renderAbout(); renderContact();

  /* deep links from the desktop site or a shared link */
  (function boot(){
    var h=(location.hash||'').slice(1), tab='home', after=null;
    var alias={clients:'home:brands',trusted:'home:brands',services:'home:services',process:'home:steps',skills:'about:toolsHead',certs:'about:certsHead',
               roi:'lab',transform:'lab',proof:'home',agents:'home:agentsHead',workGrid:'work',filters:'work'};
    if(TABS.indexOf(h)>=0) tab=h;
    else if(/^agent-/.test(h)&&agentView(h.slice(6))){ tab='home'; after=function(){openViewer(agentView(h.slice(6)));}; }
    else if(/^p-/.test(h)&&byK[h.slice(2)]){ tab='work'; after=function(){openProject(h.slice(2));}; }
    else if(/^demo-/.test(h)&&byK[h.slice(5)]){ tab='work'; after=function(){var p=byK[h.slice(5)];openProject(p.k);if(p.live)openViewer(p);}; }
    else if(alias[h]){ var v=alias[h].split(':'); tab=v[0]; if(v[1]) after=function(){setTimeout(function(){jump(v[1]);},120);}; }
    history.replaceState({tab:tab},'',urlFor(tab));
    show(tab,{fromPop:true,force:true,top:true});
    if(after) after();
  })();

  window.DKB={projects:P,act:act,show:show,send:send};
})();
