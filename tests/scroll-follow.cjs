const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));

function controller(file, {small = true, coarse = false, reduced = false} = {}) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const frames = [];
  const context = {
    scrollY: 1800, journeyTop: 1300, innerHeight: 844, maxTravel: 7000,
    currentTravel: 500, targetTravel: 500, lastScroll: 1800,
    mobile: {matches: small}, directScroll: {matches: small || coarse},
    reduce: {matches: reduced}, modalOpen: false, menu: {hidden: true},
    routeNav: {classList: {toggle() {}}},
    rail: {classList: {toggle() {}, remove() {}}},
    follow: (a, b, dt, tau) => b + (a - b) * Math.exp(-dt / tau),
    renderJourney() {frames.push(context.currentTravel);}
  };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('function updateJourney(dt)'), source.indexOf('function destinationFor(el)')), context);
  return {context, frames, tick: dt => context.updateJourney(dt)};
}

for (const file of ['main.js', 'en/main.js']) {
  for (const mode of [{small: true}, {small: false, coarse: true}, {small: false, reduced: true}]) {
    for (const hz of [30,60,120]) {
      const c = controller(file, mode), dt = 1 / hz;
      for (let frame = 0; frame < hz / 2; frame++) {
        c.context.scrollY += 600 * dt;
        c.tick(dt);
      }
      // After a fast swipe, reversing by half a pixel must reverse the content immediately.
      const before = c.context.currentTravel;
      c.context.scrollY -= 0.5;
      c.tick(dt);
      assert.ok(c.context.currentTravel < before, file + ': no residual movement in the old direction');
      assert.equal(c.context.currentTravel, c.context.scrollY - c.context.journeyTop, file + ': follows the native position exactly');
      const stopped = c.context.currentTravel;
      for (let frame = 0; frame < hz / 2; frame++) c.tick(dt);
      assert.equal(c.context.currentTravel, stopped, 'no independent settling after native scroll has stopped');
      for (const delta of [0.04, -0.03, 0.5, -0.5, 1 / 3, -1 / 3]) {
        c.context.scrollY += delta;
        c.tick(dt);
        assert.equal(c.context.currentTravel, c.context.scrollY - c.context.journeyTop, 'subpixel gestures stay precise without rounding');
      }
      c.context.scrollY = -40;
      c.tick(dt);
      assert.equal(c.context.currentTravel, 0, 'Safari overscroll above the document is clamped');
      c.context.scrollY = c.context.journeyTop + c.context.maxTravel + 80;
      c.tick(dt);
      assert.equal(c.context.currentTravel, c.context.maxTravel, 'overscroll below the document is clamped');
    }
  }
  const desktop = controller(file, {small: false});
  desktop.context.scrollY += 60;
  desktop.tick(1 / 60);
  assert.ok(desktop.context.currentTravel > 500 && desktop.context.currentTravel < 560, 'desktop mouse scrolling keeps its existing easing');
  console.log('PASS ' + file + ': reversal, stopping, fractional movement, overscroll, touch landscape, reduced motion and desktop');
}
