(() => {
  'use strict';
  const root=document.documentElement;
  root.classList.add('motion-pending');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finish=()=>root.classList.remove('motion-pending');
  addEventListener('pageshow',e=>{if(e.persisted&&!reduced){root.classList.remove('motion-pending');requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.add('motion-pending')));setTimeout(finish,3500);}});
  if(reduced) finish(); else setTimeout(finish,3500);
  const card=document.querySelector('.motion-card');
  card?.addEventListener('animationend',finish,{once:true});
  let i=0; const slides=document.getElementById('slides');
  if(slides) setInterval(()=>{i=(i+1)%3;slides.style.transform=`translateX(-${i*33.3333}%)`},3800);
  document.querySelectorAll('.landing-nav a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const el=document.querySelector(a.getAttribute('href'));if(el){e.preventDefault();el.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});}}));
})();
