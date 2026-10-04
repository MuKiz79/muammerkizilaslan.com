const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = (name) => fs.readFileSync(require.resolve('../' + name), 'utf8');

function entry({
  pathname = '/',
  search = '',
  hash = '',
  saved,
  languages = ['de-DE'],
  blocked = false,
  embedded = false,
} = {}) {
  let redirected;
  const listeners = {};
  const storage = new Map(saved ? [['profile-language', saved]] : []);
  const window = {};
  window.parent = embedded ? {} : window;
  const context = {
    window,
    URLSearchParams,
    navigator: { languages },
    location: {
      pathname,
      search,
      hash,
      replace: (url) => {
        redirected = url;
      },
    },
    localStorage: {
      getItem: (key) => {
        if (blocked) throw new Error('storage blocked');
        return storage.get(key);
      },
      setItem: (key, value) => {
        if (blocked) throw new Error('storage blocked');
        storage.set(key, value);
      },
    },
    document: {
      addEventListener: (type, handler) => {
        listeners[type] = handler;
      },
    },
  };
  vm.runInNewContext(read('language-init.js'), context);
  return { redirected, storage, listeners };
}

assert.equal(entry().redirected, undefined, 'German browser stays on German entry');
assert.equal(
  entry({ languages: ['en-GB'], search: '?v=release', hash: '#contact' }).redirected,
  '/en/?v=release#contact',
);
assert.equal(entry({ pathname: '/index.html', languages: ['fr-FR'] }).redirected, '/en/');
assert.equal(
  entry({ languages: ['fr-FR', 'de-DE'] }).redirected,
  undefined,
  'use first available preferred language',
);
assert.equal(
  entry({ saved: 'en' }).redirected,
  '/en/',
  'saved manual choice precedes browser preference',
);
assert.equal(entry({ saved: 'de', languages: ['en-US'] }).redirected, undefined);
assert.equal(
  entry({ pathname: '/en/', saved: 'de' }).redirected,
  undefined,
  'direct English link wins',
);
assert.equal(entry({ pathname: '/en/index.html', saved: 'de' }).redirected, undefined);
assert.equal(
  entry({ pathname: '/impressum.html', languages: ['en-US'] }).redirected,
  undefined,
  'legal deep links stay put',
);
assert.equal(
  entry({ embedded: true, saved: 'en' }).redirected,
  undefined,
  'preview host controls its language',
);
assert.equal(
  entry({ languages: ['en-US'], blocked: true, search: '?lang=de' }).redirected,
  undefined,
  'German choice cannot bounce back when storage is blocked',
);
assert.equal(entry({ search: '?lang=en', blocked: true }).redirected, '/en/?lang=en');
assert.equal(entry({ saved: 'invalid', languages: ['en-US'] }).redirected, '/en/');
const choice = entry({ search: '?lang=de', saved: 'en', languages: ['en-US'] });
assert.equal(choice.redirected, undefined);
assert.equal(choice.storage.get('profile-language'), 'de');
choice.listeners.click({ target: { closest: () => ({ lang: 'en' }) } });
assert.equal(choice.storage.get('profile-language'), 'en');
assert.doesNotThrow(() =>
  entry({ blocked: true }).listeners.click({ target: { closest: () => ({ lang: 'en' }) } }),
);

// Language navigation must remain focusable and clickable while the intro is playing.
let active = false;
let scrollResets = 0;
let pauseClass = false;
let hidden = true;
const screenEvents = {},
  languageEvents = {},
  windowEvents = {};
const languageLink = {
  closest: (selector) => (selector === '.intro-language' ? languageLink : null),
};
const normalTarget = { closest: () => null };
const languageNav = {
  addEventListener: (type, handler) => {
    languageEvents[type] = handler;
  },
  contains: (target) => target === languageLink,
};
const screen = {
  get hidden() {
    return hidden;
  },
  set hidden(value) {
    hidden = value;
  },
  offsetWidth: 1,
  classList: {
    add: (name) => {
      if (name === 'is-paused') pauseClass = true;
    },
    remove: (name) => {
      if (name === 'is-paused') pauseClass = false;
    },
  },
  querySelector: (selector) =>
    selector === '.intro-language' ? languageNav : { addEventListener() {} },
  addEventListener: (type, handler) => {
    screenEvents[type] = handler;
  },
};
const introWindow = {
  IntroStory: { duration: 6600 },
  scrollY: 0,
  scrollTo() {
    scrollResets++;
  },
  dispatchEvent() {},
  addEventListener: (type, handler) => {
    windowEvents[type] = handler;
  },
};
vm.runInNewContext(read('intro.js'), {
  window: introWindow,
  Event: class {},
  performance: { now: () => 0 },
  matchMedia: () => ({ matches: false }),
  setTimeout: () => 1,
  clearTimeout() {},
  document: {
    hidden: false,
    readyState: 'complete',
    getElementById: () => screen,
    querySelectorAll: () => [],
    addEventListener() {},
    body: {
      classList: {
        add: () => {
          active = true;
        },
        remove: () => {
          active = false;
        },
      },
    },
  },
});
assert.ok(active && !hidden);
const beforeFragment = scrollResets;
introWindow.scrollY = 900;
windowEvents.scroll();
assert.equal(
  scrollResets,
  beforeFragment + 1,
  'deep-link restoration cannot move the visible opening',
);
windowEvents.keydown({ key: 'Tab', target: normalTarget });
assert.ok(active, 'Tab must not dismiss the language links');
languageEvents.focusin();
assert.ok(pauseClass, 'pause while choosing a language with the keyboard');
windowEvents.keydown({ key: 'Enter', target: languageLink });
screenEvents.pointerdown({
  target: languageLink,
  stopPropagation() {
    throw new Error('language link swallowed');
  },
});
assert.ok(active, 'language activation must survive intro pointer/keyboard handlers');
languageEvents.focusout({ relatedTarget: normalTarget });
assert.ok(!pauseClass);
screenEvents.pointerdown({ target: normalTarget, stopPropagation() {} });
assert.ok(!active && hidden, 'ordinary tap still skips the intro');
const afterSkip = scrollResets;
windowEvents.scroll();
assert.equal(scrollResets, afterSkip, 'reading remains native after the intro');

console.log(
  'PASS: entry language priority, blocked storage, direct URLs, embedded previews and accessible splash switching',
);
