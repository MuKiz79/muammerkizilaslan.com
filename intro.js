/* Replay the signature on every visit and every return to the start. */
(()=>{'use strict';
const screen=document.getElementById('signature-intro');
if(!screen)return;

const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let timer,playing=false,pending=false;
function finish(){
  const wasPlaying=playing;
  pending=false;
  playing=false;
  clearTimeout(timer);
  document.body.classList.remove("intro-active");
  document.querySelectorAll(".hero,.journey").forEach(el=>el.inert=false);
  if(wasPlaying)window.dispatchEvent(new Event('signatureintro:leaving'));
  screen.hidden=true;
  screen.classList.remove('is-playing');
  if(wasPlaying)window.dispatchEvent(new Event('signatureintro:end'));
}
function show(){
  finish();
  if(document.hidden){pending=true;return}
  window.scrollTo?.({top:0,behavior:'instant'});
  screen.hidden=false;
  // Flush the previous animation before replaying the same element.
  void screen.offsetWidth;
  screen.classList.add('is-playing');
  playing=true;
  document.body.classList.add("intro-active");
  document.querySelectorAll(".hero,.journey").forEach(el=>el.inert=true);
  window.dispatchEvent(new Event("signatureintro:start"));
  timer=setTimeout(finish,5000);
}
window.SignatureIntro={show};

screen.querySelector('.intro-skip').addEventListener('click',finish);
screen.addEventListener('pointerdown',event=>{event.stopPropagation();finish()});
window.addEventListener('wheel',finish,{passive:true});
window.addEventListener('keydown',finish,true);
window.addEventListener('pagehide',finish);
window.addEventListener('pageshow',event=>{if(event.persisted)show()});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&playing){finish();pending=true}
  else if(!document.hidden&&pending)show();
});
// Native/programmatic scroll restoration must not dismiss the opening.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',show,{once:true});else show();
})();
