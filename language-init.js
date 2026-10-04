/* Resolve the entry language before the splash screen is rendered. */
(() => {
  'use strict';
  const key = 'profile-language';
  const supported = (value) => value === 'de' || value === 'en';
  const requested = new URLSearchParams(location.search).get('lang');
  let saved;
  try {
    saved = localStorage.getItem(key);
    if (supported(requested)) localStorage.setItem(key, requested);
  } catch {
    // The explicit URL choice still works when browser storage is unavailable.
  }

  const browserLanguage =
    (navigator.languages?.length ? navigator.languages : [navigator.language || 'de'])
      .map((language) => language.toLowerCase().split('-')[0])
      .find(supported) || 'en';
  const preferred = supported(requested) ? requested : supported(saved) ? saved : browserLanguage;

  // A direct English URL is intentional. Embedded previews keep the host's URL language.
  if (
    window.parent === window &&
    /^\/(?:index\.html)?$/.test(location.pathname) &&
    preferred === 'en'
  ) {
    location.replace('/en/' + location.search + location.hash);
    return;
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('.language-switch a[lang]');
    if (!link || !supported(link.lang)) return;
    try {
      localStorage.setItem(key, link.lang);
    } catch {}
  });
})();
