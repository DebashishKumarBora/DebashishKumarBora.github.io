/* =====================================================================
   JARVIS  ·  trilingual voice layer for the portfolio assistant
   English · हिन्दी · অসমীয়া
   Concept and build by Debashish Kumar Bora.

   Wraps the existing DataBot rather than replacing it:
     - speaks every reply, in the selected language
     - listens for a wake word and for tap-to-talk
     - runs real actions on the page (open demos, filter, navigate, book)
     - remembers visitors and their language between sessions
     - speaks first when something is worth saying

   Voice support reality:
     English  full speech in and out on Chrome, Edge, Android
     Hindi    full on most devices (hi-IN ships widely)
     Assamese no browser ships an as-IN voice or recognizer, so we fall
              back to the Bengali engine. The scripts are near identical,
              so it reads out clearly, with a Bengali accent.
   No backend, no API key, nothing leaves the browser.
   ===================================================================== */
(function(){
  'use strict';

  var STORE='dkb_jarvis_v2';
  var E='debashishbora30@gmail.com';

  /* =====================================================================
     LANGUAGES.  Everything the assistant says lives here.
     Deb: the Assamese below is written to be simple and spoken aloud.
     Edit any string in this block and the whole UI follows.
     ===================================================================== */
  var LANGS={

    en:{
      label:'EN', name:'English',
      sr:['en-US','en-GB'],
      tts:[/en-GB.*(daniel|arthur|male)/i,/daniel/i,/arthur/i,/google uk english male/i,/en-GB/i,/en-US/i,/^en/i],
      wake:['hey jarvis','hi jarvis','ok jarvis','jarvis'],
      quick:['What does he do?','See his results','Give me a tour','Book a call'],
      kw:{open:['open','show','launch','run','see','view','demo','try'],
          tour:['tour','walk me','walkthrough','show me around','guide'],
          book:['book','call','meeting','schedule','hire','available','contact'],
          email:['email','mail'], work:['work','project','dashboard'],
          stop:['stop','quiet','silence','pause']},
      s:{
        identity:'I am {N}, the assistant on this site. I can <b>open any live dashboard</b>, give you a <b>guided tour</b>, filter the work, answer questions about his experience, and take you to <b>booking</b>. Try saying "open the leasing dashboard".',
        opening:'Opening the <b>{x}</b> live demo now.',
        tour:['Quick tour. These are the numbers behind the work: over three million pounds a year in managed ad spend, and one hundred and twenty one million impressions surfaced.',
              'This is AdCommand, the flagship. A Google Ads command center running sixteen accounts with a Claude analyst built in.',
              'Below are six live dashboards. Every one of them opens and runs right here in the browser.',
              'And if you like what you see, booking a call takes about thirty seconds. Say "book a call" any time.'],
        apps:'Filtered to the live apps. Each of these opens a working demo.',
        looker:'Here are the Looker Studio builds.', all:'Showing everything.',
        work:'Here is the work. Say "open the leasing dashboard" and I will launch it.',
        about:'Scrolling to the background.', skills:'Here is the stack.',
        clients:'These are the brands he has delivered for.',
        booking:'Booking is at the bottom of the page. You can grab a slot on his calendar, or email <b>'+E+'</b>.',
        email:'His email is <b>'+E+'</b>. I copied it to your clipboard.',
        theme:'Theme switched.', top:'Back to the top.',
        greet:'Good to meet you, <b>{n}</b>. Ask me to open any dashboard, or say "give me a tour".',
        micDenied:'I need microphone permission for voice. You can still type to me.',
        wakeOn:'Wake word is on. Say <b>"hey {w}"</b> and I will listen.',
        wakeOff:'Wake word is off. Tap the microphone when you want me.',
        voiceOn:'Voice on.',
        noSR:'Voice input is not supported in this browser, but you can type to me.',
        backUnseen:'Welcome back{n}. You have not seen the <b>{x}</b> yet. Want me to open it?',
        backBook:'Welcome back{n}. Want to book a quick call with Deb?',
        nudge:'These all run live. Want me to open one and walk you through it?',
        exit:'Before you go: I can send you straight to Deb\u2019s calendar.',
        yOpen:'Open it', yTour:'Give me a tour', yBook:'Book a call', no:'Not now',
        langSet:'Switched to English.',
        noVoice:'This device has no English voice, so I will answer in text.',
        elsewhere:'I have that answer in English. Switch to EN, or ask me to open a dashboard.'
      },
      kb:[]
    },

    hi:{
      label:'\u0939\u093F\u0902', name:'\u0939\u093F\u0928\u094D\u0926\u0940',
      sr:['hi-IN'],
      tts:[/hi-IN/i,/hindi/i,/\u0939\u093F\u0928\u094D\u0926\u0940/],
      wake:['\u0939\u0947 \u091C\u093E\u0930\u094D\u0935\u093F\u0938','\u091C\u093E\u0930\u094D\u0935\u093F\u0938','hey jarvis','jarvis'],
      quick:['\u092F\u0947 \u0915\u094D\u092F\u093E \u0915\u0930\u0924\u0947 \u0939\u0948\u0902?','\u0928\u0924\u0940\u091C\u0947 \u0926\u093F\u0916\u093E\u0913','\u091F\u0942\u0930 \u0926\u093F\u0916\u093E\u0913','\u0915\u0949\u0932 \u092C\u0941\u0915 \u0915\u0930\u0947\u0902'],
      kw:{open:['\u0916\u094B\u0932','\u0926\u093F\u0916\u093E','open','show'],
          tour:['\u091F\u0942\u0930','\u0918\u0941\u092E\u093E','tour'],
          book:['\u092C\u0941\u0915','\u0915\u0949\u0932','\u092E\u0940\u091F\u093F\u0902\u0917','\u0938\u0902\u092A\u0930\u094D\u0915','book','call'],
          email:['\u0908\u092E\u0947\u0932','email'],
          work:['\u0915\u093E\u092E','\u092A\u094D\u0930\u094B\u091C\u0947\u0915\u094D\u091F','\u0921\u0948\u0936\u092C\u094B\u0930\u094D\u0921','work'],
          stop:['\u0930\u0941\u0915\u094B','\u091A\u0941\u092A','\u092C\u0902\u0926','stop']},
      s:{
        identity:'\u092E\u0948\u0902 {N} \u0939\u0942\u0901, \u0907\u0938 \u0938\u093E\u0907\u091F \u0915\u093E \u0938\u0939\u093E\u092F\u0915\u0964 \u092E\u0948\u0902 <b>\u0915\u094B\u0908 \u092D\u0940 \u0932\u093E\u0907\u0935 \u0921\u0948\u0936\u092C\u094B\u0930\u094D\u0921</b> \u0916\u094B\u0932 \u0938\u0915\u0924\u093E \u0939\u0942\u0901, <b>\u0917\u093E\u0907\u0921\u0947\u0921 \u091F\u0942\u0930</b> \u0926\u0947 \u0938\u0915\u0924\u093E \u0939\u0942\u0901, \u0914\u0930 \u0906\u092A\u0915\u094B <b>\u092C\u0941\u0915\u093F\u0902\u0917</b> \u0924\u0915 \u0932\u0947 \u091C\u093E \u0938\u0915\u0924\u093E \u0939\u0942\u0901\u0964 \u0915\u0939\u093F\u090F "\u0932\u0940\u091C\u093F\u0902\u0917 \u0921\u0948\u0936\u092C\u094B\u0930\u094D\u0921 \u0916\u094B\u0932\u094B"\u0964',
        opening:'\u092E\u0948\u0902 <b>{x}</b> \u0915\u093E \u0932\u093E\u0907\u0935 \u0921\u0947\u092E\u094B \u0916\u094B\u0932 \u0930\u0939\u093E \u0939\u0942\u0901\u0964',
        tour:['\u091B\u094B\u091F\u093E \u0938\u093E \u091F\u0942\u0930\u0964 \u092F\u0947 \u0939\u0948\u0902 \u0915\u093E\u092E \u0915\u0947 \u092A\u0940\u091B\u0947 \u0915\u0947 \u0906\u0902\u0915\u0921\u093C\u0947: \u0939\u0930 \u0938\u093E\u0932 \u0924\u0940\u0938 \u0932\u093E\u0916 \u092A\u093E\u0909\u0902\u0921 \u0938\u0947 \u091C\u093C\u094D\u092F\u093E\u0926\u093E \u0915\u093E \u0935\u093F\u091C\u094D\u091E\u093E\u092A\u0928 \u0916\u0930\u094D\u091A, \u0914\u0930 \u092C\u093E\u0930\u0939 \u0915\u0930\u094B\u0921\u093C \u0938\u0947 \u091C\u093C\u094D\u092F\u093E\u0926\u093E \u0907\u0902\u092A\u094D\u0930\u0947\u0936\u0928\u0964',
              '\u092F\u0939 \u0939\u0948 \u090F\u0921\u0915\u092E\u093E\u0902\u0921, \u0907\u0928\u0915\u093E \u092A\u094D\u0930\u092E\u0941\u0916 \u092A\u094D\u0930\u094B\u091C\u0947\u0915\u094D\u091F\u0964 \u0938\u094B\u0932\u0939 \u0905\u0915\u093E\u0909\u0902\u091F \u091A\u0932\u093E\u0928\u0947 \u0935\u093E\u0932\u093E \u0917\u0942\u0917\u0932 \u090F\u0921\u094D\u0938 \u0915\u092E\u093E\u0902\u0921 \u0938\u0947\u0902\u091F\u0930, \u091C\u093F\u0938\u092E\u0947\u0902 \u0915\u094D\u0932\u0949\u0921 \u090F\u0928\u093E\u0932\u093F\u0938\u094D\u091F \u0905\u0902\u0926\u0930 \u092C\u0928\u093E \u0939\u0941\u0906 \u0939\u0948\u0964',
              '\u0928\u0940\u091A\u0947 \u091B\u0939 \u0932\u093E\u0907\u0935 \u0921\u0948\u0936\u092C\u094B\u0930\u094D\u0921 \u0939\u0948\u0902\u0964 \u0939\u0930 \u090F\u0915 \u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u092E\u0947\u0902 \u0905\u092D\u0940 \u0916\u0941\u0932\u0915\u0930 \u091A\u0932\u0924\u093E \u0939\u0948\u0964',
              '\u0905\u0917\u0930 \u092A\u0938\u0902\u0926 \u0906\u090F \u0924\u094B \u0915\u0949\u0932 \u092C\u0941\u0915 \u0915\u0930\u0928\u0947 \u092E\u0947\u0902 \u0924\u0940\u0938 \u0938\u0947\u0915\u0902\u0921 \u0932\u0917\u0924\u0947 \u0939\u0948\u0902\u0964 \u0915\u092D\u0940 \u092D\u0940 \u0915\u0939\u093F\u090F "\u0915\u0949\u0932 \u092C\u0941\u0915 \u0915\u0930\u094B"\u0964'],
        apps:'\u0932\u093E\u0907\u0935 \u090F\u092A\u094D\u0938 \u0926\u093F\u0916\u093E \u0930\u0939\u093E \u0939\u0942\u0901\u0964 \u0907\u0928\u092E\u0947\u0902 \u0938\u0947 \u0939\u0930 \u090F\u0915 \u091A\u0932\u0924\u093E \u0939\u0941\u0906 \u0921\u0947\u092E\u094B \u0916\u094B\u0932\u0924\u093E \u0939\u0948\u0964',
        looker:'\u092F\u0947 \u0930\u0939\u0947 \u0932\u0941\u0915\u0930 \u0938\u094D\u091F\u0942\u0921\u093F\u092F\u094B \u0915\u0947 \u0915\u093E\u092E\u0964',
        all:'\u0938\u092C \u0915\u0941\u091B \u0926\u093F\u0916\u093E \u0930\u0939\u093E \u0939\u0942\u0901\u0964',
        work:'\u092F\u0939 \u0930\u0939\u093E \u0915\u093E\u092E\u0964 \u0915\u0939\u093F\u090F "\u0932\u0940\u091C\u093F\u0902\u0917 \u0921\u0948\u0936\u092C\u094B\u0930\u094D\u0921 \u0916\u094B\u0932\u094B" \u0914\u0930 \u092E\u0948\u0902 \u0916\u094B\u0932 \u0926\u0942\u0902\u0917\u093E\u0964',
        about:'\u092C\u0948\u0915\u0917\u094D\u0930\u093E\u0909\u0902\u0921 \u0915\u0940 \u0924\u0930\u092B\u093C \u0932\u0947 \u091C\u093E \u0930\u0939\u093E \u0939\u0942\u0901\u0964',
        skills:'\u092F\u0939 \u0930\u0939\u093E \u091F\u0947\u0915 \u0938\u094D\u091F\u0948\u0915\u0964',
        clients:'\u0907\u0928 \u092C\u094D\u0930\u093E\u0902\u0921\u094D\u0938 \u0915\u0947 \u0932\u093F\u090F \u0907\u0928\u094D\u0939\u094B\u0902\u0928\u0947 \u0915\u093E\u092E \u0915\u093F\u092F\u093E \u0939\u0948\u0964',
        booking:'\u092C\u0941\u0915\u093F\u0902\u0917 \u092A\u0947\u091C \u0915\u0947 \u0928\u0940\u091A\u0947 \u0939\u0948\u0964 \u0906\u092A \u0915\u0948\u0932\u0947\u0902\u0921\u0930 \u092A\u0930 \u0938\u092E\u092F \u0932\u0947 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902, \u092F\u093E <b>'+E+'</b> \u092A\u0930 \u0908\u092E\u0947\u0932 \u0915\u0930 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964',
        email:'\u0907\u0928\u0915\u093E \u0908\u092E\u0947\u0932 <b>'+E+'</b> \u0939\u0948\u0964 \u092E\u0948\u0902\u0928\u0947 \u0907\u0938\u0947 \u0906\u092A\u0915\u0947 \u0915\u094D\u0932\u093F\u092A\u092C\u094B\u0930\u094D\u0921 \u092E\u0947\u0902 \u0915\u0949\u092A\u0940 \u0915\u0930 \u0926\u093F\u092F\u093E \u0939\u0948\u0964',
        theme:'\u0925\u0940\u092E \u092C\u0926\u0932 \u0926\u0940\u0964', top:'\u090A\u092A\u0930 \u0935\u093E\u092A\u0938\u0964',
        greet:'\u0906\u092A\u0938\u0947 \u092E\u093F\u0932\u0915\u0930 \u0905\u091A\u094D\u091B\u093E \u0932\u0917\u093E, <b>{n}</b>\u0964 \u0915\u094B\u0908 \u092D\u0940 \u0921\u0948\u0936\u092C\u094B\u0930\u094D\u0921 \u0916\u094B\u0932\u0928\u0947 \u0915\u094B \u0915\u0939\u093F\u090F, \u092F\u093E \u0915\u0939\u093F\u090F "\u091F\u0942\u0930 \u0926\u093F\u0916\u093E\u0913"\u0964',
        micDenied:'\u0906\u0935\u093E\u091C\u093C \u0915\u0947 \u0932\u093F\u090F \u092E\u093E\u0907\u0915\u094D\u0930\u094B\u092B\u093C\u094B\u0928 \u0915\u0940 \u0905\u0928\u0941\u092E\u0924\u093F \u091A\u093E\u0939\u093F\u090F\u0964 \u0906\u092A \u091F\u093E\u0907\u092A \u0915\u0930\u0915\u0947 \u092D\u0940 \u092A\u0942\u091B \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964',
        wakeOn:'\u0935\u0947\u0915 \u0935\u0930\u094D\u0921 \u091A\u093E\u0932\u0942 \u0939\u0948\u0964 \u0915\u0939\u093F\u090F <b>"\u0939\u0947 {w}"</b> \u0914\u0930 \u092E\u0948\u0902 \u0938\u0941\u0928\u0942\u0901\u0917\u093E\u0964',
        wakeOff:'\u0935\u0947\u0915 \u0935\u0930\u094D\u0921 \u092C\u0902\u0926 \u0939\u0948\u0964 \u091C\u093C\u0930\u0942\u0930\u0924 \u0939\u094B \u0924\u094B \u092E\u093E\u0907\u0915 \u0926\u092C\u093E\u0907\u090F\u0964',
        voiceOn:'\u0906\u0935\u093E\u091C\u093C \u091A\u093E\u0932\u0942\u0964',
        noSR:'\u0907\u0938 \u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u092E\u0947\u0902 \u0906\u0935\u093E\u091C\u093C \u0938\u0947 \u0907\u0928\u092A\u0941\u091F \u0928\u0939\u0940\u0902 \u091A\u0932\u0924\u093E, \u092A\u0930 \u0906\u092A \u091F\u093E\u0907\u092A \u0915\u0930 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964',
        backUnseen:'\u0935\u093E\u092A\u0938 \u0938\u094D\u0935\u093E\u0917\u0924 \u0939\u0948{n}\u0964 \u0906\u092A\u0928\u0947 <b>{x}</b> \u0905\u092D\u0940 \u0924\u0915 \u0928\u0939\u0940\u0902 \u0926\u0947\u0916\u093E\u0964 \u0916\u094B\u0932\u0942\u0901?',
        backBook:'\u0935\u093E\u092A\u0938 \u0938\u094D\u0935\u093E\u0917\u0924 \u0939\u0948{n}\u0964 \u0926\u0947\u092C \u0915\u0947 \u0938\u093E\u0925 \u090F\u0915 \u091B\u094B\u091F\u0940 \u0915\u0949\u0932 \u092C\u0941\u0915 \u0915\u0930\u0947\u0902?',
        nudge:'\u092F\u0947 \u0938\u092C \u0932\u093E\u0907\u0935 \u091A\u0932\u0924\u0947 \u0939\u0948\u0902\u0964 \u090F\u0915 \u0916\u094B\u0932\u0915\u0930 \u0926\u093F\u0916\u093E\u090A\u0901?',
        exit:'\u091C\u093E\u0928\u0947 \u0938\u0947 \u092A\u0939\u0932\u0947: \u092E\u0948\u0902 \u0906\u092A\u0915\u094B \u0938\u0940\u0927\u0947 \u0926\u0947\u092C \u0915\u0947 \u0915\u0948\u0932\u0947\u0902\u0921\u0930 \u092A\u0930 \u092D\u0947\u091C \u0938\u0915\u0924\u093E \u0939\u0942\u0901\u0964',
        yOpen:'\u0916\u094B\u0932\u093F\u090F', yTour:'\u091F\u0942\u0930 \u0926\u093F\u0916\u093E\u0913', yBook:'\u0915\u0949\u0932 \u092C\u0941\u0915 \u0915\u0930\u0947\u0902', no:'\u0905\u092D\u0940 \u0928\u0939\u0940\u0902',
        langSet:'\u0905\u092C \u092E\u0948\u0902 \u0939\u093F\u0928\u094D\u0926\u0940 \u092E\u0947\u0902 \u092C\u093E\u0924 \u0915\u0930\u0942\u0901\u0917\u093E\u0964',
        noVoice:'\u0907\u0938 \u0921\u093F\u0935\u093E\u0907\u0938 \u092E\u0947\u0902 \u0939\u093F\u0928\u094D\u0926\u0940 \u0906\u0935\u093E\u091C\u093C \u0928\u0939\u0940\u0902 \u0939\u0948, \u0907\u0938\u0932\u093F\u090F \u092E\u0948\u0902 \u0932\u093F\u0916\u0915\u0930 \u091C\u0935\u093E\u092C \u0926\u0942\u0901\u0917\u093E\u0964',
        elsewhere:'\u092F\u0939 \u091C\u0935\u093E\u092C \u092E\u0947\u0930\u0947 \u092A\u093E\u0938 \u0905\u0902\u0917\u094D\u0930\u0947\u091C\u093C\u0940 \u092E\u0947\u0902 \u0939\u0948\u0964 EN \u092A\u0930 \u0938\u094D\u0935\u093F\u091A \u0915\u0930\u0947\u0902, \u092F\u093E \u092E\u0941\u091D\u0938\u0947 \u0921\u0948\u0936\u092C\u094B\u0930\u094D\u0921 \u0916\u094B\u0932\u0928\u0947 \u0915\u094B \u0915\u0939\u0947\u0902\u0964'
      },
      kb:[
        {m:['\u0915\u094D\u092F\u093E \u0915\u0930\u0924\u0947','\u0915\u094C\u0928','\u092A\u0930\u093F\u091A\u092F','\u0905\u092C\u093E\u0909\u091F'],
         a:'\u0926\u0947\u092C \u092E\u093E\u0930\u094D\u0915\u0947\u091F\u093F\u0902\u0917 \u0914\u0930 \u0921\u0947\u091F\u093E \u0915\u0947 \u092C\u0940\u091A \u0915\u093E\u092E \u0915\u0930\u0924\u0947 \u0939\u0948\u0902\u0964 \u092F\u0947 \u0932\u093E\u0907\u0935, \u090F\u0906\u0908 \u0938\u0947 \u091A\u0932\u0928\u0947 \u0935\u093E\u0932\u0947 \u0921\u0948\u0936\u092C\u094B\u0930\u094D\u0921 \u092C\u0928\u093E\u0924\u0947 \u0939\u0948\u0902 \u091C\u094B \u0917\u0942\u0917\u0932 \u090F\u0921\u094D\u0938, \u091C\u0940\u090F4, \u0938\u0930\u094D\u091A \u0915\u0902\u0938\u094B\u0932 \u0914\u0930 \u0932\u0940\u091C\u093F\u0902\u0917 \u0921\u0947\u091F\u093E \u0915\u094B \u090F\u0915 \u091C\u0917\u0939 \u0932\u093E\u0924\u0947 \u0939\u0948\u0902\u0964'},
        {m:['\u0928\u0924\u0940\u091C','\u0930\u093F\u091C\u093C\u0932\u094D\u091F','\u0906\u0902\u0915\u0921\u093C','\u0938\u0902\u0916\u094D\u092F'],
         a:'\u0939\u0930 \u0938\u093E\u0932 \u0924\u0940\u0938 \u0932\u093E\u0916 \u092A\u093E\u0909\u0902\u0921 \u0938\u0947 \u091C\u093C\u094D\u092F\u093E\u0926\u093E \u0915\u093E \u090F\u0921 \u0916\u0930\u094D\u091A \u0938\u0902\u092D\u093E\u0932\u093E, \u092C\u093E\u0930\u0939 \u0915\u0930\u094B\u0921\u093C \u0938\u0947 \u091C\u093C\u094D\u092F\u093E\u0926\u093E \u0907\u0902\u092A\u094D\u0930\u0947\u0936\u0928 \u0914\u0930 \u091B\u093F\u092F\u093E\u0938\u0940 \u0939\u091C\u093C\u093E\u0930 \u0915\u0928\u094D\u0935\u0930\u094D\u091C\u093C\u0928 \u0938\u093E\u092E\u0928\u0947 \u0932\u093E\u090F, \u0914\u0930 \u0938\u094C \u0938\u0947 \u091C\u093C\u094D\u092F\u093E\u0926\u093E \u090F\u0921 \u0905\u0915\u093E\u0909\u0902\u091F \u091A\u0932\u093E\u090F\u0964'},
        {m:['\u091F\u0942\u0932','\u0938\u094D\u091F\u0948\u0915','\u0924\u0915\u0928\u0940\u0915','\u0938\u094D\u0915\u093F\u0932'],
         a:'\u0932\u0941\u0915\u0930 \u0938\u094D\u091F\u0942\u0921\u093F\u092F\u094B, \u092A\u093E\u0935\u0930 \u092C\u0940\u0906\u0908, \u0917\u0942\u0917\u0932 \u090F\u092A\u094D\u0938 \u0938\u094D\u0915\u094D\u0930\u093F\u092A\u094D\u091F, \u0938\u094D\u0928\u094B\u092B\u093C\u094D\u0932\u0947\u0915, \u091C\u0940\u090F4, \u092C\u093F\u0917\u0915\u094D\u0935\u0947\u0930\u0940 \u0914\u0930 \u0915\u094D\u0932\u0949\u0921 \u090F\u0906\u0908\u0964'},
        {m:['\u0939\u093E\u092F\u0930','\u0930\u0947\u091F','\u0915\u0940\u092E\u0924','\u0909\u092A\u0932\u092C\u094D\u0927','\u0916\u0930\u094D\u091A'],
         a:'\u0928\u090F \u092A\u094D\u0930\u094B\u091C\u0947\u0915\u094D\u091F \u0915\u0947 \u0932\u093F\u090F \u0909\u092A\u0932\u092C\u094D\u0927 \u0939\u0948\u0902\u0964 \u0928\u0940\u091A\u0947 \u0915\u0949\u0932 \u092C\u0941\u0915 \u0915\u0930 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902 \u092F\u093E <b>'+E+'</b> \u092A\u0930 \u0908\u092E\u0947\u0932 \u0915\u0930 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964'}
      ]
    },

    as:{
      label:'\u0985\u09B8', name:'\u0985\u09B8\u09AE\u09C0\u09DF\u09BE',
      sr:['as-IN','bn-IN','hi-IN'],
      tts:[/as-IN/i,/assam/i,/bn-IN/i,/bengali/i,/\u09AC\u09BE\u0982\u09B2\u09BE/,/hi-IN/i],
      wake:['\u09B9\u09C7\u0987 \u099C\u09BE\u09F0\u09CD\u09AD\u09BF\u099B','\u099C\u09BE\u09F0\u09CD\u09AD\u09BF\u099B','\u099C\u09BE\u09B0\u09CD\u09AD\u09BF\u09B8','hey jarvis','jarvis'],
      quick:['\u09A4\u09C7\u0993\u0981 \u0995\u09BF \u0995\u09F0\u09C7?','\u09AB\u09B2\u09BE\u09AB\u09B2 \u09A6\u09C7\u0996\u09C1\u09F1\u09BE\u0993\u0995','\u099F\u09CD\u09AF\u09C1\u09F0 \u09A6\u09BF\u09AF\u09BC\u0995','\u0995\u09B2 \u09AC\u09C1\u0995 \u0995\u09F0\u0995'],
      kw:{open:['\u0996\u09CB\u09B2','\u09A6\u09C7\u0996\u09C1\u0993','\u09A6\u09C7\u0996\u09C1\u09F1\u09BE','open','show'],
          tour:['\u099F\u09CD\u09AF\u09C1\u09F0','\u09AD\u09CD\u09F0\u09AE\u09A3','tour'],
          book:['\u09AC\u09C1\u0995','\u0995\u09B2','\u09AE\u09BF\u099F\u09BF\u0982','\u09AF\u09CB\u0997\u09BE\u09AF\u09CB\u0997','book','call'],
          email:['\u0987\u09AE\u09C7\u0987\u09B2','email'],
          work:['\u0995\u09BE\u09AE','\u09AA\u09CD\u09F0\u099C\u09C7\u0995\u09CD\u099F','\u09A1\u09C7\u099B\u09AC\u09F0\u09CD\u09A1','work'],
          stop:['\u09F0\u0996\u09BE','\u099A\u09C1\u09AA','\u09AC\u09A8\u09CD\u09A7','stop']},
      s:{
        identity:'\u09AE\u0987 {N}, \u098F\u0987 \u099B\u09BE\u0987\u099F\u09F0 \u09B8\u09B9\u09BE\u09AF\u09BC\u0995\u0964 \u09AE\u0987 <b>\u09AF\u09BF\u0995\u09CB\u09A8\u09CB \u09B2\u09BE\u0987\u09AD \u09A1\u09C7\u099B\u09AC\u09F0\u09CD\u09A1</b> \u0996\u09C1\u09B2\u09BF\u09AC \u09AA\u09BE\u09F0\u09CB\u0981, \u098F\u099F\u09BE <b>\u0997\u09BE\u0987\u09A1\u09C7\u09A1 \u099F\u09CD\u09AF\u09C1\u09F0</b> \u09A6\u09BF\u09AC \u09AA\u09BE\u09F0\u09CB\u0981, \u0986\u09F0\u09C1 \u0986\u09AA\u09CB\u09A8\u09BE\u0995 <b>\u09AC\u09C1\u0995\u09BF\u0982\u09B2\u09C8</b> \u09B2\u09C8 \u09AF\u09BE\u09AC \u09AA\u09BE\u09F0\u09CB\u0981\u0964 \u0995\u0993\u0995 "\u09B2\u09BF\u099C\u09BF\u0982 \u09A1\u09C7\u099B\u09AC\u09F0\u09CD\u09A1 \u0996\u09CB\u09B2\u0995"\u0964',
        opening:'\u09AE\u0987 <b>{x}</b>\u09F0 \u09B2\u09BE\u0987\u09AD \u09A1\u09C7\u09AE\u09CB \u0996\u09C1\u09B2\u09BF \u0986\u099B\u09CB\u0981\u0964',
        tour:['\u099A\u09AE\u09C1 \u09AD\u09CD\u09F0\u09AE\u09A3\u0964 \u098F\u0987\u09AC\u09CB\u09F0 \u0995\u09BE\u09AE\u09F0 \u09AA\u09BF\u099B\u09F0 \u09B8\u0982\u0996\u09CD\u09AF\u09BE: \u09AC\u099B\u09F0\u09C7\u0995\u09A4 \u09A4\u09CD\u09F0\u09BF\u09B6 \u09B2\u09BE\u0996 \u09AA\u09BE\u0989\u09A3\u09CD\u09A1\u09A4\u0995\u09C8 \u0985\u09A7\u09BF\u0995 \u09AC\u09BF\u099C\u09CD\u099E\u09BE\u09AA\u09A8 \u0996\u09F0\u099A, \u0986\u09F0\u09C1 \u09AC\u09BE\u09F0 \u0995\u09CB\u099F\u09BF\u09A4\u0995\u09C8 \u0985\u09A7\u09BF\u0995 \u0987\u09AE\u09CD\u09AA\u09CD\u09F0\u09C7\u099B\u09A8\u0964',
              '\u098F\u0987\u099F\u09CB \u098F\u09A1\u0995\u09AE\u09BE\u09A3\u09CD\u09A1, \u0986\u099F\u09BE\u0987\u09A4\u0995\u09C8 \u09A1\u09BE\u0999\u09F0 \u09AA\u09CD\u09F0\u099C\u09C7\u0995\u09CD\u099F\u0964 \u09B7\u09CB\u09B2\u09CD\u09B2\u099F\u09BE \u098F\u0995\u09BE\u0989\u09A3\u09CD\u099F \u099A\u09B2\u09CB\u09F1\u09BE \u098F\u099F\u09BE \u0997\u09C1\u0997\u09B2 \u098F\u09A1\u099B \u0995\u09AE\u09BE\u09A3\u09CD\u09A1 \u099A\u09C7\u09A3\u09CD\u099F\u09BE\u09F0, \u09AD\u09BF\u09A4\u09F0\u09A4\u09C7 \u0995\u09CD\u09B2\u09A1 \u098F\u09A8\u09BE\u09B2\u09BF\u09B7\u09CD\u099F \u0986\u099B\u09C7\u0964',
              '\u09A4\u09B2\u09A4 \u099B\u099F\u09BE \u09B2\u09BE\u0987\u09AD \u09A1\u09C7\u099B\u09AC\u09F0\u09CD\u09A1 \u0986\u099B\u09C7\u0964 \u09AA\u09CD\u09F0\u09A4\u09BF\u099F\u09CB\u09F1\u09C7 \u09AC\u09CD\u09F0\u09BE\u0989\u099C\u09BE\u09F0\u09A4\u09C7 \u099A\u09B2\u09BF \u09A5\u09BE\u0995\u09C7\u0964',
              '\u09AD\u09BE\u09B2 \u09B2\u09BE\u0997\u09BF\u09B2\u09C7 \u098F\u099F\u09BE \u0995\u09B2 \u09AC\u09C1\u0995 \u0995\u09F0\u09BF\u09AC\u09B2\u09C8 \u09A4\u09CD\u09F0\u09BF\u09B6 \u099B\u09C7\u0995\u09C7\u09A3\u09CD\u09A1 \u09B2\u09BE\u0997\u09C7\u0964 \u09AF\u09BF\u0995\u09CB\u09A8\u09CB \u09B8\u09AE\u09AF\u09BC\u09A4\u09C7 \u0995\u0993\u0995 "\u0995\u09B2 \u09AC\u09C1\u0995 \u0995\u09F0\u0995"\u0964'],
        apps:'\u09B2\u09BE\u0987\u09AD \u098F\u09AA\u09AC\u09CB\u09F0 \u09A6\u09C7\u0996\u09C1\u09F1\u09BE\u0987\u099B\u09CB\u0981\u0964 \u09AA\u09CD\u09F0\u09A4\u09BF\u099F\u09CB\u09F1\u09C7 \u098F\u099F\u09BE \u099A\u09B2\u09BF \u09A5\u0995\u09BE \u09A1\u09C7\u09AE\u09CB \u0996\u09CB\u09B2\u09C7\u0964',
        looker:'\u098F\u0987\u09AC\u09CB\u09F0 \u09B2\u09C1\u0995\u09BE\u09F0 \u09B7\u09CD\u099F\u09C1\u09A1\u09BF\u0993\u09F0 \u0995\u09BE\u09AE\u0964',
        all:'\u09B8\u0995\u09B2\u09CB\u09AC\u09CB\u09F0 \u09A6\u09C7\u0996\u09C1\u09F1\u09BE\u0987\u099B\u09CB\u0981\u0964',
        work:'\u098F\u0987\u09AF\u09BC\u09BE \u0995\u09BE\u09AE\u09AC\u09CB\u09F0\u0964 \u0995\u0993\u0995 "\u09B2\u09BF\u099C\u09BF\u0982 \u09A1\u09C7\u099B\u09AC\u09F0\u09CD\u09A1 \u0996\u09CB\u09B2\u0995", \u09AE\u0987 \u0996\u09C1\u09B2\u09BF \u09A6\u09BF\u09AE\u0964',
        about:'\u09AC\u09C7\u0995\u0997\u09CD\u09F0\u09BE\u0989\u09A3\u09CD\u09A1\u09B2\u09C8 \u09B2\u09C8 \u0997\u08F0\u099B\u09CB\u0981\u0964',
        skills:'\u098F\u0987\u09AF\u09BC\u09BE \u099F\u09C7\u0995 \u09B7\u09CD\u099F\u09C7\u0995\u0964',
        clients:'\u098F\u0987 \u09AC\u09CD\u09F0\u09C7\u09A3\u09CD\u09A1\u09AC\u09CB\u09F0\u09F0 \u09AC\u09BE\u09AC\u09C7 \u09A4\u09C7\u0993\u0981 \u0995\u09BE\u09AE \u0995\u09F0\u09BF\u099B\u09C7\u0964',
        booking:'\u09AC\u09C1\u0995\u09BF\u0982 \u09AA\u09C3\u09B7\u09CD\u09A0\u09BE\u09F0 \u09A4\u09B2\u09A4 \u0986\u099B\u09C7\u0964 \u0986\u09AA\u09C1\u09A8\u09BF \u0995\u09C7\u09B2\u09C7\u09A3\u09CD\u09A1\u09BE\u09F0\u09A4 \u09B8\u09AE\u09AF\u09BC \u09B2\u09AC \u09AA\u09BE\u09F0\u09C7, \u09AC\u09BE <b>'+E+'</b>\u09A4 \u0987\u09AE\u09C7\u0987\u09B2 \u0995\u09F0\u09BF\u09AC \u09AA\u09BE\u09F0\u09C7\u0964',
        email:'\u09A4\u09C7\u0993\u0981\u09F0 \u0987\u09AE\u09C7\u0987\u09B2 <b>'+E+'</b>\u0964 \u09AE\u0987 \u0987\u09AF\u09BC\u09BE\u0995 \u0995\u09CD\u09B2\u09BF\u09AA\u09AC\u09F0\u09CD\u09A1\u09A4 \u0995\u09AA\u09BF \u0995\u09F0\u09BF \u09A6\u09BF\u09B2\u09CB\u0981\u0964',
        theme:'\u09A5\u09C0\u09AE \u09B8\u09B2\u09A8\u09BF \u0995\u09F0\u09BF\u09B2\u09CB\u0981\u0964', top:'\u0993\u09AA\u09F0\u09B2\u09C8 \u0989\u09AD\u09A4\u09BF \u0997\u08F0\u099B\u09CB\u0981\u0964',
        greet:'\u0986\u09AA\u09CB\u09A8\u09BE\u0995 \u09B2\u0997 \u09AA\u09BE\u0987 \u09AD\u09BE\u09B2 \u09B2\u09BE\u0997\u09BF\u09B2, <b>{n}</b>\u0964 \u09AF\u09BF\u0995\u09CB\u09A8\u09CB \u09A1\u09C7\u099B\u09AC\u09F0\u09CD\u09A1 \u0996\u09C1\u09B2\u09BF\u09AC\u09B2\u09C8 \u0995\u0993\u0995, \u09AC\u09BE \u0995\u0993\u0995 "\u099F\u09CD\u09AF\u09C1\u09F0 \u09A6\u09BF\u09AF\u09BC\u0995"\u0964',
        micDenied:'\u09AE\u09BE\u09A4 \u09B6\u09C1\u09A8\u09BF\u09AC\u09B2\u09C8 \u09AE\u09BE\u0987\u0995\u09CD\u09F0\u09CB\u09AB\u09CB\u09A8\u09F0 \u0985\u09A8\u09C1\u09AE\u09A4\u09BF \u09B2\u09BE\u0997\u09C7\u0964 \u0986\u09AA\u09C1\u09A8\u09BF \u099F\u09BE\u0987\u09AA \u0995\u09F0\u09BF\u0993 \u09B8\u09C1\u09A7\u09BF\u09AC \u09AA\u09BE\u09F0\u09C7\u0964',
        wakeOn:'\u09F1\u09C7\u0995 \u09F1\u09F0\u09CD\u09A1 \u0985\u09A8 \u09B9\u09B2\u0964 \u0995\u0993\u0995 <b>"\u09B9\u09C7\u0987 {w}"</b>, \u09AE\u0987 \u09B6\u09C1\u09A8\u09BF\u09AE\u0964',
        wakeOff:'\u09F1\u09C7\u0995 \u09F1\u09F0\u09CD\u09A1 \u0985\u09AB \u09B9\u09B2\u0964 \u09B2\u09BE\u0997\u09BF\u09B2\u09C7 \u09AE\u09BE\u0987\u0995 \u099F\u09BF\u09AA\u0995\u0964',
        voiceOn:'\u09AE\u09BE\u09A4 \u0985\u09A8\u0964',
        noSR:'\u098F\u0987 \u09AC\u09CD\u09F0\u09BE\u0989\u099C\u09BE\u09F0\u09A4 \u09AE\u09BE\u09A4\u09C7\u09F0\u09C7 \u0987\u09A8\u09AA\u09C1\u099F \u09A8\u099A\u09B2\u09C7, \u0995\u09BF\u09A8\u09CD\u09A4\u09C1 \u0986\u09AA\u09C1\u09A8\u09BF \u099F\u09BE\u0987\u09AA \u0995\u09F0\u09BF\u09AC \u09AA\u09BE\u09F0\u09C7\u0964',
        backUnseen:'\u09AA\u09C1\u09A8\u09F0 \u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE{n}\u0964 \u0986\u09AA\u09C1\u09A8\u09BF \u098F\u09A4\u09BF\u09AF\u09BC\u09BE\u0993 <b>{x}</b> \u099A\u09CB\u09F1\u09BE \u09A8\u09BE\u0987\u0964 \u0996\u09C1\u09B2\u09BF \u09A6\u09BF\u09AE \u09A8\u09C7\u0995\u09BF?',
        backBook:'\u09AA\u09C1\u09A8\u09F0 \u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE{n}\u0964 \u09A6\u09C7\u09AC\u09F0 \u09B8\u09C8\u09A4\u09C7 \u098F\u099F\u09BE \u099A\u09AE\u09C1 \u0995\u09B2 \u09AC\u09C1\u0995 \u0995\u09F0\u09BF\u09AC \u09A8\u09C7\u0995\u09BF?',
        nudge:'\u098F\u0987\u09AC\u09CB\u09F0 \u09B8\u0995\u09B2\u09CB \u09B2\u09BE\u0987\u09AD \u099A\u09B2\u09C7\u0964 \u098F\u099F\u09BE \u0996\u09C1\u09B2\u09BF \u09A6\u09C7\u0996\u09C1\u09F1\u09BE\u09AE \u09A8\u09C7\u0995\u09BF?',
        exit:'\u09AF\u09CB\u09F1\u09BE\u09F0 \u0986\u0997\u09A4\u09C7: \u09AE\u0987 \u0986\u09AA\u09CB\u09A8\u09BE\u0995 \u09AA\u09CB\u09A8\u09C7 \u09AA\u09CB\u09A8\u09C7 \u09A6\u09C7\u09AC\u09F0 \u0995\u09C7\u09B2\u09C7\u09A3\u09CD\u09A1\u09BE\u09F0\u09B2\u09C8 \u09AA\u09A0\u09BF\u09AF\u09BC\u09BE\u09AC \u09AA\u09BE\u09F0\u09CB\u0981\u0964',
        yOpen:'\u0996\u09CB\u09B2\u0995', yTour:'\u099F\u09CD\u09AF\u09C1\u09F0 \u09A6\u09BF\u09AF\u09BC\u0995', yBook:'\u0995\u09B2 \u09AC\u09C1\u0995 \u0995\u09F0\u0995', no:'\u098F\u09A4\u09BF\u09AF\u09BC\u09BE \u09A8\u09B9\u09AF\u09BC',
        langSet:'\u098F\u09A4\u09BF\u09AF\u09BC\u09BE\u09F0 \u09AA\u09F0\u09BE \u09AE\u0987 \u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE\u09A4 \u0995\u09AE\u0964',
        noVoice:'\u098F\u0987 \u09A1\u09BF\u09AD\u09BE\u0987\u099A\u09A4 \u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE \u09AE\u09BE\u09A4 \u09A8\u09BE\u0987, \u09B8\u09C7\u09AF\u09BC\u09C7\u09B9\u09C7 \u09AE\u0987 \u0993\u099A\u09F0\u09F0 \u09AE\u09BE\u09A4 \u09AC\u09CD\u09AF\u09F1\u09B9\u09BE\u09F0 \u0995\u09F0\u09BF\u09AE\u0964',
        elsewhere:'\u098F\u0987 \u0989\u09A4\u09CD\u09A4\u09F0\u099F\u09CB \u09AE\u09CB\u09F0 \u0993\u099A\u09F0\u09A4 \u0987\u0982\u09F0\u09BE\u099C\u09C0\u09A4 \u0986\u099B\u09C7\u0964 EN \u09B2\u09C8 \u09B8\u09B2\u09A8\u09BF \u0995\u09F0\u0995, \u09AC\u09BE \u09AE\u09CB\u0995 \u09A1\u09C7\u099B\u09AC\u09F0\u09CD\u09A1 \u0996\u09C1\u09B2\u09BF\u09AC\u09B2\u09C8 \u0995\u0993\u0995\u0964'
      },
      kb:[
        {m:['\u0995\u09BF \u0995\u09F0\u09C7','\u0995\u09CB\u09A8','\u09AA\u09F0\u09BF\u099A\u09AF\u09BC'],
         a:'\u09A6\u09C7\u09AC\u09C7 \u09AE\u09BE\u09F0\u09CD\u0995\u09C7\u099F\u09BF\u0982 \u0986\u09F0\u09C1 \u09A1\u09C7\u099F\u09BE\u09F0 \u09AE\u09BE\u099C\u09A4 \u0995\u09BE\u09AE \u0995\u09F0\u09C7\u0964 \u09A4\u09C7\u0993\u0981 \u09B2\u09BE\u0987\u09AD, \u098F \u0986\u0987 \u099A\u09BE\u09B2\u09BF\u09A4 \u09A1\u09C7\u099B\u09AC\u09F0\u09CD\u09A1 \u09B8\u09BE\u099C\u09C7 \u09AF\u09BF\u09AF\u09BC\u09C7 \u0997\u09C1\u0997\u09B2 \u098F\u09A1\u099B, \u099C\u09BF\u098F4, \u099A\u09BE\u09F0\u09CD\u099A \u0995\u09A8\u099B\u09B2 \u0986\u09F0\u09C1 \u09B2\u09BF\u099C\u09BF\u0982 \u09A1\u09C7\u099F\u09BE \u098F\u0995\u09B2\u0997 \u0995\u09F0\u09C7\u0964'},
        {m:['\u09AB\u09B2\u09BE\u09AB\u09B2','\u09F0\u09BF\u099C\u09BE\u09B2\u09CD\u099F','\u09B8\u0982\u0996\u09CD\u09AF\u09BE'],
         a:'\u09AC\u099B\u09F0\u09C7\u0995\u09A4 \u09A4\u09CD\u09F0\u09BF\u09B6 \u09B2\u09BE\u0996 \u09AA\u09BE\u0989\u09A3\u09CD\u09A1\u09A4\u0995\u09C8 \u0985\u09A7\u09BF\u0995 \u098F\u09A1 \u0996\u09F0\u099A \u099A\u09AE\u09BE\u09B2\u09BF\u099B\u09C7, \u09AC\u09BE\u09F0 \u0995\u09CB\u099F\u09BF\u09A4\u0995\u09C8 \u0985\u09A7\u09BF\u0995 \u0987\u09AE\u09CD\u09AA\u09CD\u09F0\u09C7\u099B\u09A8 \u0986\u09F0\u09C1 \u09AC\u09BE\u09F0\u09BF\u09AF\u09BC\u09B7\u09B7\u09CD\u09A0\u09BF \u09B9\u09BE\u099C\u09BE\u09F0 \u0995\u09A8\u09AD\u09BE\u09F0\u09CD\u099B\u09A8 \u0989\u09B2\u09BF\u09AF\u09BC\u09BE\u0987\u099B\u09C7, \u0986\u09F0\u09C1 \u098F\u09B6\u09A4\u0995\u09C8 \u0985\u09A7\u09BF\u0995 \u098F\u09A1 \u098F\u0995\u09BE\u0989\u09A3\u09CD\u099F \u099A\u09B2\u09BE\u0987\u099B\u09C7\u0964'},
        {m:['\u099F\u09C1\u09B2','\u09B7\u09CD\u099F\u09C7\u0995','\u09A6\u0995\u09CD\u09B7\u09A4\u09BE'],
         a:'\u09B2\u09C1\u0995\u09BE\u09F0 \u09B7\u09CD\u099F\u09C1\u09A1\u09BF\u0993, \u09AA\u09BE\u0993\u09F1\u09BE\u09F0 \u09AC\u09BF\u0986\u0987, \u0997\u09C1\u0997\u09B2 \u098F\u09AA\u09CD\u09B8 \u09B8\u09CD\u0995\u09CD\u09F0\u09BF\u09AA\u09CD\u099F, \u09B8\u09CD\u09A8\u09CB\u09AB\u09CD\u09B2\u09C7\u0995, \u099C\u09BF\u098F4, \u09AC\u09BF\u0997\u0995\u09C1\u09F1\u09C7\u09F0\u09C0 \u0986\u09F0\u09C1 \u0995\u09CD\u09B2\u09A1 \u098F \u0986\u0987\u0964'},
        {m:['\u09B9\u09BE\u09AF\u09BC\u09BE\u09F0','\u09F0\u09C7\u099F','\u09A6\u09BE\u09AE','\u0989\u09AA\u09B2\u09AC\u09CD\u09A7'],
         a:'\u09A8\u09A4\u09C1\u09A8 \u09AA\u09CD\u09F0\u099C\u09C7\u0995\u09CD\u099F\u09F0 \u09AC\u09BE\u09AC\u09C7 \u0989\u09AA\u09B2\u09AC\u09CD\u09A7\u0964 \u09A4\u09B2\u09A4 \u0995\u09B2 \u09AC\u09C1\u0995 \u0995\u09F0\u09BF\u09AC \u09AA\u09BE\u09F0\u09C7 \u09AC\u09BE <b>'+E+'</b>\u09A4 \u0987\u09AE\u09C7\u0987\u09B2 \u0995\u09F0\u09BF\u09AC \u09AA\u09BE\u09F0\u09C7\u0964'}
      ]
    }
  };

  var ORDER=['en','hi','as'];
  var NAME='Jarvis';

  /* ---------- environment ---------- */
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition||null;
  var TTS=window.speechSynthesis||null;
  var RM=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------- memory ---------- */
  var mem=load();
  function load(){
    var d={visits:0,last:0,name:'',seen:[],muted:false,wake:false,toldAbout:[],lang:'en'};
    try{var r=JSON.parse(localStorage.getItem(STORE)||'{}');for(var k in d)if(r[k]!==undefined)d[k]=r[k];}catch(e){}
    if(!LANGS[d.lang]) d.lang='en';
    return d;
  }
  function save(){try{localStorage.setItem(STORE,JSON.stringify(mem));}catch(e){}}
  function L(){return LANGS[mem.lang];}
  function t(key,vars){
    var s=L().s[key]; if(s===undefined) s=LANGS.en.s[key]||'';
    if(vars) for(var k in vars) s=s.split('{'+k+'}').join(vars[k]);
    return s.split('{N}').join(NAME).split('{w}').join(NAME.toLowerCase());
  }

  /* ---------- elements ---------- */
  var fab=document.getElementById('chatFab');
  var panel=document.getElementById('chatPanel');
  var input=document.getElementById('chatInput');
  if(!fab||!panel) return;

  fab.classList.add('jv');
  fab.setAttribute('aria-label','Talk to '+NAME);
  var orb=el('span','jv-core'), r1=el('span','jv-ring'), r2=el('span','jv-ring'),
      bars=el('span','jv-bars'), mini=el('span','jv-mini');
  bars.innerHTML='<i></i><i></i><i></i><i></i><i></i>'; mini.textContent='J';
  [orb,r1,r2,bars,mini].forEach(function(n){fab.appendChild(n);});
  function el(tag,cls){var n=document.createElement(tag);n.className=cls;return n;}

  /* controls */
  var top=panel.querySelector('.chat-top');
  var ctl=el('div','jv-ctl');
  var bLang=mk(L().label,'Language'); bLang.classList.add('lang');
  var bMic=mk('&#127908;','Tap to talk');
  var bSpk=mk('&#128266;','Voice replies');
  var bWake=mk('&#128225;','Wake word');
  function mk(html,title){var b=document.createElement('button');b.innerHTML=html;b.title=title;b.type='button';return b;}
  [bLang,bMic,bSpk,bWake].forEach(function(b){ctl.appendChild(b);});
  if(top){var x=top.querySelector('.x');top.insertBefore(ctl,x||null);}
  if(!SR){bMic.style.display='none';bWake.style.display='none';}
  if(!TTS){bSpk.style.display='none';}
  if(!mem.muted) bSpk.classList.add('on');
  if(mem.wake) bWake.classList.add('on');
  fab.classList.toggle('muted',!!mem.muted);

  var whoEl=panel.querySelector('.who'), statEl=panel.querySelector('.stat'), avEl=panel.querySelector('.av');
  if(whoEl) whoEl.textContent=NAME.toUpperCase();
  if(avEl) avEl.textContent='\u25C9';

  var hear=el('div','jv-hear');
  hear.innerHTML='<span class="dot"></span><span id="jvHeard"></span>';
  var inputRow=panel.querySelector('.chat-input');
  if(inputRow) panel.insertBefore(hear,inputRow); else panel.appendChild(hear);
  var heardEl=document.getElementById('jvHeard');

  function applyLangUI(){
    bLang.textContent=L().label;
    bLang.title='Language: '+L().name;
    if(statEl) statEl.innerHTML='<span class="d"></span>'+(SR?L().name+' \u00b7 "hey '+NAME.toLowerCase()+'"':L().name);
    if(input) input.setAttribute('placeholder', L().quick[0]);
    if(typeof window.setQuick==='function'){ try{ window.setQuick(L().quick); }catch(e){} }
  }
  applyLangUI();

  /* ---------- state ---------- */
  var state='idle',armed=false,wantWake=false,recog=null,recogOn=false,voiceUnlocked=false,srIdx=0;
  function setState(s){
    state=s;
    fab.classList.remove('listening','thinking','speaking');
    if(s!=='idle') fab.classList.add(s);
    hear.classList.toggle('on',s==='listening');
    mini.textContent = (s==='listening')?'':(mem.muted?'\u2715':'J');
  }

  /* =====================================================================
     VOICE OUT
     ===================================================================== */
  var voice=null, warnedNoVoice={};
  function pickVoice(){
    if(!TTS) return null;
    var vs=TTS.getVoices()||[]; if(!vs.length) return null;
    var pats=L().tts;
    for(var i=0;i<pats.length;i++)
      for(var j=0;j<vs.length;j++)
        if(pats[i].test(vs[j].name+' '+vs[j].lang)) return vs[j];
    return null;                      // no acceptable voice for this language
  }
  function refreshVoice(){
    voice=pickVoice();
    if(!voice && TTS && (TTS.getVoices()||[]).length && !warnedNoVoice[mem.lang]){
      warnedNoVoice[mem.lang]=true;
      setTimeout(function(){ if(typeof window.botSay==='function') window.botSay(t('noVoice')); },600);
    }
  }
  if(TTS){ refreshVoice(); TTS.onvoiceschanged=function(){ refreshVoice(); }; }

  function strip(html){
    var d=document.createElement('div'); d.innerHTML=String(html||'');
    return (d.textContent||'').replace(/\s+/g,' ').trim().replace(/https?:\/\/\S+/g,'');
  }
  function speak(text){
    if(!TTS||mem.muted||!voiceUnlocked) return;
    var s=strip(text); if(!s) return;
    if(s.length>420) s=s.slice(0,420);
    try{TTS.cancel();}catch(e){}
    var u=new SpeechSynthesisUtterance(s);
    if(voice) u.voice=voice;
    u.lang=(voice&&voice.lang)||L().sr[0];
    u.rate=mem.lang==='en'?1.02:0.96;
    u.pitch=0.92;
    u.onstart=function(){ if(state!=='listening') setState('speaking'); };
    u.onend=function(){ if(state==='speaking') setState('idle'); };
    u.onerror=function(){ if(state==='speaking') setState('idle'); };
    try{TTS.speak(u);}catch(e){}
  }
  function shutUp(){try{TTS&&TTS.cancel();}catch(e){} if(state==='speaking')setState('idle');}
  function unlock(){
    if(voiceUnlocked||!TTS) return;
    voiceUnlocked=true;
    try{var u=new SpeechSynthesisUtterance(' ');u.volume=0;TTS.speak(u);}catch(e){}
  }
  ['click','touchstart','keydown'].forEach(function(ev){
    document.addEventListener(ev,unlock,{once:true,passive:true});
  });

  /* =====================================================================
     VOICE IN
     ===================================================================== */
  function buildRecog(){
    if(!SR) return null;
    var r=new SR();
    r.lang=L().sr[srIdx]||L().sr[0];
    r.interimResults=true; r.maxAlternatives=1; r.continuous=true;
    r.onresult=function(e){
      var interim='',fin='';
      for(var i=e.resultIndex;i<e.results.length;i++){
        var tr=e.results[i][0].transcript;
        if(e.results[i].isFinal) fin+=tr; else interim+=tr;
      }
      var shown=(fin||interim).trim();
      if(shown) heardEl.textContent=shown;
      if(!armed){
        var low=(fin||interim).toLowerCase();
        var wakes=L().wake.concat(LANGS.en.wake);
        for(var w=0;w<wakes.length;w++){
          if(low.indexOf(wakes[w])>=0){
            var after=low.split(wakes[w]).pop().trim();
            arm();
            if(after&&after.split(' ').length>1){armed=false;handle(after);}
            return;
          }
        }
        return;
      }
      if(fin.trim()){var cmd=fin.trim();armed=false;setState('thinking');heardEl.textContent=cmd;handle(cmd);}
    };
    r.onerror=function(e){
      if(e.error==='language-not-supported'&&srIdx<L().sr.length-1){
        srIdx++; recog=null; recogOn=false;
        setTimeout(startRecog,200);
        return;
      }
      if(e.error==='not-allowed'||e.error==='service-not-allowed'){
        wantWake=false;bWake.classList.remove('on');mem.wake=false;save();
        recogOn=false;setState('idle');botTell(t('micDenied'));
      }
    };
    r.onend=function(){
      recogOn=false;
      if(wantWake) setTimeout(startRecog,350);
      else if(state==='listening'){setState('idle');armed=false;}
    };
    return r;
  }
  function startRecog(){
    if(!SR||recogOn) return;
    if(!recog) recog=buildRecog();
    try{recog.start();recogOn=true;}catch(e){}
  }
  function stopRecog(){
    wantWake=false;armed=false;
    try{recog&&recog.stop();}catch(e){}
    recogOn=false;setState('idle');
  }
  function arm(){
    armed=true;setState('listening');heardEl.textContent='\u2026';
    if(!panel.classList.contains('open')&&typeof window.openChat==='function') window.openChat();
    beep();
  }
  function listenOnce(){
    unlock();
    if(!SR){botTell(t('noSR'));return;}
    wantWake=wantWake||mem.wake;
    startRecog();arm();
  }
  function beep(){
    try{
      var C=window.AudioContext||window.webkitAudioContext; if(!C) return;
      var c=new C(),o=c.createOscillator(),g=c.createGain();
      o.type='sine';o.frequency.value=880;
      g.gain.setValueAtTime(0.0001,c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.09,c.currentTime+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+0.22);
      o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+0.24);
      setTimeout(function(){try{c.close();}catch(e){}},400);
    }catch(e){}
  }

  /* =====================================================================
     WIRE THE EXISTING BOT
     ===================================================================== */
  var origBotSay=window.botSay;
  if(typeof origBotSay==='function'){
    window.botSay=function(html,next){
      /* the built in greeting is English only, so swap it when needed */
      if(mem.lang!=='en' && typeof html==='string' && /Debashish's assistant|I'm Debashish/i.test(html)){
        html=t('identity'); arguments[0]=html;
      }
      origBotSay.apply(this,arguments);
      speak(html);
      if(state==='thinking') setState(mem.muted?'idle':'speaking');
    };
  }
  function botTell(html){ if(typeof window.botSay==='function') window.botSay(html); else speak(html); }
  function userEcho(txt){ if(typeof window.addUser==='function') window.addUser(txt); }

  var origRespond=window.respond;
  if(typeof origRespond==='function'){
    window.respond=function(q){
      if(runAction(q)) return;
      if(mem.lang!=='en'){                       // localized mini brain
        var hit=kbHit(q);
        botTell(hit||t('elsewhere'));
        return;
      }
      setState('thinking');
      origRespond.apply(this,arguments);
    };
  }
  function kbHit(q){
    var n=norm(q), kb=L().kb||[];
    for(var i=0;i<kb.length;i++)
      for(var j=0;j<kb[i].m.length;j++)
        if(n.indexOf(kb[i].m[j])>=0) return kb[i].a;
    return null;
  }
  function handle(text){
    userEcho(text);
    if(typeof window.respond==='function') window.respond(text);
    else if(!runAction(text)) botTell(t('elsewhere'));
  }

  /* =====================================================================
     ACTIONS
     ===================================================================== */
  var DEMOS=[
    {k:'hub',  n:'Marketing Intelligence Hub', m:['hub','intelligence hub','control room','\u0939\u092C','\u09B9\u09BE\u09AC']},
    {k:'ga4',  n:'Analytics Dashboard',        m:['ga4','analytics','\u090F\u0928\u093E\u0932\u093F\u091F\u093F\u0915\u094D\u0938','\u098F\u09A8\u09BE\u09B2\u09BF\u099F\u09BF\u0995\u09CD\u09B8','\u091C\u0940\u090F4','\u099C\u09BF\u098F4']},
    {k:'lease',n:'Leasing Dashboard',          m:['leasing','snowflake','lease','occupancy','\u0932\u0940\u091C\u093F\u0902\u0917','\u09B2\u09BF\u099C\u09BF\u0982']},
    {k:'gbp',  n:'Reviews Dashboard',          m:['review','reviews','business profile','gbp','\u0930\u093F\u0935\u094D\u092F\u0942','\u09F0\u09BF\u09AD\u09BF\u0989']},
    {k:'gsc',  n:'Search Console Dashboard',   m:['search console','gsc','organic','seo','\u0938\u0930\u094D\u091A','\u099A\u09BE\u09F0\u09CD\u099A']},
    {k:'ads',  n:'AdCommand',                  m:['ad command','adcommand','ads','google ads','ppc','\u090F\u0921','\u098F\u09A1']}
  ];
  function norm(s){
    var x=String(s||'').toLowerCase();
    try{ x=x.replace(/[^\p{L}\p{N}\p{M} ]/gu,' '); }catch(e){ x=x.replace(/[^\w\u0900-\u097F\u0980-\u09FF ]/g,' '); }
    return x.replace(/\s+/g,' ').trim();
  }
  function has(text,list){ for(var i=0;i<list.length;i++) if(text.indexOf(list[i])>=0) return true; return false; }
  function kws(group){ return (L().kw[group]||[]).concat(LANGS.en.kw[group]||[]); }
  function findDemo(x){
    for(var i=0;i<DEMOS.length;i++)
      for(var j=0;j<DEMOS[i].m.length;j++)
        if(x.indexOf(DEMOS[i].m[j])>=0) return DEMOS[i];
    return null;
  }
  function cardFor(d){
    var cards=[].slice.call(document.querySelectorAll('.proj'));
    for(var i=0;i<cards.length;i++){
      var h=cards[i].querySelector('h3'); if(!h) continue;
      var s=h.textContent.toLowerCase();
      if(d.k==='hub'&&s.indexOf('hub')>=0) return cards[i];
      if(d.k==='ga4'&&s.indexOf('analytics dashboard')>=0) return cards[i];
      if(d.k==='lease'&&s.indexOf('leasing')>=0) return cards[i];
      if(d.k==='gbp'&&s.indexOf('reviews')>=0) return cards[i];
      if(d.k==='gsc'&&s.indexOf('search console')>=0) return cards[i];
    }
    return null;
  }
  function go(sel){var e=document.querySelector(sel);if(!e)return false;e.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});return true;}
  function openDemoFor(d){
    if(d.k==='ads'){
      var fl=document.querySelector('.flag-actions a[href^="http"]');
      if(fl&&window.__openDemo){window.__openDemo(fl.getAttribute('href'),d.n);return true;}
      if(fl){fl.click();return true;}
      return false;
    }
    var card=cardFor(d);
    if(card){
      var th=card.querySelector('.thumb[data-live]'), url=th&&th.getAttribute('data-live');
      if(url&&window.__openDemo){window.__openDemo(url,d.n);return true;}
      card.scrollIntoView({behavior:RM?'auto':'smooth',block:'center'});return true;
    }
    return false;
  }
  function remember(k){if(mem.seen.indexOf(k)<0){mem.seen.push(k);save();}}

  function runAction(raw){
    var x=norm(raw); if(!x) return false;

    if(has(x,kws('stop'))&&x.split(' ').length<=2){shutUp();return true;}

    var nm=x.match(/(?:my name is|i am|i'm|this is|call me) ([a-z][a-z ]{1,28})$/);
    if(nm){
      mem.name=nm[1].replace(/\b\w/g,function(c){return c.toUpperCase();}).trim();save();
      botTell(t('greet',{n:esc(mem.name)}));return true;
    }

    if(has(x,kws('open'))){
      var d=findDemo(x);
      if(d){ botTell(t('opening',{x:esc(d.n)})); remember(d.k); setTimeout(function(){openDemoFor(d);},420); return true; }
    }
    if(has(x,kws('tour'))){ tour(); return true; }

    if(/(live app|apps only|\u0932\u093E\u0907\u0935 \u090F\u092A|\u09B2\u09BE\u0987\u09AD \u098F\u09AA)/.test(x)){chip('app');botTell(t('apps'));return true;}
    if(/(looker|\u0932\u0941\u0915\u0930|\u09B2\u09C1\u0995\u09BE\u09F0)/.test(x)){chip('looker');botTell(t('looker'));return true;}
    if(/(all work|show all|\u0938\u092C \u0915\u0941\u091B|\u09B8\u0995\u09B2\u09CB)/.test(x)){chip('all');botTell(t('all'));return true;}

    if(has(x,kws('work'))&&has(x,kws('open').concat(['go','scroll','where']))){go('#work');botTell(t('work'));return true;}
    if(/(about|background|\u092A\u0930\u093F\u091A\u092F|\u09AA\u09F0\u09BF\u099A\u09AF\u09BC)/.test(x)){go('#about');botTell(t('about'));return true;}
    if(/(skill|stack|\u091F\u0942\u0932|\u099F\u09C1\u09B2)/.test(x)){go('#skills');botTell(t('skills'));return true;}
    if(/(client|brand|\u0915\u094D\u0932\u093E\u0907\u0902\u091F|\u0995\u09CD\u09B2\u09BE\u0987\u09A3\u09CD\u099F)/.test(x)){go('#clients');botTell(t('clients'));return true;}

    if(has(x,kws('book'))){go('#contact');botTell(t('booking'));return true;}
    if(has(x,kws('email'))){copy(E);botTell(t('email'));return true;}

    if(/(dark mode|light mode|theme|\u0925\u0940\u092E|\u09A5\u09C0\u09AE)/.test(x)){
      var tb=document.getElementById('themeBtn');
      if(tb){tb.click();botTell(t('theme'));return true;}
    }
    if(/^(top|go to top|home|\u090A\u092A\u0930|\u0993\u09AA\u09F0)$/.test(x)){
      window.scrollTo({top:0,behavior:RM?'auto':'smooth'});botTell(t('top'));return true;}

    if(/(who are you|what can you do|help|\u0915\u094C\u0928 \u0939\u094B|\u0915\u094D\u092F\u093E \u0915\u0930 \u0938\u0915|\u0995\u09BF \u0995\u09F0\u09BF\u09AC \u09AA\u09BE\u09F0)/.test(x)){
      botTell(t('identity'));return true;}

    /* language by voice or text, in any language */
    if(/(english|\u0905\u0902\u0917\u094D\u0930\u0947\u091C\u093C\u0940|\u0987\u0982\u09F0\u09BE\u099C\u09C0)/.test(x)){setLang('en');return true;}
    if(/(hindi|\u0939\u093F\u0928\u094D\u0926\u0940|\u09B9\u09BF\u09A8\u09CD\u09A6\u09C0)/.test(x)){setLang('hi');return true;}
    if(/(assamese|asomiya|\u0905\u0938\u092E\u093F\u092F\u093E|\u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE)/.test(x)){setLang('as');return true;}

    return false;
  }
  function chip(f){var c=document.querySelector('#filters .chip[data-f="'+f+'"]');if(c)c.click();}
  function copy(s){try{navigator.clipboard&&navigator.clipboard.writeText(s);}catch(e){}}
  function esc(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}

  var tourTimers=[];
  function tour(){
    tourTimers.forEach(clearTimeout);tourTimers=[];
    var sel=['#proof','.flagship','#work','#contact'], lines=L().s.tour||LANGS.en.s.tour;
    sel.forEach(function(s,i){
      tourTimers.push(setTimeout(function(){
        var e=document.querySelector(s);
        if(e) e.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});
        botTell(lines[i]);
      }, i*7000));
    });
  }

  /* =====================================================================
     LANGUAGE SWITCH
     ===================================================================== */
  function setLang(code){
    if(!LANGS[code]) return;
    mem.lang=code; save(); srIdx=0;
    applyLangUI(); refreshVoice();
    tYes && (tNo.textContent=t('no'));
    if(recogOn||wantWake){ try{recog&&recog.stop();}catch(e){} recog=null; recogOn=false;
      if(mem.wake){ wantWake=true; setTimeout(startRecog,300); } }
    botTell(t('langSet'));
  }
  bLang.addEventListener('click',function(e){
    e.stopPropagation(); unlock();
    var i=ORDER.indexOf(mem.lang);
    setLang(ORDER[(i+1)%ORDER.length]);
  });

  /* =====================================================================
     PROACTIVE
     ===================================================================== */
  var toast=el('div','jv-toast');
  toast.innerHTML='<p id="jvTMsg"></p><div class="row"><button class="pri" id="jvTYes"></button><button id="jvTNo"></button></div>';
  document.body.appendChild(toast);
  var tMsg=document.getElementById('jvTMsg'),tYes=document.getElementById('jvTYes'),tNo=document.getElementById('jvTNo');
  tNo.textContent=t('no');
  var toastTimer=null,toastAction=null,shown=0;

  function nudge(msg,yes,action,key){
    if(shown>=2) return;
    if(key&&mem.toldAbout.indexOf(key)>=0) return;
    if(panel.classList.contains('open')) return;
    var dm=document.getElementById('dm'); if(dm&&dm.classList.contains('open')) return;
    shown++;
    if(key){mem.toldAbout.push(key);save();}
    tMsg.innerHTML=msg; tYes.textContent=yes; tNo.textContent=t('no'); toastAction=action;
    toast.classList.add('up'); speak(msg);
    clearTimeout(toastTimer); toastTimer=setTimeout(hide,14000);
  }
  function hide(){toast.classList.remove('up');}
  tNo.addEventListener('click',hide);
  tYes.addEventListener('click',function(){hide();if(toastAction)toastAction();});

  mem.visits=(mem.visits||0)+1;
  var gap=Date.now()-(mem.last||0); mem.last=Date.now(); save();

  setTimeout(function(){
    if(mem.visits>1&&gap>60000){
      var who=mem.name?(', '+esc(mem.name)):'';
      var unseen=DEMOS.filter(function(d){return mem.seen.indexOf(d.k)<0&&d.k!=='ads';})[0];
      if(unseen) nudge(t('backUnseen',{n:who,x:esc(unseen.n)}),t('yOpen'),function(){remember(unseen.k);openDemoFor(unseen);});
      else nudge(t('backBook',{n:who}),t('yBook'),function(){go('#contact');});
    }
  },2600);

  var idleTimer=null,openedAny=false;
  var workIO=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){
        clearTimeout(idleTimer);
        idleTimer=setTimeout(function(){
          if(openedAny) return;
          nudge(t('nudge'),t('yTour'),tour,'worknudge');
        },22000);
      } else clearTimeout(idleTimer);
    });
  },{threshold:.25});
  var ws=document.getElementById('work'); if(ws) workIO.observe(ws);
  document.addEventListener('click',function(e){
    if(e.target.closest&&(e.target.closest('.thumb[data-live]')||e.target.closest('.links a.live'))) openedAny=true;
  });

  var exitDone=false;
  document.addEventListener('mouseout',function(e){
    if(exitDone||e.relatedTarget||e.clientY>12||window.innerWidth<900) return;
    exitDone=true;
    nudge(t('exit'),t('yBook'),function(){go('#contact');},'exit');
  });

  /* =====================================================================
     CONTROLS
     ===================================================================== */
  bMic.addEventListener('click',function(e){
    e.stopPropagation();unlock();
    if(armed){stopRecog();return;}
    listenOnce();
  });
  bSpk.addEventListener('click',function(e){
    e.stopPropagation();
    mem.muted=!mem.muted;save();
    bSpk.classList.toggle('on',!mem.muted);
    fab.classList.toggle('muted',mem.muted);
    if(mem.muted) shutUp(); else {unlock();speak(t('voiceOn'));}
    mini.textContent=mem.muted?'\u2715':'J';
  });
  bWake.addEventListener('click',function(e){
    e.stopPropagation();unlock();
    mem.wake=!mem.wake;save();
    bWake.classList.toggle('on',mem.wake);
    if(mem.wake){wantWake=true;startRecog();botTell(t('wakeOn'));}
    else{stopRecog();botTell(t('wakeOff'));}
  });
  document.addEventListener('click',function once(){
    if(mem.wake&&SR&&!recogOn){wantWake=true;startRecog();}
    document.removeEventListener('click',once);
  });
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){shutUp();try{recog&&recog.stop();}catch(e){}}
    else if(mem.wake&&SR) setTimeout(startRecog,400);
  });

  window.Jarvis={
    say:function(x){botTell(x);},
    listen:listenOnce,
    tour:tour,
    lang:setLang,
    langs:function(){return ORDER.slice();},
    open:function(k){var d=findDemo(norm(k));if(d)openDemoFor(d);},
    memory:function(){return JSON.parse(JSON.stringify(mem));},
    forget:function(){try{localStorage.removeItem(STORE);}catch(e){}mem=load();applyLangUI();}
  };
})();
