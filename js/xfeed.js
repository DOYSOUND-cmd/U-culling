// js/xfeed.js (robust)
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const linkify = t => esc(t).replace(/https?:\/\/[^\s]+/g, u => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
const rel = iso => {
  const d = new Date(iso);
  const s = (Date.now() - d.getTime())/1000;
  if (s < 60) return `${Math.floor(s)}s`;
  if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return d.toLocaleString('ja-JP');
};

export default function run({ endpoint, handle='UcullingHQ', mount, pollMs=60000 }) {
  if (!endpoint) {
    mount.innerHTML = `<div class="tweet"><p class="more-note small">FEED_ENDPOINT が未設定です。</p></div>`;
    return;
  }

  async function parseJsonSafe(r){
    const ct = (r.headers.get('content-type') || '').toLowerCase();
    const txt = await r.text(); // parse after checking content-type
    if (!ct.includes('application/json')) {
      throw new Error(`Non-JSON response: status=${r.status}, content-type=${ct}, head=${txt.slice(0,120)}`);
    }
    try { return JSON.parse(txt); }
    catch(err){ throw new Error(`Invalid JSON: ${err.message}`); }
  }

  async function load() {
    try {
      mount.setAttribute('aria-busy', 'true');
      const r = await fetch(endpoint, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await parseJsonSafe(r);
      const items = (j.data || []).slice(0, 10);
      const url = id => `https://x.com/${handle}/status/${id}`;
      mount.innerHTML = items.map(t => `
        <article class="tweet">
          <div class="tweet__meta"><strong>@${handle}</strong><span>·</span><time datetime="${t.created_at}">${rel(t.created_at)}</time></div>
          <div class="tweet__text">${linkify(t.text || '')}</div>
          <div class="tweet__actions">
            <a class="btn btn--ghost" href="${url(t.id)}" target="_blank" rel="noopener">Open on X</a>
          </div>
        </article>`).join('') || `<div class="tweet">投稿が取得できませんでした。</div>`;
    } catch (e) {
      console.error('[xfeed] load error:', e);
      mount.innerHTML = `
        <div class="tweet">
          <p class="more-note small">
            フィード取得に失敗しました。開発中は <code>FEED_ENDPOINT: "data/x-feed-dev.json"</code> を設定してください。<br>
            本番は Cloudflare/Vercel の API を指定し、CORS とトークンをサーバ側で管理してください。
          </p>
        </div>`;
    } finally {
      mount.removeAttribute('aria-busy');
    }
  }

  load();
  setInterval(load, pollMs);
}
