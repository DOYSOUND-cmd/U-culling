// js/nav.js  —— モバイルドロワー用 完全版
const btn = document.querySelector('.menu-toggle');
const nav = document.getElementById('global-nav');
const backdrop = document.querySelector('.nav-backdrop');

const state = {
  isOpen: false,
  lastScrollY: 0,
};

function openMenu() {
  if (state.isOpen) return;
  state.isOpen = true;

  // スクロール固定（アドレスバー縮み対策で body にのみ適用）
  state.lastScrollY = window.scrollY;
  const sbw = window.innerWidth - document.documentElement.clientWidth; // スクロールバー幅補正（PCでも崩れない）
  document.documentElement.style.setProperty('--lock-pad', `${sbw}px`);
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = 'var(--lock-pad)';

  document.body.classList.add('nav-open');
  btn?.setAttribute('aria-expanded', 'true');
  if (backdrop) backdrop.hidden = false;
}

function closeMenu() {
  if (!state.isOpen) return;
  state.isOpen = false;

  document.body.classList.remove('nav-open');
  btn?.setAttribute('aria-expanded', 'false');
  if (backdrop) backdrop.hidden = true;

  // スクロール固定解除
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  document.documentElement.style.removeProperty('--lock-pad');
  window.scrollTo({ top: state.lastScrollY });
}

function toggleMenu() {
  state.isOpen ? closeMenu() : openMenu();
}

// イベント束ね
btn?.addEventListener('click', toggleMenu, { passive: true });

// 背景タップで閉じる
backdrop?.addEventListener('click', closeMenu, { passive: true });

// メニュー内のリンクで閉じる（伝播元が <a> なら）
nav?.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (a) closeMenu();
});

// Esc で閉じる（モバイル/PC両対応）
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMenu();
});

// 回転・リサイズ時の安全策：開いている最中は閉じる
window.addEventListener('resize', () => {
  if (state.isOpen) closeMenu();
});
