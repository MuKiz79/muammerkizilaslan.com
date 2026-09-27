/* Optional first-party audience analytics. No tracker request before consent. */
(() => {
 'use strict';
 if (window.top !== window.self || window.KarriaroShowcase) return;
 const en=document.documentElement.lang.startsWith('en');
 const key='karriaro-statistics-consent-v1', days=180, version=1;
 const copy=en?{
  title:'May we learn from your visit?',text:'Optional statistics help us understand which pages are useful: visit paths, time on page, device, approximate region and possible business-network hints. We use a browser identifier in local storage. No recording of form contents or screen sessions.',allow:'Allow statistics',deny:'Decline',settings:'Privacy settings',privacy:'Privacy information',close:'Close',saved:'Your choice has been saved.',statusOn:'Statistics are enabled.',statusOff:'Statistics are disabled.'
 }:{title:'Dürfen wir aus Ihrem Besuch lernen?',text:'Optionale Statistiken zeigen uns, welche Seiten hilfreich sind: Besuchswege, Verweildauer, Gerät, ungefähre Region und mögliche Hinweise auf ein Unternehmensnetzwerk. Dafür nutzen wir eine Browserkennung im lokalen Speicher. Keine Aufzeichnung von Formularinhalten oder Bildschirm-Sitzungen.',allow:'Statistik erlauben',deny:'Ablehnen',settings:'Datenschutzeinstellungen',privacy:'Datenschutzinformationen',close:'Schließen',saved:'Ihre Auswahl wurde gespeichert.',statusOn:'Die Statistik ist eingeschaltet.',statusOff:'Die Statistik ist ausgeschaltet.'};
 const personal=location.hostname.includes('muammerkizilaslan') || document.querySelector('meta[property="og:site_name"]')?.content==='Muammer Kizilaslan';
 const allowedHosts=personal?['muammerkizilaslan.com','www.muammerkizilaslan.com']:['karriaro-webdesign.de','www.karriaro-webdesign.de'];
 const slug=personal?'muammerkizilaslan':'karriaro-webdesign';
 let choice=null, tag=null, loaded=false, restoreFocus=null;
 try{const saved=JSON.parse(localStorage.getItem(key));if(saved?.version===version&&saved.expires>Date.now()&&['accepted','denied'].includes(saved.choice))choice=saved.choice}catch{}
 function clearIdentifiers(){try{for(const k of ['lh_sid','lighthouse_consent','cookie_consent'])localStorage.removeItem(k)}catch{}}
 if(choice!=='accepted')clearIdentifiers();
 function start(){
  if(choice!=='accepted'||!allowedHosts.includes(location.hostname))return;
  if(loaded&&window.lighthouse){window.lighthouse.consent('full');window.lighthouse.pageview();return}
  if(tag)return;
  tag=document.createElement('script');tag.async=true;tag.src='https://lighthouse.karriaro.de/t.js';
  Object.assign(tag.dataset,{site:slug,consent:'full',siteConsent:'minimal',replay:'off',heatmap:'off'});
  tag.onload=()=>{loaded=true;if(choice!=='accepted'){window.lighthouse?.consent('denied');clearIdentifiers()}};
  tag.onerror=()=>{tag.remove();tag=null;loaded=false};document.head.appendChild(tag);
 }
 function stop(){if(tag)tag.dataset.consent='denied';window.lighthouse?.consent('denied');clearIdentifiers()}
 const box=document.createElement('section');box.className='privacy-choice';box.setAttribute('role','region');box.setAttribute('aria-labelledby','privacy-choice-title');box.hidden=true;
 const heading=document.createElement('h2');heading.id='privacy-choice-title';heading.textContent=copy.title;
 const paragraph=document.createElement('p');paragraph.textContent=copy.text;
 const status=document.createElement('p');status.className='privacy-choice-status';status.setAttribute('aria-live','polite');
 const actions=document.createElement('div');actions.className='privacy-choice-actions';
 const deny=document.createElement('button');deny.type='button';deny.textContent=copy.deny;
 const allow=document.createElement('button');allow.type='button';allow.textContent=copy.allow;
 const privacy=document.createElement('a');privacy.href=(en?'/en':'')+'/datenschutz.html#statistik';privacy.textContent=copy.privacy;
 const close=document.createElement('button');close.type='button';close.className='privacy-choice-close';close.textContent=copy.close;close.hidden=!choice;
 actions.append(deny,allow);box.append(heading,paragraph,status,actions,privacy,close);document.body.append(box);
 function dismiss(){box.hidden=true;restoreFocus?.focus();restoreFocus=null}
 function choose(value){const old=choice;choice=value;try{localStorage.setItem(key,JSON.stringify({version,choice,expires:Date.now()+days*86400000}))}catch{};if(value==='accepted'&&old!=='accepted')start();else if(value==='denied')stop();dismiss()}
 deny.addEventListener('click',()=>choose('denied'));allow.addEventListener('click',()=>choose('accepted'));close.addEventListener('click',dismiss);
 const settings=document.createElement('button');settings.type='button';settings.className='privacy-settings';settings.textContent=copy.settings;
 settings.addEventListener('click',()=>{restoreFocus=settings;close.hidden=!choice;status.textContent=choice==='accepted'?copy.statusOn:copy.statusOff;box.hidden=false;heading.tabIndex=-1;heading.focus()});
 (document.querySelector('.pg-footer-bottom nav,footer nav,footer>div:last-child,footer')||document.body).append(settings);
 box.addEventListener('keydown',event=>{if(event.key==='Escape'&&choice){event.preventDefault();dismiss()}});
 window.addEventListener('storage',event=>{if(event.key!==key)return;let next=null;try{const saved=JSON.parse(event.newValue);if(saved?.version===version&&saved.expires>Date.now())next=saved.choice}catch{};if(next!=='accepted'){choice=next;stop()}else if(choice!=='accepted'){choice='accepted';start()}});
 if(choice==='accepted')start();else if(!choice){
  const reveal=()=>{if(!choice)box.hidden=false};
  if(document.querySelector('#signature-intro'))window.addEventListener('signatureintro:end',reveal,{once:true});else reveal();
 }
})();
