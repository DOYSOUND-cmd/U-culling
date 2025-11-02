import { nowJST, esc, buildIcs, download } from "./util.js";
const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const state={ news:[], shows:[], songs:[], members:[] };
async function loadJSON(p){ const r=await fetch(p,{cache:"no-store"}); if(!r.ok) throw new Error(p); return r.json(); }

function renderNews(){
  const ul=$("#news-list");
  const items=state.news.slice(0,3);
  ul.innerHTML = items.map(n=>`<li class="news">
    <div class="news__meta"><span>${new Date(n.date).toLocaleDateString("ja-JP",{timeZone:"Asia/Tokyo"})}</span><span>${esc(n.category)}</span></div>
    <div><strong>${esc(n.title)}</strong></div>
    ${n.body?`<div>${esc(n.body)}</div>`:""} ${n.url?`<div><a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.urlLabel||"詳細")}</a></div>`:""}
  </li>`).join("");
}

function renderShows(){
  const now=nowJST(), up=[], past=[];
  for(const ev of state.shows){ (new Date(ev.start)>=now?up:past).push(ev); }
  up.sort((a,b)=>new Date(a.start)-new Date(b.start));
  past.sort((a,b)=>new Date(b.start)-new Date(a.start));
  const li=(ev)=>`<li class="show">
    <div class="show__line">
      <strong>${esc(ev.title)}</strong>
      <div class="show__cta">
        ${ev.ticket?`<a class="btn" href="${esc(ev.ticket)}" target="_blank" rel="noopener">Ticket</a>`:""}
        <button class="btn btn--ghost" data-ics='${esc(JSON.stringify({title:ev.title,start:ev.start,end:ev.end,place:ev.place,url:ev.url}))}'>Calendar</button>
      </div>
    </div>
    <div class="show__line">
      <span>${new Date(ev.start).toLocaleString("ja-JP",{timeZone:"Asia/Tokyo",dateStyle:"medium",timeStyle:"short"})}</span>
      <span class="show__where">${esc(ev.place||"")}</span>
    </div>
    ${ev.note?`<div>${esc(ev.note)}</div>`:""} ${ev.url?`<div><a href="${esc(ev.url)}" target="_blank" rel="noopener">${esc(ev.url)}</a></div>`:""}
  </li>`;
  $("#shows-upcoming").innerHTML=up.map(li).join("")||`<li class="show">予定は準備中です。</li>`;
  $("#shows-past").innerHTML=past.map(li).join("")||`<li class="show">過去公演は後日掲載します。</li>`;
  $$("[data-ics]").forEach(b=>b.addEventListener("click",()=>{
    const ev=JSON.parse(b.getAttribute("data-ics"));
    download(`U-culling_${ev.title.replace(/\s+/g,"_")}.ics`, buildIcs(ev));
  }));
}

function yt(id){ return `<iframe src="https://www.youtube.com/embed/${id}" title="YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>`; }

function renderSongs(){
  const wrap=$("#songs-list");
  const tpl=(s)=>`<article class="card" itemscope itemtype="https://schema.org/MusicRecording">
    <img src="${esc(s.cover||"assets/hero.jpg")}" alt="${esc(s.title)} cover" loading="lazy">
    <div class="card__body">
      <h3 class="card__title" itemprop="name">${esc(s.title)}</h3>
      <div class="card__meta"><span>${esc(s.type||"")}</span>${s.year?` · <span>${s.year}</span>`:""}${s.genres?.length?` · <span>${esc(s.genres.join(", "))}</span>`:""}</div>
      ${s.desc?`<p>${esc(s.desc)}</p>`:""}
      <div class="tags">${(s.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div>
      ${s.audio?`<audio controls preload="none" style="width:100%;margin-top:8px"><source src="${esc(s.audio)}" type="audio/mpeg"></audio>`:""}
      ${s.videoId?`<div class="media-yt">${yt(s.videoId)}</div>`:""}
    </div>
  </article>`;
  wrap.innerHTML = state.songs.map(tpl).join("");

  document.querySelectorAll(".disc-filter button").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".disc-filter button").forEach(b=>b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const type=btn.getAttribute("data-type");
      const list = type==="ALL"? state.songs : state.songs.filter(s=>s.type===type);
      wrap.innerHTML = list.map(tpl).join("");
    });
  });

  const m=$("#media-youtube");
  m.innerHTML = state.songs.filter(s=>s.videoId).slice(0,6).map(v=>yt(v.videoId)).join("");
}

function renderMembers(){
  const wrap=$("#members-list");
  const ICONS = {
    "X": "assets/X.png",
    "VRChat": "assets/VRChat.png",
    "Github": "assets/github-mark-white.png",
    "GitHub": "assets/github-mark-white.png"
  };
  wrap.innerHTML = state.members.map(m=>{
    const socials = m.social ? Object.entries(m.social)
      .filter(([k,v])=> v && typeof v === "string" && v.trim().length)
      .map(([k,v])=>`<a class="social-icon" href="${esc(v)}" target="_blank" rel="noopener" aria-label="${esc(k)}"><img src="${ICONS[k]||ICONS['Github']||''}" alt="${esc(k)}" loading="lazy"></a>`).join("") : "";
    return `<article class="card" itemscope itemtype="https://schema.org/Person">
      <img src="${esc(m.image||"assets/offshot.jpg")}" alt="${esc(m.name)}" loading="lazy">
      <div class="card__body">
        <h3 class="card__title" itemprop="name">${esc(m.name)}</h3>
        <div class="card__meta"><span itemprop="jobTitle">${esc(m.role||"")}</span></div>
        <div class="social-row">${socials}</div>
      </div>
    </article>`;
  }).join("");
}

function injectJsonLd(){
  const ld={"@context":"https://schema.org","@type":"MusicGroup","name":"U-culling",
    "genre":["Alternative Rock","Hard Rock"],
    "url": location.origin+location.pathname, "image": location.origin+"/assets/hero.jpg",
    "member": state.members.map(m=>({"@type":"Person","name":m.name,"jobTitle":m.role,"sameAs":Object.values(m.social||{})}))};
  const s=document.createElement("script"); s.type="application/ld+json"; s.textContent=JSON.stringify(ld);
  document.head.appendChild(s);
}

async function main(){
  [state.news, state.shows, state.songs, state.members] = await Promise.all([
    fetch("data/news.json").then(r=>r.json()),
    fetch("data/shows.json").then(r=>r.json()),
    fetch("data/songs.json").then(r=>r.json()),
    fetch("data/members.json").then(r=>r.json()),
  ]);
  renderNews(); renderShows(); renderSongs(); renderMembers(); injectJsonLd();
  document.getElementById("y").textContent=new Date().getFullYear();
}
main().catch(e=>{ console.error(e); alert("データ読み込みに失敗しました。構成をご確認ください。"); });
