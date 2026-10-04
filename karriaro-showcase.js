/* Origin-checked playback controls for the Karriaro showcase. */
(() => {
  'use strict';
  if (
    window.parent === window ||
    new URLSearchParams(location.search).get('showcase') !== 'karriaro'
  )
    return;
  const allowed = new Set(['https://karriaro-webdesign.de', 'https://www.karriaro-webdesign.de']);
  const local = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
  function accepts(origin) {
    if (allowed.has(origin)) return true;
    try {
      const u = new URL(origin);
      return local && u.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(u.hostname);
    } catch {
      return false;
    }
  }
  let parentOrigin = '';
  try {
    parentOrigin = new URL(document.referrer).origin;
  } catch {}
  if (parentOrigin && !accepts(parentOrigin)) return;
  const state = (window.KarriaroShowcase = { paused: false });
  document.documentElement.classList.add('karriaro-preview');
  let ready = false,
    firstPlay = true,
    revision = 0,
    domReady = document.readyState !== 'loading';
  function report(type) {
    window.parent.postMessage({ channel: 'karriaro-preview', type }, parentOrigin);
  }
  function pause() {
    revision++;
    window.SignatureIntro?.pause();
    state.paused = true;
    document.documentElement.classList.add('karriaro-preview-paused');
  }
  function play(replay = false) {
    revision++;
    state.paused = false;
    document.documentElement.classList.remove('karriaro-preview-paused');
    if (firstPlay || replay) {
      firstPlay = false;
      window.SignatureIntro?.show();
    } else window.SignatureIntro?.resume();
  }
  function still() {
    play();
    window.SignatureIntro?.finish();
    const current = revision;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (current === revision) {
          pause();
          firstPlay = true;
        }
      }),
    );
  }
  window.addEventListener('message', (event) => {
    if (
      event.source !== window.parent ||
      !accepts(event.origin) ||
      event.data?.channel !== 'karriaro-preview'
    )
      return;
    if (parentOrigin && event.origin !== parentOrigin) return;
    if (event.data.type === 'hello') {
      parentOrigin = event.origin;
      if (ready) report('ready');
      else initialise();
      return;
    }
    if (!ready || event.origin !== parentOrigin) return;
    switch (event.data.type) {
      case 'play':
        play();
        break;
      case 'replay':
        play(true);
        break;
      case 'pause':
        pause();
        break;
      case 'still':
        still();
        break;
      default:
        return;
    }
    report(state.paused ? 'paused' : 'playing');
  });
  // The host hides the frame until ready. Waiting for animation frames here can
  // deadlock on browsers which suspend painting of invisible embedded documents.
  // Neither remote fonts nor images are prerequisites for the playback bridge.
  function initialise() {
    if (ready || !domReady || !parentOrigin) return;
    window.SignatureIntro?.finish();
    pause();
    ready = true;
    report('ready');
  }
  if (domReady) Promise.resolve().then(initialise);
  else
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        domReady = true;
        Promise.resolve().then(initialise);
      },
      { once: true },
    );
  window.addEventListener('load', initialise, { once: true });
})();
