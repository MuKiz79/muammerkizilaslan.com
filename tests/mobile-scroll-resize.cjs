const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const mobilePath = require(path.join(root, 'journey-path.js')).mobile;
const desktopPath = require(path.join(root, 'journey-path.js'));

function fixture(file, width = 390, height = 760) {
  const small = width <= 700;
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const stage = {clientHeight: height};
  const contents = [1400, 1600, 1900].map(scrollHeight => ({scrollHeight, style: {}}));
  const scenes = ['right', 'down', 'up'].map(direction => ({dataset: {direction}, scrollWidth: 1300}));
  const calls = {builds: 0, paints: 0, scrolls: 0};
  const context = {
    innerWidth: width, innerHeight: height, scrollY: 1300,
    mobile: {matches: small}, reduce: {matches: false},
    journey: {offsetTop: 1300, style: {}}, track: {style: {}},
    rail: {offsetWidth: small ? 0 : 56, classList: {toggle() {}, remove() {}}},
    scenes, sceneContents: contents,
    document: {documentElement: {classList: {toggle() {}}}},
    $: () => stage, $$: () => [],
    renderMobileNav() {}, renderJourney() {calls.paints++;},
    window: {
      createMobileJourneyPath(...args) {calls.builds++; return mobilePath(...args);},
      createJourneyPath(...args) {calls.builds++; return desktopPath(...args);},
      scrollTo({top}) {calls.scrolls++; context.scrollY = top;}
    },
    follow: (current, target, dt, tau) => target + (current - target) * Math.exp(-dt / tau),
    routeNav: {classList: {toggle() {}}}, modalOpen: false, menu: {hidden: true}
  };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('let maxTravel='), source.indexOf('function renderJourney()')), context);
  vm.runInContext(source.slice(source.indexOf('function updateJourney(dt)'), source.indexOf('function destinationFor(el)')), context);
  const run = code => vm.runInContext(code, context);
  run('resizeJourney()');
  return {context, calls, stage, contents, run};
}

for (const file of ['main.js', 'en/main.js']) {
  const f = fixture(file);
  f.run('scrollY=1660;currentTravel=300;targetTravel=360;updateJourney(1/60)');
  const before = f.run('currentTravel');
  const paints = f.calls.paints;
  // Browser chrome can change innerHeight without changing a 100svh stage.
  for (const height of [774, 788, 801, 820, 804, 780, 760]) {
    f.context.innerHeight = height;
    f.run('resizeJourney()');
    assert.equal(f.run('currentTravel'), before, file + ': unchanged layout must not snap an in-flight scroll');
  }
  assert.equal(f.calls.builds, 1, file + ': no redundant path rebuild');
  assert.equal(f.calls.paints, paints, file + ': no extra paint on unchanged geometry');
  assert.equal(f.calls.scrolls, 0);
  f.run('updateJourney(1/60)');
  assert.ok(f.run('currentTravel') > before && f.run('currentTravel') < 360, 'normal interpolation continues');

  // Disclosures and late images still expand the reading range.
  const oldTravel = f.run('maxTravel');
  f.contents[0].scrollHeight += 220;
  f.run('resizeJourney()');
  assert.ok(Math.abs(f.run('maxTravel') - oldTravel - 220) < 1e-6);
  assert.equal(f.calls.builds, 2);

  // A real viewport resize, changed direction and changed journey origin still invalidate geometry.
  f.stage.clientHeight = 700;
  f.run('resizeJourney()');
  assert.equal(f.calls.builds, 3);
  f.context.scenes[0].dataset.direction = 'up';
  f.run('resizeJourney()');
  assert.equal(f.calls.builds, 4);
  f.context.journey.offsetTop += 30;
  f.run('resizeJourney()');
  assert.equal(f.calls.builds, 5);
  assert.equal(f.run('journeyTop'), 1330);

  // Orientation and breakpoint changes must not be swallowed by the no-op check.
  f.context.innerWidth = 844;
  f.context.mobile.matches = false;
  f.context.rail.offsetWidth = 56;
  f.run('resizeJourney()');
  assert.equal(f.calls.builds, 6);
  assert.equal(f.calls.scrolls, 1);
  f.stage.clientHeight = 900;
  f.run('resizeJourney()');
  assert.equal(f.calls.builds, 7);
  assert.equal(f.calls.scrolls, 2);
  f.context.reduce.matches = true;
  const previousPaints = f.calls.paints;
  f.run('resizeJourney()');
  assert.equal(f.calls.paints, previousPaints + 1, 'motion preference changes repaint even at rest');
  f.run('scrollY += 100;updateJourney(1/60)');
  assert.equal(f.run('currentTravel'), f.run('targetTravel'));
  console.log('PASS ' + file + ': browser chrome, disclosures, viewport, route, origin, orientation, desktop and reduced motion');

  let scenarios = 0;
  for (const [width, height] of [[320,568],[360,640],[375,667],[390,844],[412,915],[430,932],[700,900],[701,700],[844,390],[1280,800]]) {
    for (const hz of [30,60,120]) {
      for (const direction of [-1,1]) {
        const m = fixture(file, width, height);
        m.run('scrollY=1600;currentTravel=targetTravel=300');
        let position = m.run('currentTravel');
        for (let frame = 0; frame < 36; frame++) {
          m.context.scrollY += direction * 1.25;
          m.run('updateJourney(' + (1 / hz) + ')');
          const next = m.run('currentTravel');
          assert.ok(direction * (next - position) >= 0, 'reading never reverses during a one-way gesture');
          position = next;
          m.context.innerHeight = height + 50 * Math.sin(frame / 36 * Math.PI);
          m.run('resizeJourney()');
          assert.equal(m.run('currentTravel'), position, 'browser chrome causes no independent position correction');
        }
        assert.equal(m.calls.builds, 1);
        assert.equal(m.calls.scrolls, 0);
        scenarios++;
      }
    }
  }
  console.log('PASS ' + file + ': ' + scenarios + ' size / frame-rate / scroll-direction scenarios');
}
