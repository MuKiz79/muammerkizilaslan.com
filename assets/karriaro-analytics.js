/* Karriaro Analytics v1 — local asset, opt-in, no replay or form capture. */
(() => {
  'use strict';
  const script = document.currentScript;
  if (!script || window.KarriaroAnalytics) return;
  const siteId = script.dataset.siteId;
  const endpoint = new URL(script.dataset.endpoint || '/statistik/', location.href);
  const allowedHosts = (script.dataset.hosts || '').split(',');
  const enabled = script.dataset.enabled === 'true' && /^\d+$/.test(siteId || '') &&
    (endpoint.origin === location.origin || endpoint.href === 'https://karriaro.de/statistik/muammer/') && allowedHosts.includes(location.hostname);
  const KEY = 'mk_analytics_consent', VERSION = 'v1', DAYS = 180;
  const defaultSections = [
    ['.hero', 'Auftakt'], ['#bestand', 'Profil'], ['#rechenweg', 'Entwicklung'],
    ['#werdegang', 'Werdegang'], ['#lehre', 'Lehre'], ['#positionen', 'Leistungen'],
    ['#mensch', 'Abseits des Berufs'], ['#engagement', 'Engagement'],
    ['#freigabe', 'Immobiliengespräch'], ['#kontakt', 'Kontakt']
  ];
  let sections = defaultSections;
  try { if (script.dataset.sections) sections = JSON.parse(script.dataset.sections); } catch { return; }
  if (!Array.isArray(sections) || sections.some(s => !Array.isArray(s) || s.length !== 2 || s.some(v => typeof v !== 'string'))) return;
  const contactEmail = script.dataset.contactEmail || 'ilyas.kablan@kablan-immobilien.de';
  const companyHost = script.dataset.companyHost || 'kablan-immobilien.de';
  let tracker, loading, granted = false, timer, lastTick = 0, foregroundMs = 0;
  let maxScroll = 0, focusBefore;
  const states = sections.map(([selector, name]) => ({
    element: document.querySelector(selector), name, consecutive: 0, milliseconds: 0,
    reported: 0, reached: false
  })).filter(s => s.element);

  function readConsent() {
    const match = document.cookie.split('; ').find(c => c.startsWith(KEY + '='));
    return match ? decodeURIComponent(match.slice(KEY.length + 1)).split(':') : [];
  }
  function choice() {
    const [version, value] = readConsent();
    return version === VERSION && ['yes', 'no'].includes(value) ? value : null;
  }
  function remember(value) {
    document.cookie = `${KEY}=${VERSION}:${value}; Max-Age=${DAYS * 86400}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  }
  function cleanUrl() {
    const u = new URL(location.pathname, location.origin);
    const q = new URLSearchParams(location.search);
    const sources = ['google', 'bing', 'linkedin', 'instagram', 'facebook', 'qr', 'newsletter'];
    const media = ['organic', 'social', 'email', 'cpc', 'qr', 'referral'];
    const campaigns = (script.dataset.campaigns || 'visitkarte,linkedin-profil').split(',');
    for (const [key, values] of [['utm_source', sources], ['utm_medium', media], ['utm_campaign', campaigns]]) {
      const value = q.get(key);
      if (values.includes(value)) u.searchParams.set(key, value);
    }
    return u.href;
  }
  function event(category, action, name, value) {
    if (!granted || choice() !== 'yes' || !tracker) return;
    tracker.trackEvent(category, action, name, value);
  }
  function flush() {
    if (!granted || !tracker) return;
    for (const state of states) {
      const seconds = Math.floor(state.milliseconds / 1000) - state.reported;
      if (state.reached && seconds >= 1) {
        event('Inhalte', 'Aktive Sichtbarkeit', state.name, seconds);
        state.reported += seconds;
      }
    }
  }
  function tick() {
    if (choice() !== 'yes') { stop(); return; }
    const now = performance.now(), delta = Math.min(1000, Math.max(0, now - lastTick));
    lastTick = now;
    if (document.hidden || !document.hasFocus() || document.querySelector('#signature-intro:not([hidden])')) {
      states.forEach(s => { s.consecutive = 0; });
      return;
    }
    foregroundMs += delta;
    // Attribute time only to the section occupying the largest visible area.
    const visible = states.map(s => {
      const r = s.element.getBoundingClientRect();
      const width = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
      const height = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
      return {s, area: s.element.closest('[inert],[hidden]') ? 0 : width * height};
    }).sort((a, b) => b.area - a.area);
    const active = visible[0]?.area >= Math.min(120, innerHeight / 3) * Math.min(160, innerWidth / 2) ? visible[0].s : null;
    for (const state of states) {
      if (state !== active) { state.consecutive = 0; continue; }
      state.consecutive += delta;
      state.milliseconds += delta;
      if (state.consecutive >= 2000 && !state.reached) {
        state.reached = true;
        event('Inhalte', 'Abschnitt erreicht', state.name);
      }
    }
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    const depth = scrollable > 0 ? Math.min(100, Math.round(scrollY / scrollable * 100)) : 100;
    for (const threshold of [25, 50, 75, 100]) {
      if (foregroundMs >= 2000 && depth >= threshold && maxScroll < threshold) {
        maxScroll = threshold;
        event('Nutzung', 'Scrolltiefe', `${threshold}%`);
      }
    }
    if (Math.floor(foregroundMs / 15000) > Math.floor((foregroundMs - delta) / 15000)) {
      flush();
      tracker.ping();
    }
  }
  async function start() {
    if (!enabled || granted || choice() !== 'yes') return;
    if (!loading) loading = new Promise((resolve, reject) => {
      if (window.Matomo) { resolve(); return; }
      const tag = document.createElement('script');
      tag.src = new URL('matomo.js', endpoint).href;
      tag.async = true;
      tag.onload = resolve;
      tag.onerror = () => { tag.remove(); loading = null; reject(new Error('measurement unavailable')); };
      document.head.append(tag);
    });
    try { await loading; } catch { return; }
    if (choice() !== 'yes' || granted || !window.Matomo) return;
    tracker = window.Matomo.getTracker(new URL('matomo.php', endpoint).href, siteId);
    tracker.requireConsent();
    tracker.setConsentGiven();
    tracker.setRequestMethod('POST');
    tracker.setCookiePath('/');
    tracker.setVisitorCookieTimeout(90 * 86400);
    tracker.setReferralCookieTimeout(90 * 86400);
    tracker.setSecureCookie(location.protocol === 'https:');
    tracker.setCustomUrl(cleanUrl());
    tracker.setDocumentTitle(script.dataset.pageTitle || 'Profilseite');
    // Keep only the referring origin; never forward a search or personal URL.
    try { tracker.setReferrerUrl(document.referrer ? new URL(document.referrer).origin + '/' : ''); } catch { tracker.setReferrerUrl(''); }
    granted = true;
    foregroundMs = 0; maxScroll = 0;
    states.forEach(s => { s.consecutive = 0; s.milliseconds = 0; s.reported = 0; s.reached = false; });
    tracker.trackPageView();
    // Own heartbeat is tied to the consent/focus checks above; no independent timer.
    lastTick = performance.now();
    timer = setInterval(tick, 500);
  }
  function stop() {
    granted = false;
    clearInterval(timer);
    if (tracker) {
      tracker.forgetConsentGiven();
      tracker.disableCookies();
      tracker.deleteCookies();
    }
    // Also remove first-party Matomo cookies after revocation on a fresh page.
    document.cookie.split('; ').forEach(part => {
      const name = part.split('=')[0];
      if (/^_pk_(id|ses|ref|cvar|hsr)\./.test(name) || /^mtm_(consent|cookie_consent)$/.test(name))
        document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    });
  }
  function clicked(e) {
    if (!granted || !e.isTrusted) return;
    const el = e.target.closest('a,button');
    if (!el || el.closest('#kr-consent')) return;
    const area = el.closest('section'), position = area?.id || (area?.classList.contains('hero') ? 'Auftakt' : 'Fußbereich');
    if (el.matches('.topic')) { event('Interaktion', 'Thema auswählen', el.textContent.trim().slice(0,80)); return; }
    if (el.matches('[data-case]')) { event('Interaktion', 'Berufliche Station öffnen', el.dataset.case); return; }
    if (el.matches('.kr-kontakt-kopie')) { event('Kontakt', 'E-Mail kopieren angeklickt', 'Kontakt'); return; }
    const href = el.getAttribute('href') || '';
    if (href.split('?')[0].toLowerCase() === 'mailto:' + contactEmail.toLowerCase()) event('Kontakt', 'E-Mail angeklickt', position);
    else if (href.startsWith('tel:')) event('Kontakt', 'Telefon angeklickt', position);
    else if (/\.vcf(?:$|[?#])/.test(href)) event('Downloads', 'Visitenkarte angeklickt', position);
    else if (href === '#contact') event('Navigation', 'Kontaktbereich öffnen', position);
    else {
      try {
        const url = new URL(href, location.href);
        if (url.hostname === companyHost || url.hostname === 'www.' + companyHost) event('Externe Ziele', 'Unternehmenswebsite', position);
        if (url.hostname === 'www.linkedin.com' || url.hostname === 'linkedin.com') event('Externe Ziele', 'LinkedIn', position);
      } catch { /* unsupported link, deliberately ignored */ }
    }
  }

  // Non-modal region: the initial notice must not take focus from the page.
  const panel = document.createElement('section');
  panel.id = 'kr-consent';
  panel.hidden = true;
  panel.setAttribute('aria-labelledby', 'kr-consent-title');
  panel.innerHTML = `<h2 id="kr-consent-title" class="kr-consent-sr">Besuchsanalyse</h2><div class="kr-consent-main"><p class="kr-consent-copy">Dürfen wir mit Matomo-Cookies Besuche und Klicks zur Verbesserung dieser Website auswerten?</p><div class="kr-consent-actions"><button type="button" class="kr-consent-toggle" aria-expanded="false" aria-controls="kr-consent-details">Details</button><button type="button" data-choice="no">Ablehnen</button><button type="button" data-choice="yes">Erlauben</button></div></div><div id="kr-consent-details" hidden><p class="kr-consent-description"></p><p>Erfasst werden Besuche, Wiederbesuche, Inhaltsaufrufe, aktive Sichtbarkeitszeiten und Klicks. Analyse-Cookies bleiben bis zu 90 Tage gespeichert. Ihre Auswahl wird 180 Tage gespeichert.</p><p>Jederzeit unter „Datenschutzeinstellungen“ widerrufbar. <a href="datenschutz.html#besuchsmessung">Datenschutz</a></p><p class="kr-consent-status" aria-live="polite"></p></div>`;
  panel.querySelector('.kr-consent-description').textContent = `Verantwortlich: ${script.dataset.controller || 'Ilyas Kablan'}. Matomo wird von Karriaro bei Hetzner in Deutschland betrieben.`;
  const detail = panel.querySelector('#kr-consent-details');
  const toggle = panel.querySelector('.kr-consent-toggle');
  const spacer = document.createElement('div');
  spacer.setAttribute('aria-hidden', 'true');
  function reserveSpace() {
    const height = panel.hidden ? 0 : Math.ceil(panel.getBoundingClientRect().height);
    spacer.style.height = `${height}px`;
    document.documentElement.style.setProperty('--kr-consent-height', `${height}px`);
  }
  function showDetails(expanded) {
    detail.hidden = !expanded;
    toggle.setAttribute('aria-expanded', String(expanded));
    reserveSpace();
  }
  toggle.addEventListener('click', () => showDetails(detail.hidden));
  const settings = document.createElement('button');
  settings.type = 'button'; settings.className = 'kr-privacy-settings';
  settings.textContent = 'Datenschutzeinstellungen';
  function openSettings(expanded = false) {
    focusBefore = document.activeElement;
    panel.querySelector('.kr-consent-status').textContent = choice() === 'yes' ? 'Aktuell: Analyse erlaubt.' : choice() === 'no' ? 'Aktuell: Analyse ausgeschaltet.' : '';
    panel.hidden = false;
    panel.setAttribute('open', '');
    showDetails(expanded);
  }
  panel.addEventListener('click', e => {
    const button = e.target.closest('[data-choice]');
    if (!button) return;
    remember(button.dataset.choice);
    if (button.dataset.choice === 'yes') start(); else stop();
    panel.hidden = true;
    panel.removeAttribute('open');
    reserveSpace();
    if (focusBefore?.isConnected) focusBefore.focus({preventScroll: true});
  });
  settings.addEventListener('click', () => openSettings(true));
  document.body.append(panel, spacer);
  new ResizeObserver(reserveSpace).observe(panel);
  (document.querySelector('footer') || document.body).append(settings);
  document.addEventListener('click', clicked, {capture: true});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flush();
    else if (choice() !== 'yes') stop();
  });
  addEventListener('pagehide', flush);
  addEventListener('focus', () => { if (choice() !== 'yes') stop(); else start(); });
  window.KarriaroAnalytics = Object.freeze({openSettings, getConsent: choice});
  if (enabled) {
    if (choice() === 'yes') start();
    else if (!choice()) {
      const offer=()=>{if(!choice())openSettings()};
      if(document.querySelector('#signature-intro:not([hidden])')) window.addEventListener('signatureintro:end',offer,{once:true});
      else setTimeout(offer,800);
    }
  } else {
    settings.hidden = true;
  }
})();
