// js/feed-router.js
const cfg = window.UC_FEED || {};
const onVisible = (el, cb) => {
  const io = new IntersectionObserver(es => {
    if (es.some(e => e.isIntersecting)) { io.disconnect(); cb(); }
  }, { rootMargin: '200px' });
  io.observe(el);
};

async function mountApi() {
  const feed = document.getElementById('x-feed');
  if (!feed) return;
  const mod = await import('./xfeed.js');
  (mod.default || mod.run || (()=>{}))({
    endpoint: cfg.FEED_ENDPOINT || '',
    handle: 'UcullingHQ',
    mount: feed,
    pollMs: 60000
  });
}

async function mountWidget() {
  const el = document.getElementById('xtl');
  if (!el) return;

  async function loadWidgets() {
    if (window.twttr?.widgets) return window.twttr.widgets;
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://platform.twitter.com/widgets.js';
      s.async = true;
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    return window.twttr.widgets;
  }

  try {
    const widgets = await loadWidgets();
    const screen = el.getAttribute('data-screen') || 'UcullingHQ';
    const theme  = el.getAttribute('data-theme')  || 'dark';
    const limit  = parseInt(el.getAttribute('data-limit') || '5', 10);
    await widgets.createTimeline(
      { sourceType: 'profile', screenName: screen },
      el,
      { theme, chrome: 'noheader nofooter noborders transparent', tweetLimit: limit, dnt: true }
    );
    el.classList.remove('xtl-skeleton');
  } catch (e) {
    el.classList.remove('xtl-skeleton');
    el.innerHTML = `
      <article class="tweet">
        <div class="tweet__meta"><strong>@UcullingHQ</strong><span>·</span><span>Rate limited (429)</span></div>
        <p class="more-note small">開発環境の自動リロードで429が発生しやすいです。少し待って再読込 or API版をご利用ください。</p>
        <div class="tweet__actions">
          <a class="btn btn--ghost" href="https://x.com/UcullingHQ" target="_blank" rel="noopener">Open on X</a>
        </div>
      </article>`;
    console.warn('X widget failed:', e);
  }
}

// Lazy mount
const apiMountTarget = document.getElementById('x-feed');
if (apiMountTarget && cfg.ENABLE_API_FEED && (cfg.FEED_ENDPOINT||'').trim()) onVisible(apiMountTarget, mountApi);
else if(apiMountTarget && !cfg.ENABLE_API_FEED){ apiMountTarget.innerHTML = '<div class="tweet"><p class="more-note small">APIフィードは本番構成で無効化中。UC_FEED.ENABLE_API_FEED=true で有効化。</p></div>'; }

if (cfg.USE_WIDGET) {
  const widgetTarget = document.getElementById('xtl');
  if (widgetTarget) onVisible(widgetTarget, mountWidget);
} else {
  const el = document.getElementById('xtl');
  if (el) el.innerHTML = `<div class="tweet"><p class="more-note small">開発環境ではウィジェットを無効化中（UC_FEED.USE_WIDGET=true で有効）。</p></div>`;
}
