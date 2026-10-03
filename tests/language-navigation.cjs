const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = (name) => fs.readFileSync(require.resolve('../' + name), 'utf8');
const main = read('main.js');
let keys;

for (const language of ['de', 'en']) {
  const context = { window: {}, document: { documentElement: { lang: language } } };
  vm.createContext(context);
  vm.runInContext(read('ui-text.js'), context);
  const copy = context.window.ProfileText;
  const currentKeys = Object.keys(copy).sort();
  if (keys) assert.deepEqual(currentKeys, keys, 'translations have matching keys');
  keys = currentKeys;

  const nodes = Object.fromEntries(
    ['#route-position', '#route-prev', '#route-next'].map((id) => [
      id,
      {
        textContent: '',
        attributes: {},
        setAttribute(name, value) {
          this.attributes[name] = value;
        },
      },
    ]),
  );
  const html = read(language === 'de' ? 'index.html' : 'en/index.html');
  const scenes = [...html.matchAll(/data-label="([^"]+)"/g)].map(([, label]) => ({
    dataset: { label },
  }));
  Object.assign(context, {
    copy,
    scenes,
    activeScene: 0,
    mobile: { matches: true },
    mobileNavState: '',
    routeIndex: { dataset: {} },
    $: (id) => nodes[id],
  });
  vm.runInContext(
    main.slice(main.indexOf('function renderMobileNav()'), main.indexOf('function goDirect(')),
    context,
  );

  context.renderMobileNav();
  assert.equal(nodes['#route-prev'].textContent, language === 'de' ? 'Start' : 'Home');
  assert.equal(
    nodes['#route-next'].attributes['aria-label'],
    language === 'de' ? 'Nächster Abschnitt: Meine Arbeit' : 'Next section: My work',
  );
  context.activeScene = 2;
  context.renderMobileNav();
  assert.equal(
    nodes['#route-position'].textContent,
    language === 'de' ? 'Verantwortung' : 'Responsibility',
  );
  context.activeScene = scenes.length - 1;
  context.renderMobileNav();
  assert.equal(
    nodes['#route-next'].attributes['aria-label'],
    language === 'de' ? 'Zurück zum Anfang' : 'Back to the start',
  );
  assert.equal(context.routeIndex.dataset.position, '08 / 08');
  assert.equal(copy.explore('Cloud'), language === 'de' ? 'Cloud entdecken' : 'Explore Cloud');

  context.motion = nodes['#route-prev'];
  context.reduce = { matches: false };
  context.paused = false;
  vm.runInContext(
    main.slice(main.indexOf('function syncMotion()'), main.indexOf('motion.addEventListener(')),
    context,
  );
  context.syncMotion();
  assert.equal(context.motion.textContent, language === 'de' ? 'BEWEGUNG — AN' : 'MOTION — ON');
  context.paused = true;
  context.syncMotion();
  assert.equal(context.motion.textContent, language === 'de' ? 'BEWEGUNG — AUS' : 'MOTION — OFF');
  context.reduce.matches = true;
  context.syncMotion();
  assert.equal(
    context.motion.textContent,
    language === 'de' ? 'BEWEGUNG — REDUZIERT' : 'MOTION — REDUCED',
  );
  console.log('PASS ' + language + ': shared navigation, accessible labels and motion controls');
}
