const btn = document.querySelector('.menu-toggle');
const nav = document.getElementById('global-nav');
const backdrop = document.querySelector('.nav-backdrop');
let lastFocused = null;
function openNav(){
  lastFocused = document.activeElement;
  document.body.classList.add('nav-open');
  btn.setAttribute('aria-expanded','true');
  backdrop.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  const firstLink = nav.querySelector('a,button'); firstLink?.focus();
}
function closeNav(){
  document.body.classList.remove('nav-open');
  btn.setAttribute('aria-expanded','false');
  backdrop.hidden = true;
  document.documentElement.style.overflow = '';
  lastFocused?.focus();
}
btn.addEventListener('click', ()=>{
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  expanded ? closeNav() : openNav();
});
backdrop.addEventListener('click', closeNav);
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeNav(); });
nav.addEventListener('keydown', (e)=>{
  if(e.key !== 'Tab') return;
  const focusables = nav.querySelectorAll('a, button');
  if(!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if(e.shiftKey && document.activeElement === first){ last.focus(); e.preventDefault(); }
  else if(!e.shiftKey && document.activeElement === last){ first.focus(); e.preventDefault(); }
});
