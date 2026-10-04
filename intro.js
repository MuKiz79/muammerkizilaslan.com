/* Replay the signature on every visit and every return to the start. */
(() => {
  'use strict';
  const screen = document.getElementById('signature-intro');
  if (!screen) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let timer,
    playing = false,
    pending = false,
    startedAt = 0,
    pausedAt = null;
  const duration = window.IntroStory.duration;
  function finish() {
    const wasPlaying = playing;
    pending = false;
    playing = false;
    pausedAt = null;
    screen.classList.remove('is-paused');
    clearTimeout(timer);
    document.body.classList.remove('intro-active');
    document.querySelectorAll('.hero,.journey').forEach((el) => (el.inert = false));
    if (wasPlaying) window.dispatchEvent(new Event('signatureintro:leaving'));
    screen.hidden = true;
    screen.classList.remove('is-playing');
    if (wasPlaying) window.dispatchEvent(new Event('signatureintro:end'));
  }
  function show() {
    finish();
    if (document.hidden) {
      pending = true;
      return;
    }
    window.scrollTo?.({ top: 0, behavior: 'instant' });
    screen.hidden = false;
    // Flush the previous animation before replaying the same element.
    void screen.offsetWidth;
    screen.classList.add('is-playing');
    startedAt = performance.now();
    playing = true;
    document.body.classList.add('intro-active');
    document.querySelectorAll('.hero,.journey').forEach((el) => (el.inert = true));
    window.dispatchEvent(new Event('signatureintro:start'));
    timer = setTimeout(finish, reduced.matches ? 1200 : duration);
  }
  function pause() {
    if (!playing || pausedAt !== null) return;
    pausedAt = performance.now();
    clearTimeout(timer);
    screen.classList.add('is-paused');
  }
  function resume() {
    if (!playing || pausedAt === null) return;
    startedAt += performance.now() - pausedAt;
    pausedAt = null;
    screen.classList.remove('is-paused');
    timer = setTimeout(
      finish,
      Math.max(0, (reduced.matches ? 1200 : duration) - (performance.now() - startedAt)),
    );
  }
  window.SignatureIntro = {
    show,
    finish,
    pause,
    resume,
    elapsed: () => (playing ? ((pausedAt ?? performance.now()) - startedAt) / 1000 : -1),
  };

  screen.querySelector('.intro-skip').addEventListener('click', finish);
  const languages = screen.querySelector('.intro-language');
  languages?.addEventListener('focusin', pause);
  languages?.addEventListener('focusout', (event) => {
    if (!languages.contains(event.relatedTarget)) resume();
  });
  screen.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.intro-language')) return;
    event.stopPropagation();
    finish();
  });
  window.addEventListener('wheel', finish, { passive: true });
  // Native fragment restoration must not move a deep-linked chapter behind the opening.
  window.addEventListener(
    'scroll',
    () => {
      if (playing && window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'instant' });
    },
    { passive: true },
  );
  window.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Tab' || event.target.closest?.('.intro-language')) return;
      finish();
    },
    true,
  );
  window.addEventListener('pagehide', finish);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) show();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) {
      finish();
      pending = true;
    } else if (!document.hidden && pending) show();
  });
  // Native/programmatic scroll restoration must not dismiss the opening.
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', show, { once: true });
  else show();
})();
