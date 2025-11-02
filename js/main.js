/* =========================================================
   U-culling — main.js (NEWS/LIVE/PROFILE + Carousel/Autoplay)
   - 依存: index.html の #news-list / #shows-upcoming / #shows-past /
           #members-carousel(#members-list, prev/next, dots)
   - データ: data/news.json, data/shows.json, data/members.json
   - 注意: songs.json は読み込みません（要求により除外）
   ========================================================= */

/* ------------------------------
 * ヘルパ
 * ------------------------------ */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

async function loadJSON(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn("[loadJSON]", e);
    return null;
  }
}

function fmtDate(input) {
  // 受け取り: "2025-11-02" / "2025/11/02" / ISO 等
  if (!input) return "";
  const s = String(input).replace(/\//g, "-"); // スラッシュ → ハイフン
  const d = new Date(s);
  if (isNaN(d)) return String(input);
  // YYYY.MM.DD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ------------------------------
 * NEWS
 * - 4件目以降も読み込む（CSS側で3件固定＋スクロール）
 * ------------------------------ */
async function renderNews() {
  const list = $("#news-list");
  if (!list) return;

  const data = await loadJSON("data/news.json");
  if (!data) return;

  // 柔軟な入力を許容: {news:[...]} も [... ] もOK
  const items = Array.isArray(data) ? data : Array.isArray(data.news) ? data.news : [];

  // 新しい日付順にソート（可能なら）
  items.sort((a, b) => {
    const da = new Date(a.date || a.published_at || 0).getTime();
    const db = new Date(b.date || b.published_at || 0).getTime();
    return isNaN(db - da) ? 0 : db - da;
  });

  const frag = document.createDocumentFragment();
  for (const n of items) {
    const li = document.createElement("li");
    li.className = "news";

    const titleText = n.title || n.text || "(no title)";
    const date = fmtDate(n.date || n.published_at);
    const tag  = n.tag || n.category || "";

    const h3 = document.createElement("h3");
    h3.className = "news__title item-title"; // ← NEWS/SHOWS 統一サイズ用
    if (n.url) {
      const a = document.createElement("a");
      a.href = n.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = titleText;
      h3.appendChild(a);
    } else {
      h3.textContent = titleText;
    }

    const meta = document.createElement("div");
    meta.className = "news__meta";
    if (date) {
      const d = document.createElement("span");
      d.textContent = date;
      meta.appendChild(d);
    }
    if (tag) {
      const t = document.createElement("span");
      t.textContent = tag;
      meta.appendChild(t);
    }

    if (n.desc) {
      const p = document.createElement("p");
      p.textContent = n.desc;
      li.append(h3, meta, p);
    } else {
      li.append(h3, meta);
    }
    frag.appendChild(li);
  }
  list.innerHTML = "";
  list.appendChild(frag);
}

/* ------------------------------
 * SHOWS (Upcoming / Past)
 * - shows.json 形式は 2パターン対応:
 *   1) { upcoming:[...], past:[...] }
 *   2) { shows:[...] } または配列 [...] → 日付で今/過去を振分け
 * ------------------------------ */
function isFutureOrToday(dateStr) {
  // YYYY-MM-DD 比較（0:00基準。時刻がある場合はそのままDate判定）
  if (!dateStr) return false;
  const s = String(dateStr).replace(/\//g, "-");
  const d = new Date(s);
  if (isNaN(d)) return false;
  const today = new Date(todayYMD());
  // "本日中" をUpcomingに含めたいので >=
  return d >= today;
}

function makeShowLi(show) {
  const li = document.createElement("li");
  li.className = "show";

  const title = document.createElement("h3");
  title.className = "show__title item-title"; // ← NEWS と統一
  title.textContent = show.title || "(untitled)";

  const line = document.createElement("div");
  line.className = "show__line";
  const dateEl = document.createElement("span");
  dateEl.textContent = fmtDate(show.date);
  line.append(title, dateEl);

  const where = document.createElement("div");
  where.className = "show__where";
  const venue = show.venue ? ` @ ${show.venue}` : "";
  const city  = show.city  ? ` (${show.city})` : "";
  where.textContent =
    (show.open ? `OPEN ${show.open} ` : "") +
    (show.start ? `/ START ${show.start}` : "") +
    venue + city;

  const cta = document.createElement("div");
  cta.className = "show__cta";
  if (show.ticket) {
    const a = document.createElement("a");
    a.className = "btn btn--ghost";
    a.href = show.ticket;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "TICKET";
    cta.appendChild(a);
  }
  if (show.more) {
    const a = document.createElement("a");
    a.className = "btn btn--ghost";
    a.href = show.more;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "MORE";
    cta.appendChild(a);
  }

  li.append(line, where, cta);
  return li;
}

async function renderShows() {
  const upEl = $("#shows-upcoming");
  const pastEl = $("#shows-past");
  if (!upEl || !pastEl) return;

  const data = await loadJSON("data/shows.json");
  if (!data) return;

  let upcoming = [];
  let past = [];

  if (Array.isArray(data)) {
    // 単純配列
    for (const s of data) (isFutureOrToday(s.date) ? upcoming : past).push(s);
  } else if (Array.isArray(data.shows)) {
    for (const s of data.shows) (isFutureOrToday(s.date) ? upcoming : past).push(s);
  } else {
    // { upcoming:[], past:[] } 形式
    upcoming = Array.isArray(data.upcoming) ? data.upcoming.slice() : [];
    past     = Array.isArray(data.past)     ? data.past.slice()     : [];
  }

  // ソート: upcoming=日付昇順 / past=日付降順
  const toTime = (s) => new Date(String(s.date || "").replace(/\//g, "-")).getTime();
  upcoming.sort((a, b) => toTime(a) - toTime(b));
  past.sort((a, b) => toTime(b) - toTime(a));

  // 描画
  const upFrag = document.createDocumentFragment();
  upcoming.forEach((s) => upFrag.appendChild(makeShowLi(s)));
  upEl.innerHTML = "";
  upEl.appendChild(upFrag);

  const pastFrag = document.createDocumentFragment();
  past.forEach((s) => pastFrag.appendChild(makeShowLi(s)));
  pastEl.innerHTML = "";
  pastEl.appendChild(pastFrag);
}

/* ------------------------------
 * MEMBERS（カルーセル）
 * - PC: 3-up / Tablet: 2-up / Mobile: 1-up
 * - 自動再生 / ループ / ボタン / ドット
 * - SNSアイコン: 実在PNGに合わせたマップ
 * ------------------------------ */

// 実ファイルに合わせたアイコンマップ
const ICONS_MAP = {
  x: "assets/X.png",
  vrchat: "assets/VRChat.png",
  github: "assets/github-mark-white.png",
};

function getIconSpec(key) {
  const k = String(key || "").toLowerCase();
  const val = ICONS_MAP[k];
  if (!val) return { type: "img", src: ICONS_MAP["x"] }; // 未対応は X にフォールバック
  return val.includes("#")
    ? { type: "sprite", href: val }
    : { type: "img", src: val };
}

function makeIcon(key, url) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener";
  a.className = "social-icon";

  const spec = getIconSpec(key);
  if (spec.type === "img") {
    const img = document.createElement("img");
    img.alt = key;
    img.loading = "lazy";
    img.src = spec.src;
    img.width = 14;
    img.height = 14;
    img.addEventListener("error", () => { img.src = ICONS_MAP["x"]; }, { once: true });
    a.appendChild(img);
  } else {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "14");
    svg.setAttribute("height", "14");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", spec.href);
    use.setAttribute("href", spec.href);
    svg.appendChild(use);
    a.appendChild(svg);
  }
  return a;
}

function normalizeMembers(arr) {
  return (arr || []).map((m) => {
    const social = {};
    Object.entries(m.social || {}).forEach(([k, v]) => {
      if (!v) return;
      const key = String(k).toLowerCase();
      if (key.includes("vrchat")) social.vrchat = v;
      else if (key === "x" || key.includes("twitter")) social.x = v;
      else if (key.includes("git")) social.github = v;
      else social[key] = v;
    });
    return {
      name:  m.name  || "",
      role:  m.role  || "",
      image: m.image || "",
      social,
    };
  });
}

function makeMemberCard(m) {
  const card = document.createElement("article");
  card.className = "card";

  if (m.image) {
    const img = document.createElement("img");
    img.className = "card__img";
    img.loading = "lazy";
    img.alt = `${m.name} — ${m.role}`;
    img.src = m.image; // 例: assets/member_vocal.jpg
    card.appendChild(img);
  }

  const body = document.createElement("div");
  body.className = "card__body";

  const title = document.createElement("div");
  title.className = "card__title";
  title.textContent = m.name;

  const meta = document.createElement("div");
  meta.className = "card__meta";
  meta.textContent = m.role;

  const socialRow = document.createElement("div");
  socialRow.className = "social-row";
  Object.entries(m.social || {}).forEach(([k, url]) => {
    socialRow.appendChild(makeIcon(k, url));
  });

  body.append(title, meta, socialRow);
  card.appendChild(body);
  return card;
}

/* ---- カルーセル本体（クローン方式でシームレス） ---- */
function setupMembersCarousel(members) {
  const root = $("#members-carousel");
  const scroller = $("#members-list", root);
  const prevBtn = $(".carousel__btn--prev", root);
  const nextBtn = $(".carousel__btn--next", root);
  const dotsWrap = $("#members-dots", root);
  if (!root || !scroller) return;

  // 初期描画
  scroller.innerHTML = "";
  const normalized = normalizeMembers(members);
  const originalsFrag = document.createDocumentFragment();
  normalized.forEach((m) => originalsFrag.appendChild(makeMemberCard(m)));
  scroller.appendChild(originalsFrag);

  // 状態
  let perView = 1;
  let gapPx = 16;
  let pageSize = 0; // 1枚ぶんのスクロール距離 (cardWidth + gap)
  let total = scroller.children.length; // 実データ枚数
  let current = 0; // scroller.children のインデックス（クローン含む）
  let timer = null;
  let animating = false;
  let justJumped = false; // ラップ直後の二重進行防止

  // ドット
  function renderDots() {
    dotsWrap.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const b = document.createElement("button");
      b.type = "button";
      if (i === getRealIndex()) b.classList.add("is-active");
      b.addEventListener("click", () => goToReal(i));
      dotsWrap.appendChild(b);
    }
  }

  function getComputedGap() {
    const cs = getComputedStyle(scroller);
    const g  = parseFloat(cs.columnGap || cs.gap || "16");
    return Number.isFinite(g) ? g : 16;
  }

  function getPerView() {
    const first = scroller.children[0];
    if (!first) return 1;
    const cardW = first.getBoundingClientRect().width;
    const wrapW = scroller.getBoundingClientRect().width;
    if (cardW <= 1) return 1;
    const n = Math.round(wrapW / cardW);
    return Math.max(1, Math.min(3, n)); // Mobile=1 / Tablet=2 / PC=3
  }

  function measure() {
    gapPx  = getComputedGap();
    perView = getPerView();
    const first = scroller.children[0];
    const cardW = first ? first.getBoundingClientRect().width : 0;
    pageSize = Math.max(0, cardW + gapPx);
  }

  function clearClones() {
    $$(".card[data-clone]", scroller).forEach((el) => el.remove());
  }

  function applyClones() {
    clearClones();
    const children = Array.from(scroller.children);
    const head = children.slice(-perView).map((el) => {
      const c = el.cloneNode(true);
      c.dataset.clone = "head";
      return c;
    });
    const tail = children.slice(0, perView).map((el) => {
      const c = el.cloneNode(true);
      c.dataset.clone = "tail";
      return c;
    });
    head.forEach((c) => scroller.insertBefore(c, scroller.firstChild));
    tail.forEach((c) => scroller.appendChild(c));
    // 実データ範囲の先頭へ即座にジャンプ
    current = perView;
    jumpToIndex(current);
  }

  function jumpToIndex(idx) {
    scroller.style.scrollBehavior = "auto";
    scroller.scrollLeft = idx * pageSize;
    requestAnimationFrame(() => { scroller.style.scrollBehavior = ""; });
  }

  function scrollToIndex(idx) {
    scroller.style.scrollBehavior = "smooth";
    scroller.scrollLeft = idx * pageSize;
  }

  function getRealIndex() {
    // クローンを除いた実データの現在位置（0..total-1）
    let i = current - perView;
    if (i < 0) i += total;
    if (i >= total) i -= total;
    return i;
  }

  function go(delta = 1) {
    if (animating) return;
    animating = true;
    current += delta;
    scrollToIndex(current);
    setTimeout(() => (animating = false), 360);
  }

  function goPrev() {
    stopAuto();
    justJumped = false;
    go(-1);
    startAuto();
  }

  function goNext() {
    stopAuto();
    justJumped = false;
    go(+1);
    startAuto();
  }

  function goToReal(realIdx) {
    stopAuto();
    current = perView + realIdx;
    scrollToIndex(current);
    startAuto();
  }

  // スクロール後のラップ補正
  let wrapRaf = 0;
  function onScrolled() {
    cancelAnimationFrame(wrapRaf);
    wrapRaf = requestAnimationFrame(() => {
      if (current <= perView - 1) {
        current += total;  // 左端クローン域 → 実データ末尾へ
        jumpToIndex(current);
        justJumped = true;
      } else if (current >= perView + total) {
        current -= total;  // 右端クローン域 → 実データ先頭へ
        jumpToIndex(current);
        justJumped = true;
      } else {
        justJumped = false;
      }
      // ドット更新
      const ri = getRealIndex();
      $$("#members-dots > button", root).forEach((b, i) => {
        b.classList.toggle("is-active", i === ri);
      });
    });
  }

  // インデックスをスクロール位置から推定
  let indexRaf = 0;
  function trackIndexByScrollLeft() {
    cancelAnimationFrame(indexRaf);
    indexRaf = requestAnimationFrame(() => {
      if (pageSize > 0) {
        const near = Math.round(scroller.scrollLeft / pageSize);
        if (near !== current) current = near;
      }
    });
  }

  // 自動再生（5枚目だけ短くなる問題の抑制: justJumped を考慮）
  const AUTO_MS = 3500;
  function startAuto() {
    stopAuto();
    timer = setInterval(() => {
      if (justJumped) { justJumped = false; return; }
      go(+1);
    }, AUTO_MS);
  }
  function stopAuto() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  // 初期化
  measure();
  applyClones();
  renderDots();
  startAuto();

  // イベント
  scroller.addEventListener("scroll", () => {
    trackIndexByScrollLeft();
    onScrolled();
  });
  prevBtn?.addEventListener("click", goPrev);
  nextBtn?.addEventListener("click", goNext);

  // ホバーで一時停止（モバイルは hover 無し）
  root.addEventListener("mouseenter", stopAuto);
  root.addEventListener("mouseleave", startAuto);

  // リサイズ対応
  let resizeTid = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTid);
    resizeTid = setTimeout(() => {
      const riBefore = getRealIndex(); // 表示メンバーを維持
      measure();
      applyClones();
      current = perView + riBefore;
      jumpToIndex(current);
      renderDots();
    }, 120);
  }, { passive: true });
}

async function renderMembers() {
  const data = await loadJSON("data/members.json");
  if (!data) return;
  const items = Array.isArray(data) ? data : Array.isArray(data.members) ? data.members : [];
  setupMembersCarousel(items);
}

/* ------------------------------
 * NAV ドロワー（モバイル）
 * ------------------------------ */
function setupNav() {
  const btn = $(".menu-toggle");
  const nav = $("#global-nav");
  const backdrop = $(".nav-backdrop");

  const close = () => {
    document.body.classList.remove("nav-open");
    btn?.setAttribute("aria-expanded", "false");
  };
  const open = () => {
    document.body.classList.add("nav-open");
    btn?.setAttribute("aria-expanded", "true");
  };

  btn?.addEventListener("click", () => {
    const openNow = document.body.classList.contains("nav-open");
    openNow ? close() : open();
  });

  backdrop?.addEventListener("click", close);
  // 必要なら Esc なども追加可能
}

/* ------------------------------
 * Footer 年号
 * ------------------------------ */
function setYear() {
  const y = $("#y");
  if (y) y.textContent = new Date().getFullYear();
}

/* ------------------------------
 * main
 * ------------------------------ */
async function main() {
  setupNav();
  setYear();

  await Promise.all([
    renderNews(),
    renderShows(),
    renderMembers(),
  ]);
}

document.addEventListener("DOMContentLoaded", main);
