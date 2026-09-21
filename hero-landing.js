// Landing after the signature intro: it continues the intro's own sequence — one sentence at a time, same place,
// same type, same lift — beginning while the last intro line fades, so there is no gap. Only real interaction ends it early
// (pointer press in the hero, scrolling, wheel, keyboard, choosing a perspective); merely hovering the drifting labels must not.
(function(){
'use strict';
const root=document.querySelector('.hero-landing'),hero=document.querySelector('.hero'),intro=document.querySelector('#signature-intro');
if(!root||!hero)return;
const LEAD=4680,RAMP=350,GAP=420,words=t=>t.trim().split(/\s+/).filter(w=>/[\p{L}\d]/u.test(w)).length,hold=n=>450+220*n;
const lines=[...root.querySelectorAll('p')];
// Plan relative to the first sentence: {on, off} per line; the next line starts GAP after the previous one begins to leave.
const plan=[];{let t=0;for(const p of lines){const on=t,off=on+RAMP+hold(words(p.textContent));plan.push({on,off});t=off+GAP}}
const END=plan[plan.length-1].off+RAMP;
let timers=[],lead=null,arrival=null,active=false;
function clear(){for(const t of timers)clearTimeout(t);timers=[]}
function reset(){for(const p of lines)p.className=''}
function stop(){if(lead){clearTimeout(lead);lead=null}if(arrival){clearTimeout(arrival);arrival=null}hero.classList.remove('is-arriving');if(!active)return;active=false;clear();reset();root.hidden=true;hero.classList.remove('is-landing')}
function finish(){stop();hero.classList.add('is-arriving');arrival=setTimeout(()=>{hero.classList.remove('is-arriving');arrival=null},1100)}
function start(){if(active)return;if(lead){clearTimeout(lead);lead=null}active=true;reset();root.hidden=false;void root.offsetHeight;hero.classList.add('is-landing');
 // The first sentence is set synchronously after a forced reflow so its rise transition runs (a hidden→shown element would otherwise jump).
 plan.forEach((s,i)=>{if(s.on===0)lines[i].className='is-on';else timers.push(setTimeout(()=>{if(active)lines[i].className='is-on'},s.on));timers.push(setTimeout(()=>{if(active)lines[i].className='is-off'},s.off))});
 timers.push(setTimeout(()=>{if(active)finish()},END))}
window.addEventListener('signatureintro:start',()=>{stop();lead=setTimeout(()=>{lead=null;start()},LEAD)});
window.addEventListener('signatureintro:end',()=>{if(!active)start()});
window.addEventListener('perspective:change',stop);
document.addEventListener('pointerdown',e=>{if((active||arrival)&&e.target.closest&&e.target.closest('.hero'))stop()},true);
document.addEventListener('wheel',()=>{if(active||arrival)stop()},{passive:true,capture:true});
window.addEventListener('scroll',()=>{if((active||arrival)&&scrollY>16)stop()},{passive:true});
document.addEventListener('keydown',e=>{if((active||arrival)&&['Tab','Enter',' ','ArrowDown','ArrowUp','ArrowLeft','ArrowRight','PageDown'].includes(e.key))stop()});
if(intro&&intro.hidden&&!document.body.classList.contains('intro-active'))start();
window.HeroLanding={start,stop,plan,LEAD,RAMP,GAP,hold,END};
})();
