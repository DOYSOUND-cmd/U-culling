// xtimeline.js — lazy, single-shot X timeline to avoid 429 under frequent reloads.
const el = document.getElementById('xtl');
if (el){
  const screen = el.getAttribute('data-screen') || 'UcullingHQ';
  const theme = el.getAttribute('data-theme') || 'dark';
  const limit = parseInt(el.getAttribute('data-limit') || '5', 10);
  let started = false, done = false;

  function loadScriptOnce(){
    return new Promise((resolve, reject)=>{
      if (window.twttr?.widgets){ return resolve(window.twttr.widgets); }
      const s = document.createElement('script');
      s.src = 'https://platform.twitter.com/widgets.js';
      s.async = true; s.onload = ()=> resolve(window.twttr?.widgets);
      s.onerror = ()=> reject(new Error('widgets.js failed'));
      document.head.appendChild(s);
    });
  }

  async function mount(){
    if(started) return; started = true;
    try{
      const widgets = await loadScriptOnce();
      // guard double create in dev HMR/live-reload
      if(!widgets || done) return;
      await widgets.createTimeline(
        { sourceType: 'profile', screenName: screen },
        el,
        { theme, chrome: 'noheader nofooter noborders transparent', tweetLimit: limit, dnt: true }
      );
      done = true;
      el.classList.remove('xtl-skeleton');
    }catch(e){
      console.warn('X timeline embed failed, show fallback.', e);
      fallback();
    }
    // timeout fallback (e.g., 429 no response)
    setTimeout(()=>{ if(!done) fallback(); }, 5000);
  }

  function fallback(){
    done = true;
    el.classList.remove('xtl-skeleton');
    el.innerHTML = `<div class="tweet">
      <div class="tweet__meta"><strong>@${screen}</strong><span>·</span><span>Timeline is rate-limited (429)</span></div>
      <div class="tweet__actions">
        <a class="btn" href="https://x.com/${screen}" target="_blank" rel="noopener">Open X</a>
      </div>
      <p class="more-note small">開発環境のリロード連打で429が出やすいです。1) 少し待つ 2) 再読込 3) API版フィードに切替（js/xfeed.js）</p>
    </div>`;
  }

  // Lazy: only when section becomes visible
  const io = new IntersectionObserver((ents)=>{
    if(ents.some(e=>e.isIntersecting)){ mount(); io.disconnect(); }
  }, { rootMargin: '200px' });
  io.observe(el);
}
