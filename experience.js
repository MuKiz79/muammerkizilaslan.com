(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const {journeys,career,products}=window.ExperienceData;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const preview=$('.route-preview'),guide=$('.perspective-guide');
let chosen=null,step=0,guided=false,mapAnimation=null,resultAnimation=null;
const change=()=>window.dispatchEvent(new Event('perspective:change'));
function choose(key){
  const next=chosen===key?null:key;if(guided)endGuide();
  chosen=next;preview.hidden=!chosen;
  $$('[data-journey]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.journey===chosen)));
  if(chosen)preview.querySelector('p').textContent=journeys[chosen].intro;
  change();
}
function endGuide(){guided=false;guide.hidden=true;document.body.classList.remove('theme-guided');chosen=null;preview.hidden=true;$$('[data-journey]').forEach(b=>b.setAttribute('aria-pressed','false'));change();window.ProfileNavigation?.refresh()}
function visit(index){
  const route=journeys[chosen];if(!route)return;
  step=Math.max(0,Math.min(route.stops.length-1,index));
  const stop=route.stops[step];
  guide.querySelector('.guide-name').textContent=route.name;
  guide.querySelector('.guide-progress').textContent=String(step+1).padStart(2,'0')+' / '+String(route.stops.length).padStart(2,'0');
  guide.querySelector('strong').textContent=stop.title;guide.querySelector('.guide-story p').textContent=stop.copy;
  $('#guide-prev').disabled=step===0;$('#guide-next').textContent=step===route.stops.length-1?'Abschließen':'Weiter';
  if(stop.detail!==undefined){const details=$$('#selected-work details');details.forEach((d,i)=>d.open=i===stop.detail)}
  if(stop.product)selectProduct(stop.product);
  window.ProfileNavigation?.refresh();window.ProfileNavigation?.go('#'+stop.target);
}
$$('[data-journey]').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.journey)));
$('#journey-clear').addEventListener('click',()=>choose(chosen));
$('#journey-start').addEventListener('click',()=>{if(!chosen)return;guided=true;guide.hidden=false;document.body.classList.add('theme-guided');visit(0);change()});
$('#guide-prev').addEventListener('click',()=>visit(step-1));
$('#guide-next').addEventListener('click',()=>{if(step===journeys[chosen].stops.length-1)endGuide();else visit(step+1)});
$('#guide-exit').addEventListener('click',endGuide);
document.addEventListener('click',e=>{if(e.target.closest('a[href="#home"]'))endGuide()});

function selectProduct(key){
  const product=products[key];if(!product)return;
  $$('[data-product]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.product===key)));
  const output=$('.workbench-output');output.dataset.status=product.status;
  const preview=output.querySelector('.product-preview'),img=preview.querySelector('img');
  preview.hidden=!product.image;
  if(product.image){img.src=product.image;img.alt=product.imageAlt;preview.querySelector('span').textContent=product.imageCaption;}else{img.removeAttribute('src');img.alt='';}
  output.querySelector('.product-number').textContent=product.number+' / 04';output.querySelector('.product-status').textContent=product.status;
  output.querySelector('h3').textContent=product.name;output.querySelector('.product-reason').textContent=product.reason;
  output.querySelector('.product-tags').replaceChildren(...product.tags.map(text=>{const span=document.createElement('span');span.textContent=text;return span}));
  const link=output.querySelector('.product-link');link.href=product.url;link.textContent=product.cta;
  resultAnimation?.cancel();
  if(!reduced.matches)resultAnimation=output.querySelector('.product-result').animate([{opacity:.3,transform:'translateX(12px)'},{opacity:1,transform:'none'}],{duration:500,easing:'cubic-bezier(.22,1,.36,1)'});
  const connector=$('.workbench-connector');connector.classList.remove('is-passing');void connector.offsetWidth;connector.classList.add('is-passing');
}
$$('[data-product]').forEach(b=>b.addEventListener('click',()=>selectProduct(b.dataset.product)));
selectProduct('presence');

// No travelling signature (founder decision 2026-09-20): the page's red dots are the wordmarks only.
function tick(dt){
  if(document.hidden)return;
  window.CareerAtlas?.tick(dt);
  const menuOpen=!$('#menu').hidden,blocked=!!$('dialog[open]')||!$('#signature-intro').hidden;
  guide.style.visibility=blocked||menuOpen?'hidden':'';
}
window.Experience={get focusTopics(){return chosen&&!guided?journeys[chosen].topics:[]},tick};
})();
