const btn = document.querySelector('.menu-toggle');
const nav = document.getElementById('global-nav');
const backdrop = document.querySelector('.nav-backdrop');
const BREAKPOINT = 768;
let lastFocused = null;
let scrollLockY = 0;

function lockScroll(){
  scrollLockY = window.scrollY || document.documentElement.scrollTop;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollLockY}px`;
  document.body.style.left = '0'; document.body.style.right = '0';
  document.body.style.width = '100%';
}
function unlockScroll(){
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, scrollLockY);
}

function openNav(){
  if (document.body.classList.contains('nav-open')) return;
  lastFocused = document.activeElement;
  document.body.classList.add('nav-open');
  btn.setAttribute('aria-expanded','true');
  nav.setAttribute('aria-hidden','false');
  nav.removeAttribute('inert');
  backdrop.hidden = false;
  lockScroll();

  // Focus first link
  const firstLink = nav.querySelector('a,button'); firstLink?.focus();
}

function closeNav(focusBack=true){
  if (!document.body.classList.contains('nav-open')) return;
  document.body.classList.remove('nav-open');
  btn.setAttribute('aria-expanded','false');
  nav.setAttribute('aria-hidden','true');
  nav.setAttribute('inert','');
  backdrop.hidden = true;
  unlockScroll();
  if (focusBack) lastFocused?.focus();
}

function isMobile(){ return window.innerWidth < BREAKPOINT; }

// Toggle
btn.addEventListener('click', ()=>{
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  expanded ? closeNav() : openNav();
});

// Backdrop click
backdrop.addEventListener('click', ()=> closeNav());

// ESC close
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeNav(); });

// Focus trap when open
nav.addEventListener('keydown', (e)=>{
  if(e.key !== 'Tab' || !document.body.classList.contains('nav-open')) return;
  const focusables = nav.querySelectorAll('a, button');
  if(!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if(e.shiftKey && document.activeElement === first){ last.focus(); e.preventDefault(); }
  else if(!e.shiftKey && document.activeElement === last){ first.focus(); e.preventDefault(); }
});

// Close on link click (same-page anchors)
nav.addEventListener('click', (e)=>{
  const a = e.target.closest('a[href]');
  if(!a) return;
  if(isMobile()){ closeNav(false); } // keep browser default focus
});

// Close on hash change
window.addEventListener('hashchange', ()=>{ if(isMobile()) closeNav(false); });

// Handle resize: if >= BREAKPOINT, ensure drawer state reset
window.addEventListener('resize', ()=>{
  if(!isMobile()){
    // reset states for desktop
    nav.removeAttribute('aria-hidden');
    nav.removeAttribute('inert');
    backdrop.hidden = true;
    if (document.body.classList.contains('nav-open')) closeNav(false);
  }else{
    // mobile initial hidden state
    if(!document.body.classList.contains('nav-open')){
      nav.setAttribute('aria-hidden','true');
      nav.setAttribute('inert','');
    }
  }
});

// Initialize state
(function init(){
  btn.setAttribute('aria-expanded','false');
  if(isMobile()){
    nav.setAttribute('aria-hidden','true');
    nav.setAttribute('inert','');
  }else{
    nav.removeAttribute('aria-hidden');
    nav.removeAttribute('inert');
  }
})();
