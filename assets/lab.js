/* =====================================================================
   DATA LAB  ·  a messy export in, a dashboard and plain English out.
   Pick a sample or drop in a CSV. Everything runs in the visitor's
   browser: the file is read locally and never uploaded anywhere.
   Concept and build by Debashish Kumar Bora.
   ===================================================================== */
(function(){
  'use strict';
  var root=document.getElementById('lab'); if(!root) return;
  function $(s){return root.querySelector(s);}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  var NF=new Intl.NumberFormat('en-GB');
  var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  /* =====================================================================
     1. SAMPLE EXPORTS, deliberately messy, the way real ones arrive
     ===================================================================== */
  function hr(a,b){var x=Math.sin(a*12.9898+b*78.233)*43758.5453;return x-Math.floor(x);}
  function day0(){var t=new Date();t.setHours(12,0,0,0);t.setDate(t.getDate()-1);return t;}
  function addD(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x;}
  function p2(n){return ('0'+n).slice(-2);}
  function isoD(d){return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate());}
  function dmyD(d){return p2(d.getDate())+'/'+p2(d.getMonth()+1)+'/'+d.getFullYear();}
  function longD(d){return MON[d.getMonth()]+' '+d.getDate()+', '+d.getFullYear();}
  function q(s){return '"'+String(s).replace(/"/g,'""')+'"';}
  function money(v){return '£'+v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');}
  function thou(v){return v>=1000?q(NF.format(v)):String(v);}

  function sampleAds(){
    var C=[['Brand Search',900,.11,.85,.15,0,0],['Generic Search',2600,.036,2.3,.05,0,1],['Performance Max',5200,.012,1.05,.055,1,0],
           ['Remarketing',3800,.008,.6,.065,0,0],['Demand Gen',6000,.006,.72,.022,0,0]];
    var end=day0(), N=84, rows=[];
    for(var i=0;i<N;i++){
      var d=addD(end,i-N+1), dow=d.getDay(), wk=(dow===0||dow===6)?.82:1, late=i>=N-28;
      C.forEach(function(c,ci){
        var grow=c[5]&&late?1+.45*(i-(N-28))/28:1;
        var impr=Math.round(c[1]*wk*grow*(.88+hr(i,ci)*.24));
        var clicks=Math.round(impr*c[2]*(.9+hr(ci,i)*.2));
        var cost=clicks*c[3]*(.9+hr(i+7,ci)*.2);
        var cvr=c[6]&&late?c[4]*(1-.42*(i-(N-28))/28):c[4];
        var conv=Math.round(clicks*cvr*(.75+hr(i,ci+9)*.5));
        rows.push([i%11===3?dmyD(d):isoD(d),c[0],impr,clicks,cost,conv]);
      });
    }
    var out=['Campaign performance report','"'+longD(addD(end,-N+1))+' to '+longD(end)+'"','Day,Campaign,Impressions,Clicks,Cost,Conversions'];
    rows.forEach(function(r,k){
      var name=r[1];
      if(k===0||k%97===5) name=name.toLowerCase().replace(/^./,function(c){return c.toUpperCase();});
      if(k%89===6) name=name+' ';
      var conv=(k===1||k%151===40)?'N/A':(k%173===60?'--':r[5]);
      var line=[r[0],name.indexOf(' ')>=0?q(name):name,thou(r[2]),r[3],q(money(r[4])),conv].join(',');
      out.push(line);
      if(k===2||k===150||k===301) out.push('');
      if(k===3||k===77||k===240) out.push(line);
    });
    var T=rows.reduce(function(a,r){a[0]+=r[2];a[1]+=r[3];a[2]+=r[4];a[3]+=r[5];return a;},[0,0,0,0]);
    out.push('Total: Account,,'+q(NF.format(T[0]))+','+T[1]+','+q(money(T[2]))+','+T[3]);
    return out.join('\n');
  }

  function sampleGA4(){
    var C=[['Organic Search',820,.64,.021,.6],['Paid Search',610,.58,.032,0],['Direct',450,.52,.026,0],
           ['Paid Social',700,.29,.006,0],['Referral',160,.61,.018,0],['Email',140,.72,.048,0]];
    var end=day0(), N=56, out=['# ----------------------------------------','# Traffic acquisition: Session default channel group','# '+isoD(addD(end,-N+1)).replace(/-/g,'')+'-'+isoD(end).replace(/-/g,''),'# ----------------------------------------',
      'Date,Session default channel group,Sessions,Engaged sessions,Key events'];
    var k=0;
    for(var i=0;i<N;i++){
      var d=addD(end,i-N+1), dow=d.getDay(), wk=(dow===0||dow===6)?.78:1;
      C.forEach(function(c,ci){
        var s=Math.round(c[1]*wk*(1+c[4]*i/N)*(.86+hr(i,ci)*.28)), e=Math.round(s*c[2]*(.93+hr(ci,i)*.14)), ke=Math.round(s*c[3]*(.7+hr(i,ci+5)*.6));
        var name=c[0];
        if(k===0||k%83===9) name=name.toLowerCase();
        if(k%71===12) name=name+' ';
        var line=[isoD(d).replace(/-/g,''),q(name),thou(s),thou(e),k===2||k%131===50?'(not set)':ke].join(',');
        out.push(line);
        if(k===4||k===180) out.push('');
        if(k===5||k===200) out.push(line);
        k++;
      });
    }
    return out.join('\n');
  }

  function sampleLeasing(){
    var C=[['Harbor Commons',62,.44,.42,.62],['The Linden',48,.40,.40,.58],['Cedar Row',90,.21,.38,.55],['Lakeview Terrace',41,.52,.47,.70],['Aster Yards',55,.36,.33,.50]];
    var end=day0(); while(end.getDay()!==1) end=addD(end,-1);
    var N=16, out=['Weekly leasing funnel by community','Week,Community,Leads,Tours,Applications,Leases'], k=0;
    for(var w=0;w<N;w++){
      var d=addD(end,(w-N+1)*7);
      C.forEach(function(c,ci){
        var leads=Math.round(c[1]*(.8+hr(w,ci)*.4)), tours=Math.round(leads*c[2]*(.85+hr(ci,w)*.3)),
            apps=Math.round(tours*c[3]*(.8+hr(w+3,ci)*.4)), leases=Math.round(apps*c[4]*(.8+hr(w,ci+4)*.4));
        var name=c[0]; if(k===1||k%37===8) name=name.toLowerCase(); if(k%29===11) name=' '+name;
        var line=[q(longD(d)),q(name),k%23===4?q(' '+leads+' '):leads,tours,k===2||k%41===20?'n/a':apps,leases].join(',');
        out.push(line);
        if(k===3||k===44) out.push(',,,,,');
        if(k===4) out.push(line);
        k++;
      });
    }
    return out.join('\n');
  }

  var SAMPLES={ads:{n:'a sample Google Ads export',make:sampleAds},ga4:{n:'a sample GA4 traffic export',make:sampleGA4},lease:{n:'a sample leasing report',make:sampleLeasing}};

  /* =====================================================================
     2. READING ANY CSV
     ===================================================================== */
  function sniff(text){
    var lines=text.split(/\r?\n/).slice(0,12).join('\n'), best=',', bc=-1;
    [',',';','\t','|'].forEach(function(d){var c=lines.split(d).length; if(c>bc){bc=c;best=d;}});
    return best;
  }
  function parseCSV(text){
    text=text.replace(/^﻿/,'');
    var d=sniff(text), rows=[], row=[], cell='', inQ=false, i=0, ch;
    for(;i<text.length;i++){
      ch=text[i];
      if(inQ){ if(ch==='"'){ if(text[i+1]==='"'){cell+='"';i++;} else inQ=false; } else cell+=ch; continue; }
      if(ch==='"') inQ=true;
      else if(ch===d){ row.push(cell); cell=''; }
      else if(ch==='\n'||ch==='\r'){ if(ch==='\r'&&text[i+1]==='\n') i++; row.push(cell); rows.push(row); row=[]; cell=''; }
      else cell+=ch;
    }
    if(cell!==''||row.length){ row.push(cell); rows.push(row); }
    return rows;
  }

  var MISSING=/^\s*(n\/?a|na|null|none|nan|-+|\(not set\)|not set|#n\/a|#div\/0!|#ref!|\?)\s*$/i;
  function numParse(raw){
    var s=String(raw).trim(); if(s==='') return {v:null,blank:true};
    if(MISSING.test(s)) return {v:null,missing:true};
    var neg=/^\(.*\)$/.test(s)||/^-/.test(s), cur=(s.match(/[£$€₹]/)||[''])[0], pct=/%$/.test(s);
    var t=s.replace(/[£$€₹%\s()]/g,'').replace(/^-/,'');
    if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t=t.replace(/\./g,'').replace(',','.');      /* 1.234,56 */
    if(/^\d+,\d{1,2}$/.test(t)) t=t.replace(',','.');                                        /* 1234,56 */
    t=t.replace(/,(?=\d{3}(\D|$))/g,'');                                                   /* 1,234 */
    var o2z=/\d[oO]|[oO]\d/.test(t); if(o2z) t=t.replace(/[oO]/g,'0');
    if(!/^\d*\.?\d+$/.test(t)) return {v:null,bad:true};
    var v=parseFloat(t); if(neg) v=-v;
    return {v:v,cur:cur,pct:pct,fixed:(s!==t&&s!==String(v))};
  }
  function dateParse(raw,dmyHint){
    var s=String(raw).trim(), m;
    if(!s) return null;
    if((m=s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/))) return mk(+m[1],+m[2],+m[3],'ymd');
    if((m=s.match(/^(\d{4})(\d{2})(\d{2})$/))) return mk(+m[1],+m[2],+m[3],'compact');
    if((m=s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})$/))){
      var a=+m[1],b=+m[2],y=+m[3]; if(y<100) y+=2000;
      return dmyHint||a>12?mk(y,b,a,'dmy'):mk(y,a,b,'mdy');
    }
    if((m=s.match(/^(?:week of\s+)?([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})$/i))) return mk(+m[3],mon(m[1]),+m[2],'text');
    if((m=s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})$/))) return mk(+m[3],mon(m[2]),+m[1],'text');
    return null;
    function mon(x){var i=MON.map(function(z){return z.toLowerCase();}).indexOf(x.slice(0,3).toLowerCase());return i+1;}
    function mk(y,mo,dd,f){ if(!mo||mo>12||dd<1||dd>31) return null; var t=new Date(y,mo-1,dd,12); if(isNaN(t)) return null; return {t:t.getTime(),f:f}; }
  }

  /* =====================================================================
     3. CLEANING AND MODELLING
     ===================================================================== */
  function analyse(text){
    var all=parseCSV(text), st={titles:0,blank:0,dupes:0,totals:0,fixed:0,missing:0,merged:0,mergedWhat:''};
    /* comment lines and report titles above the header */
    var body=all.filter(function(r){ if(r.length&&/^\s*#/.test(r[0])){st.titles++;return false;} return true; });
    var widths={}; body.forEach(function(r){var n=r.filter(function(c){return String(c).trim()!=='';}).length; if(n>1) widths[n]=(widths[n]||0)+1;});
    var modal=+Object.keys(widths).sort(function(a,b){return widths[b]-widths[a];})[0]||0;
    if(modal<2) return {error:'I could not find a table in that file. Try a CSV export with a header row and a few columns of numbers.'};
    var hi=-1;
    for(var i=0;i<body.length&&i<40;i++){
      var r=body[i], filled=r.filter(function(c){return String(c).trim()!=='';});
      if(filled.length>=Math.max(2,modal-1)&&filled.filter(function(c){return numParse(c).v!==null;}).length<=filled.length/3){hi=i;break;}
      if(filled.length) st.titles++;
    }
    if(hi<0) return {error:'I could not spot the header row. Make sure the first row of the table names the columns.'};
    var head=body[hi].map(function(h,j){h=String(h).trim();return h||('Column '+(j+1));}), W=head.length;
    var rows=[], seen={};
    body.slice(hi+1).forEach(function(r){
      var cells=r.slice(0,W); while(cells.length<W) cells.push('');
      if(cells.every(function(c){return String(c).trim()==='';})){st.blank++;return;}
      if(cells.some(function(c){return /^\s*(grand )?total\b/i.test(c);})){st.totals++;return;}
      var key=cells.join('\u0001'); if(seen[key]){st.dupes++;return;} seen[key]=1;
      rows.push(cells);
    });
    if(rows.length<2) return {error:'That file has fewer than two data rows after cleaning, so there is nothing to chart yet.'};
    if(rows.length>60000) rows=rows.slice(0,60000);

    /* type each column */
    var cols=head.map(function(h,j){
      var vals=rows.map(function(r){return r[j];}).filter(function(v){return String(v).trim()!==''&&!MISSING.test(v);});
      var nOk=0,dOk=0,dmyHint=false,cur={};
      var A={},Bv={},mdyHard=false,dmyHard=false,anyDM=false;
      vals.forEach(function(v){ var s=String(v).trim(), m=s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.]\d{2,4}$/); if(!m) return; anyDM=true;
        A[+m[1]]=1; Bv[+m[2]]=1; if(+m[1]>12) dmyHard=true; if(+m[2]>12) mdyHard=true; });
      if(anyDM){
        if(dmyHard) dmyHint=true; else if(mdyHard) dmyHint=false;
        else if(Object.keys(A).length===1&&Object.keys(Bv).length>1) dmyHint=true;      /* the 1st of every month */
        else if(Object.keys(Bv).length===1&&Object.keys(A).length>1) dmyHint=false;
        else dmyHint=!/\$/.test(text);                                                    /* US exports use $, and month first */
      }
      vals.forEach(function(v){ var p=numParse(v); if(p.v!==null&&!/^\d{8}$/.test(String(v).trim())){nOk++; if(p.cur) cur[p.cur]=(cur[p.cur]||0)+1;} if(dateParse(v,dmyHint)) dOk++; });
      var n=vals.length||1, type='cat';
      if(dOk/n>=.7&&/(date|day|week|month|period|time)/i.test(h)||dOk/n>=.9) type='date';
      else if(nOk/n>=.7) type='num';
      var sym=Object.keys(cur).sort(function(a,b){return cur[b]-cur[a];})[0]||'';
      return {h:h,j:j,type:type,dmy:dmyHint,sym:sym};
    });

    /* clean values into a model */
    var dateCol=cols.filter(function(c){return c.type==='date';})[0]||null;
    var nums=cols.filter(function(c){return c.type==='num';});
    var cats=cols.filter(function(c){return c.type==='cat';});
    if(!nums.length) return {error:'I could not find any numbers in that file. Try an export with metrics like clicks, cost, sessions or leads.'};
    var catCol=null, catMap={}, variants={};
    cats.forEach(function(c){
      var groups={};
      rows.forEach(function(r){ var raw=String(r[c.j]); var norm=raw.trim().replace(/\s+/g,' ').toLowerCase(); if(!norm) return;
        (groups[norm]=groups[norm]||{})[raw]=((groups[norm]||{})[raw]||0)+1; });
      var distinct=Object.keys(groups).length;
      c.distinct=distinct; c.groups=groups;
      if(!catCol&&distinct>=2&&distinct<=Math.max(12,rows.length/4)) catCol=c;
    });
    if(catCol){
      Object.keys(catCol.groups).forEach(function(norm){
        var g=catCol.groups[norm], spell=Object.keys(g).map(function(s){return [s.trim().replace(/\s+/g,' '),g[s]];});
        var nice={}; spell.forEach(function(x){nice[x[0]]=(nice[x[0]]||0)+x[1];});
        var bestName=Object.keys(nice).sort(function(a,b){ var A=/[A-Z]/.test(a[0])?1:0,Bq=/[A-Z]/.test(b[0])?1:0; return (Bq-A)||(nice[b]-nice[a]); })[0];
        Object.keys(g).forEach(function(raw){ catMap[raw]=bestName; if(raw!==bestName){ st.merged+=g[raw]; variants[bestName]=1; } });
      });
    }
    var recs=rows.map(function(r){
      var o={vals:{}};
      if(dateCol){ var dp=dateParse(r[dateCol.j],dateCol.dmy); o.t=dp?dp.t:null; }
      if(catCol){ o.c=catMap[r[catCol.j]]||String(r[catCol.j]).trim()||'(blank)'; }
      nums.forEach(function(c){ var p=numParse(r[c.j]); if(p.missing||p.bad) st.missing++; else if(p.fixed) st.fixed++; o.vals[c.h]=p.v; });
      return o;
    }).filter(function(o){return !dateCol||o.t!==null;});
    st.mergedWhat=Object.keys(variants).length;

    /* roles, by name */
    function find(re){for(var i=0;i<nums.length;i++) if(re.test(nums[i].h)) return nums[i].h; return null;}
    var role={
      cost:find(/\b(cost|spend|spent|amount)\b/i), clicks:find(/\bclicks?\b/i), impr:find(/\bimpr|impressions?\b/i),
      revenue:find(/\b(revenue|value|sales amount|income)\b/i), sessions:find(/\b(sessions|visits)\b/i)
    };
    role.outcome=find(/\b(conversions?|conv|key events?|leases?|signed|sales|orders|purchases|deals won|won)\b/i)||find(/\b(leads?|applications?|sign ?ups?|enquiries|inquiries)\b/i);
    var engaged=find(/\bengaged\b/i);
    var symCount={}; nums.forEach(function(c){ if(c.sym) symCount[c.sym]=(symCount[c.sym]||0)+1; });
    head.forEach(function(h){ var m=h.match(/[£$€₹]/); if(m) symCount[m[0]]=(symCount[m[0]]||0)+1; });
    var fileSym=Object.keys(symCount).sort(function(a,b){return symCount[b]-symCount[a];})[0]||'£';
    var money={}; nums.forEach(function(c){ var hs=(c.h.match(/[£$€₹]/)||[''])[0];
      money[c.h]=c.sym||hs||(/\b(cost|spend|spent|revenue|amount|value|cpc|cpa|price|budget)\b/i.test(c.h)?fileSym:''); });
    var funnel=nums.filter(function(c){return /\b(leads?|tours?|visits|applications?|apps|leases?|signed|sign ?ups?|trials?|qualified|deals|won|sessions|engaged)\b/i.test(c.h);}).map(function(c){return c.h;});

    var additive=nums.filter(function(c){return !NONADD.test(c.h);});
    var primary=role.outcome||role.cost||(additive[0]||nums[0]).h;
    return {head:head,cols:cols,recs:recs,nums:nums.map(function(c){return c.h;}),dateCol:dateCol,catCol:catCol,role:role,engaged:engaged,
            money:money,funnel:funnel.length>=3?funnel:null,primary:primary,st:st,rawRows:all,hi:hi};
  }

  /* =====================================================================
     4. NUMBERS AND WORDS
     ===================================================================== */
  function sum(recs,k){var s=0;recs.forEach(function(r){var v=r.vals[k];if(v!=null)s+=v;});return s;}
  var NONADD=/\b(price|rate|avg|average|mean|ctr|cpc|cpa|cpm|roas|position|rank|score|ratio|percent|share|margin|%)\b|%/i;
  function agg(recs,k){ if(!NONADD.test(k)) return sum(recs,k); var s=0,n=0; recs.forEach(function(r){var v=r.vals[k];if(v!=null){s+=v;n++;}}); return n?s/n:null; }
  function fmt(v,k,M){
    if(v==null||isNaN(v)) return '-';
    var sym=M.money[k]||'';
    if(sym) return sym+(Math.abs(v)>=1000?NF.format(Math.round(v)):v.toFixed(2));
    if(Math.abs(v)>=100||Math.round(v)===v) return NF.format(Math.round(v));
    return v.toFixed(1);
  }
  function moneyFmt(v,sym){return sym+(v>=1000?NF.format(Math.round(v)):v.toFixed(2));}
  function pct(v){return (Math.abs(v)<10?v.toFixed(1):Math.round(v))+'%';}
  function lowerName(k){k=String(k).replace(/\s*\([^)]*\)\s*/g,' ').trim();return /^[A-Z]{2,}/.test(k)?k:k.toLowerCase();}
  function dSpan(a,b){ if(b-a>300*864e5){ var x=new Date(a),y=new Date(b); return MON[x.getMonth()]+' '+x.getFullYear()+' to '+MON[y.getMonth()]+' '+y.getFullYear(); } return dShort(a)+' to '+dShort(b); }
  function dShort(t){var d=new Date(t);return MON[d.getMonth()]+' '+d.getDate();}

  function buckets(M){
    if(!M.dateCol) return null;
    var ts=M.recs.map(function(r){return r.t;}), lo=Math.min.apply(null,ts), hi=Math.max.apply(null,ts), span=(hi-lo)/864e5;
    var unit=span<=45?'day':span<=240?'week':'month', map={};
    function key(t){var d=new Date(t); if(unit==='day') return d.setHours(12,0,0,0);
      if(unit==='week'){ var x=new Date(d); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x.setHours(12,0,0,0); }
      return new Date(d.getFullYear(),d.getMonth(),1,12).getTime();}
    M.recs.forEach(function(r){var k=key(r.t);(map[k]=map[k]||[]).push(r);});
    var keys=Object.keys(map).map(Number).sort(function(a,b){return a-b;});
    /* daily data grouped by week or month: leave out a final period that is not finished yet */
    var days={}; ts.forEach(function(t){days[new Date(t).setHours(12,0,0,0)]=1;});
    var dl=Object.keys(days).map(Number).sort(function(a,b){return a-b;}), gap=Infinity;
    for(var i=1;i<dl.length;i++) gap=Math.min(gap,dl[i]-dl[i-1]);
    var daily=gap<=864e5*1.5, partial=false;
    if(daily&&unit!=='day'&&keys.length>3){
      var last=keys[keys.length-1], endOf=unit==='week'?last+6*864e5:new Date(new Date(last).getFullYear(),new Date(last).getMonth()+1,0,12).getTime();
      if(hi<endOf-36e5){ keys=keys.slice(0,-1); partial=true; }
      var first=keys[0], startOk=unit==='week'?first>=new Date(lo).setHours(12,0,0,0)-36e5:new Date(lo).getDate()===1;
      if(!startOk&&keys.length>3) keys=keys.slice(1);
    }
    return {unit:unit,keys:keys,map:map,lo:lo,hi:hi,daily:daily,partial:partial,dates:dl};
  }

  function insights(M){
    var out=[], R=M.role, oc=R.outcome, cost=R.cost, B=buckets(M);
    var ocName=oc?lowerName(oc):lowerName(M.primary);
    /* who brings the results */
    if(M.catCol){
      var by={}; M.recs.forEach(function(r){(by[r.c]=by[r.c]||[]).push(r);});
      var names=Object.keys(by), tot=sum(M.recs,M.primary);
      if(tot>0&&names.length>1){
        names.sort(function(a,b){return sum(by[b],M.primary)-sum(by[a],M.primary);});
        var share=sum(by[names[0]],M.primary)/tot*100;
        out.push('<b>'+esc(names[0])+'</b> brings <b>'+pct(share)+'</b> of all '+esc(ocName)+'.');
      }
      if(oc&&cost){
        var eff=names.map(function(n){var o=sum(by[n],oc),c=sum(by[n],cost);return {n:n,cpa:o>0?c/o:null,o:o};}).filter(function(x){return x.cpa!=null&&x.o>=5;});
        if(eff.length>1){
          eff.sort(function(a,b){return a.cpa-b.cpa;});
          var avg=sum(M.recs,cost)/Math.max(1,sum(M.recs,oc)), worst=eff[eff.length-1], sym=M.money[cost]||'';
          if(worst.cpa/avg>=1.25) out.push('<b>'+esc(worst.n)+'</b> costs <b>'+moneyFmt(worst.cpa,sym)+'</b> per '+esc(singular(ocName))+', '+(worst.cpa/avg).toFixed(1)+'x the average. <b>'+esc(eff[0].n)+'</b> is cheapest at '+moneyFmt(eff[0].cpa,sym)+'.');
          else out.push('Cost per '+esc(singular(ocName))+' is fairly even, from '+moneyFmt(eff[0].cpa,sym)+' at <b>'+esc(eff[0].n)+'</b> to '+moneyFmt(worst.cpa,sym)+' at <b>'+esc(worst.n)+'</b>.');
        }
      }
      if(R.revenue&&cost){
        var ro=names.map(function(n){var c=sum(by[n],cost);return {n:n,r:c>0?sum(by[n],R.revenue)/c:null};}).filter(function(x){return x.r!=null;}).sort(function(a,b){return b.r-a.r;});
        var rs=M.money[R.revenue]||M.money[cost]||'';
        if(ro.length>1) out.push('<b>'+esc(ro[0].n)+'</b> returns <b>'+rs+ro[0].r.toFixed(2)+'</b> for every '+rs+'1 spent, the best of any '+esc(catName())+'. <b>'+esc(ro[ro.length-1].n)+'</b> returns '+rs+ro[ro.length-1].r.toFixed(2)+'.');
      }
      if(M.engaged&&R.sessions){
        var er=names.map(function(n){var s=sum(by[n],R.sessions);return {n:n,r:s?sum(by[n],M.engaged)/s*100:0,s:s};}).filter(function(x){return x.s>0;}).sort(function(a,b){return b.r-a.r;});
        if(er.length>1) out.push('<b>'+esc(er[0].n)+'</b> has the most engaged visitors ('+pct(er[0].r)+' of sessions engaged). <b>'+esc(er[er.length-1].n)+'</b> has the least, at '+pct(er[er.length-1].r)+'.');
      }
    }
    /* the funnel */
    if(M.funnel&&!(M.engaged&&R.sessions)){
      var f=M.funnel, top=sum(M.recs,f[0]), end=sum(M.recs,f[f.length-1]);
      if(top>0){
        var worstStep=null,wr=2;
        for(var i=1;i<f.length;i++){var a=sum(M.recs,f[i-1]),b=sum(M.recs,f[i]);if(a>0&&b/a<wr){wr=b/a;worstStep=[f[i-1],f[i]];}}
        out.push('Of <b>'+NF.format(Math.round(top))+'</b> '+esc(lowerName(f[0]))+', <b>'+pct(end/top*100)+'</b> became '+esc(lowerName(f[f.length-1]))+'.'+
          (worstStep?' The biggest drop is from '+esc(lowerName(worstStep[0]))+' to '+esc(lowerName(worstStep[1]))+' ('+pct(wr*100)+' get through).':''));
      }
    }
    /* what changed lately */
    if(B&&B.dates.length>=4){
      var L,P,span;
      if(B.daily){
        var spanD=Math.round((B.hi-B.lo)/864e5)+1, w=spanD>=56?28:spanD>=28?14:Math.floor(spanD/2), cut=B.hi-w*864e5;
        L=M.recs.filter(function(r){return r.t>cut;}); P=M.recs.filter(function(r){return r.t<=cut&&r.t>cut-w*864e5;}); span=w+' days';
      } else {
        var nn=Math.min(4,Math.floor(B.dates.length/2)), ld=B.dates.slice(-nn), pd=B.dates.slice(-2*nn,-nn);
        function inSet(set){return function(r){return set.indexOf(new Date(r.t).setHours(12,0,0,0))>=0;};}
        var gapD=(B.dates[B.dates.length-1]-B.dates[0])/864e5/Math.max(1,B.dates.length-1);
        L=M.recs.filter(inSet(ld)); P=M.recs.filter(inSet(pd)); span=nn+' '+(gapD>=26?'months':gapD>=6?'weeks':'periods');
      }
      var lo=sum(L,M.primary), po=sum(P,M.primary);
      if(po>0){
        var ch=(lo-po)/po*100;
        var line='Last '+span+': '+esc(lowerName(M.primary))+' '+(Math.abs(ch)<1?'held flat':(ch>0?'up ':'down ')+pct(Math.abs(ch)));
        if(cost&&cost!==M.primary){ var lc=sum(L,cost),pc=sum(P,cost); if(pc>0){ var cc=(lc-pc)/pc*100; line+=', while '+esc(lowerName(cost))+' '+(Math.abs(cc)<1?'held flat':(cc>0?'rose ':'fell ')+pct(Math.abs(cc)));
          if(oc&&cc-ch>8) line+='. Each '+esc(singular(ocName))+' is getting more expensive'; } }
        out.push(line+'.');
      }
      if(B.keys.length<2) return out.slice(0,4);
      var bestK=B.keys.slice().sort(function(a,b){return sum(B.map[b],M.primary)-sum(B.map[a],M.primary);})[0];
      out.push('Best '+B.unit+': <b>'+(B.unit==='month'?MON[new Date(bestK).getMonth()]+' '+new Date(bestK).getFullYear():(B.unit==='week'?'week of ':'')+dShort(bestK))+'</b>, with '+fmt(sum(B.map[bestK],M.primary),M.primary,M)+' '+esc(lowerName(M.primary))+'.');
    }
    return out.slice(0,4);
  }
  function singular(w){return w.replace(/ies$/,'y').replace(/(ses)$/,'s').replace(/([^s])s$/,'$1');}

  /* =====================================================================
     5. DRAWING
     ===================================================================== */
  var M=null, metric=null;
  function kpis(){
    var R=M.role, list=[], tiles=[];
    [R.outcome,R.cost,R.clicks||R.sessions,R.revenue].forEach(function(k){ if(k&&list.indexOf(k)<0) list.push(k); });
    M.nums.forEach(function(k){ if(list.length<3&&list.indexOf(k)<0) list.push(k); });
    list.slice(0,3).forEach(function(k){ tiles.push([(NONADD.test(k)?'Average ':'')+k,fmt(agg(M.recs,k),k,M)]); });
    if(R.revenue&&R.cost&&sum(M.recs,R.cost)>0){ tiles.push(['Return on spend',(sum(M.recs,R.revenue)/sum(M.recs,R.cost)).toFixed(2)+'x']); }
    else if(R.outcome&&R.cost){ var o=sum(M.recs,R.outcome); if(o>0) tiles.push(['Cost per '+singular(lowerName(R.outcome)),moneyFmt(sum(M.recs,R.cost)/o,M.money[R.cost]||'')]); }
    else if(M.engaged&&R.sessions){ tiles.push(['Engagement rate',pct(sum(M.recs,M.engaged)/Math.max(1,sum(M.recs,R.sessions))*100)]); }
    else if(M.funnel){ var a=sum(M.recs,M.funnel[0]),b=sum(M.recs,M.funnel[M.funnel.length-1]); if(a) tiles.push([M.funnel[M.funnel.length-1]+' per '+singular(lowerName(M.funnel[0])),pct(b/a*100)]); }
    else if(M.nums[3]) tiles.push([M.nums[3],fmt(sum(M.recs,M.nums[3]),M.nums[3],M)]);
    $('#labKpis').innerHTML=tiles.slice(0,4).map(function(t){return '<div><span>'+esc(t[0])+'</span><b>'+esc(t[1])+'</b></div>';}).join('');
  }
  function chips(){
    $('#labMetrics').innerHTML=M.nums.slice(0,5).map(function(k){return '<button type="button" class="seg'+(k===metric?' on':'')+'" data-m="'+esc(k)+'">'+esc(k)+'</button>';}).join('');
  }
  function trend(){
    var box=$('#labTrend'), B=buckets(M);
    if(!B||B.keys.length<2){ box.innerHTML='<p class="lab-none">No date column, so there is no trend to draw. The breakdown below still works.</p>'; return; }
    var vals=B.keys.map(function(k){return agg(B.map[k],metric)||0;}), max=Math.max.apply(null,vals)||1, n=vals.length, W=600, H=170;
    function X(i){return n===1?W/2:i/(n-1)*W;} function Y(v){return H-6-(v/max)*(H-16);}
    var line=vals.map(function(v,i){return (i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1);}).join(' ');
    var xl=''; var step=Math.max(1,Math.ceil(n/5));
    for(var i=0;i<n;i+=step) xl+='<span style="left:'+(X(i)/W*100)+'%">'+dShort(B.keys[i])+'</span>';
    box.innerHTML='<div class="lab-ymax">'+esc(fmt(max,metric,M))+(B.partial?'<em> \u00b7 by '+B.unit+', the unfinished '+B.unit+' is left out</em>':' \u00b7 by '+B.unit)+'</div><div class="lab-plot"><svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true">'+
      '<defs><linearGradient id="labG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--cyan)" stop-opacity=".28"/><stop offset="1" stop-color="var(--cyan)" stop-opacity="0"/></linearGradient></defs>'+
      '<path d="'+line+' L'+W+' '+H+' L0 '+H+' Z" fill="url(#labG)"/><path d="'+line+'" fill="none" stroke="var(--cyan)" stroke-width="2.4" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>'+
      '<i class="lab-cur"></i><div class="lab-tip"></div></div><div class="lab-x">'+xl+'</div>';
    var plot=box.querySelector('.lab-plot'), cur=box.querySelector('.lab-cur'), tip=box.querySelector('.lab-tip');
    function move(e){
      var r=plot.getBoundingClientRect(), cx=(e.touches?e.touches[0].clientX:e.clientX), f=Math.max(0,Math.min(1,(cx-r.left)/r.width)), i=Math.round(f*(n-1));
      cur.style.left=(X(i)/W*100)+'%'; cur.style.opacity=1;
      tip.innerHTML='<span>'+(B.unit==='week'?'Week of ':'')+dShort(B.keys[i])+'</span><b>'+esc(fmt(vals[i],metric,M))+'</b>';
      tip.style.left=(X(i)/W*100)+'%'; tip.classList.toggle('flip',f>.6); tip.style.opacity=1;
    }
    plot.addEventListener('pointermove',move); plot.addEventListener('pointerdown',move);
    plot.addEventListener('pointerleave',function(){cur.style.opacity=0;tip.style.opacity=0;});
  }
  function bars(){
    var box=$('#labBars');
    if(!M.catCol){ box.innerHTML=''; box.style.display='none'; return; }
    box.style.display='';
    var grp={}; M.recs.forEach(function(r){(grp[r.c]=grp[r.c]||[]).push(r);});
    var list=Object.keys(grp).map(function(k){return [k,agg(grp[k],metric)||0];}).sort(function(a,b){return b[1]-a[1];});
    if(list.length>6){ if(NONADD.test(metric)) list=list.slice(0,6); else { var rest=list.slice(5).reduce(function(s,x){return s+x[1];},0); list=list.slice(0,5).concat([['Everything else',rest]]); } }
    var max=list[0][1]||1;
    box.innerHTML='<h5>'+esc(metric)+' by '+esc(catName())+'</h5>'+list.map(function(x){
      return '<div class="lab-bar"><span>'+esc(x[0])+'</span><i><em style="width:'+Math.max(2,x[1]/max*100).toFixed(1)+'%"></em></i><b>'+esc(fmt(x[1],metric,M))+'</b></div>';}).join('');
  }
  function steps(name){
    var s=M.st, cols=M.cols, L=[];
    L.push('Read <b>'+NF.format(M.rawRows.length)+'</b> lines from '+esc(name));
    if(s.titles||s.totals) L.push('Skipped '+both([s.titles&&plural(s.titles,'report title line'),s.totals&&plural(s.totals,'total row')]));
    if(s.blank||s.dupes) L.push('Removed '+both([s.blank&&plural(s.blank,'blank row'),s.dupes&&plural(s.dupes,'duplicate row')]));
    if(s.fixed) L.push('Fixed <b>'+NF.format(s.fixed)+'</b> numbers written as text (currency signs, commas, spaces)');
    if(s.missing) L.push('Marked '+plural(s.missing,'missing value')+' instead of counting them as zero');
    if(s.merged) L.push('Merged '+plural(s.mergedWhat,catName())+' that were spelled more than one way');
    var found=[]; if(M.dateCol){var B=buckets(M);found.push('dates from '+dSpan(B.lo,B.hi));}
    if(M.catCol) found.push('a '+esc(catName())+' column');
    found.push(plural(M.nums.length,'metric'));
    L.push('Found '+both(found));
    $('#labSteps').innerHTML=L.map(function(t,i){return '<li style="--d:'+(i*.09)+'s">'+t+'</li>';}).join('');
  }
  function plural(n,w){return '<b>'+NF.format(n)+'</b> '+(n===1?w:pl(w));}
  function pl(w){return /[^aeiou]y$/.test(w)?w.slice(0,-1)+'ies':(/(s|x|ch|sh)$/.test(w)?w+'es':w+'s');}
  function both(a){a=a.filter(Boolean);return a.length>1?a.slice(0,-1).join(', ')+' and '+a[a.length-1]:a[0]||'';}
  function catName(){ if(!M.catCol) return 'name'; var h=M.catCol.h.toLowerCase();
    var m=h.match(/\b(channel|campaign|community|property|source|medium|device|country|region|city|product|ad group|keyword|page|account|client|brand|category|platform|network)s?\b/);
    return m?m[1]:h.split(/\s+/).slice(-1)[0]; }
  function rawPreview(){
    var rows=M.rawRows.slice(0,Math.min(M.rawRows.length,M.hi+9)), W=M.head.length;
    var html=rows.map(function(r,ri){
      var isHead=ri===M.hi, isTitle=ri<M.hi||(r.length&&/^\s*#/.test(r[0])), blank=r.every(function(c){return String(c).trim()==='';});
      var dup=!isHead&&!isTitle&&!blank&&ri>M.hi&&rows.slice(M.hi+1,ri).some(function(o){return o.join('\u0001')===r.join('\u0001');});
      var cls=isHead?'h':isTitle?'t':blank?'b':dup?'d':'';
      var cells=[]; for(var j=0;j<W;j++){ var c=r[j]==null?'':String(r[j]); var flag='';
        if(!isHead&&!isTitle&&!blank){ var col=M.cols[j];
          if(col&&col.type==='num'){ var p=numParse(c); if(p.missing||p.bad) flag='na'; else if(p.fixed) flag='fx'; }
          else if(col&&col.type==='cat'&&c&&(c!==c.trim()||(M.catCol&&col===M.catCol&&/^[a-z]/.test(c.trim())))) flag='fx'; }
        cells.push('<td'+(flag?' class="'+flag+'"':'')+'>'+(c.trim()===''&&!isTitle?'<i>·</i>':esc(c))+'</td>'); if(isTitle) break; }
      return '<tr class="'+cls+'">'+(isTitle?'<td colspan="'+W+'">'+esc(r.join(' ').trim()||'·')+'</td>':cells.join(''))+'</tr>';
    }).join('');
    $('#labRaw').innerHTML='<table>'+html+'</table>';
  }

  function render(text,name){
    var res=analyse(text);
    var out=$('#labOut');
    if(res.error){ M=null; out.classList.add('err'); $('#labIns').innerHTML='<li>'+esc(res.error)+'</li>'; $('#labSteps').innerHTML=''; $('#labRaw').innerHTML='';
      $('#labKpis').innerHTML=''; $('#labMetrics').innerHTML=''; $('#labTrend').innerHTML=''; $('#labBars').innerHTML=''; return; }
    out.classList.remove('err');
    M=res; metric=M.primary;
    rawPreview(); steps(name); kpis(); chips(); trend(); bars();
    $('#labIns').innerHTML=insights(M).map(function(t){return '<li>'+t+'</li>';}).join('')||'<li>Nothing stands out yet. A longer date range usually tells a clearer story.</li>';
    root.classList.remove('lab-anim'); void root.offsetWidth; root.classList.add('lab-anim');
  }

  /* =====================================================================
     6. CONTROLS
     ===================================================================== */
  function pick(k){
    root.querySelectorAll('.lab-src .seg').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-s')===k);});
    render(SAMPLES[k].make(),SAMPLES[k].n);
  }
  root.querySelector('.lab-src').addEventListener('click',function(e){
    var b=e.target.closest('.seg[data-s]'); if(b) pick(b.getAttribute('data-s'));
  });
  $('#labMetrics').addEventListener('click',function(e){
    var b=e.target.closest('.seg[data-m]'); if(!b||!M) return; metric=b.getAttribute('data-m'); chips(); trend(); bars();
  });
  var fileIn=$('#labFile');
  function readFile(f){
    if(!f) return;
    if(f.size>8*1024*1024){ render('', ''); $('#labIns').innerHTML='<li>That file is over 8 MB. Try a smaller export or a shorter date range.</li>'; return; }
    if(!/\.(csv|tsv|txt)$/i.test(f.name)&&!/csv|text/.test(f.type||'')){ $('#labIns').innerHTML='<li>That looks like a '+esc((f.name.split('.').pop()||'').toUpperCase())+' file. Save it as CSV first (File, Save as, CSV) and drop it in again.</li>'; return; }
    var r=new FileReader();
    r.onload=function(){ root.querySelectorAll('.lab-src .seg').forEach(function(b){b.classList.remove('on');}); $('#labUp').classList.add('on'); render(String(r.result||''),esc(f.name)); };
    r.readAsText(f);
  }
  fileIn.addEventListener('change',function(){ readFile(fileIn.files[0]); fileIn.value=''; });
  $('#labUp').addEventListener('click',function(){ fileIn.click(); });
  var card=$('.lab-card');
  ['dragenter','dragover'].forEach(function(ev){card.addEventListener(ev,function(e){e.preventDefault();card.classList.add('drop');});});
  ['dragleave','drop'].forEach(function(ev){card.addEventListener(ev,function(e){e.preventDefault();if(ev==='dragleave'&&card.contains(e.relatedTarget))return;card.classList.remove('drop');});});
  card.addEventListener('drop',function(e){ var f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0]; readFile(f); });

  /* build the first sample only when the section comes near the screen */
  var started=false;
  function start(){ if(started) return; started=true; pick('ads'); }
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){ if(es.some(function(e){return e.isIntersecting;})){ start(); io.disconnect(); } },{rootMargin:'400px'});
    io.observe(root);
  } else start();
  window.DKBLab={pick:pick,load:render,model:function(){return M;}};
})();
