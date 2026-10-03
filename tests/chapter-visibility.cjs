const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const createPath = require('../journey-path.js').mobile;

for (const language of ['']) {
  const source = fs.readFileSync(require.resolve('../' + language + 'main.js'), 'utf8');
  for (const reduced of [false, true]) {
    const path = createPath(
      390,
      844,
      [1300, 1800, 1500, 2600, 1700, 1900, 2000, 1100].map((height, i) => ({
        height,
        direction: ['right', 'down', 'right', 'up', 'down', 'right', 'up', 'right'][i],
      })),
    );
    // Start with the unsafe visibility left by a failed native-animation setup.
    const scenes = path.stops.map(() => ({
      style: { visibility: 'visible' },
      querySelector: () => ({ classList: { contains: () => false } }),
    }));
    const context = {
      mobileReader: null,
      path,
      scenes,
      sceneContents: scenes.map(() => ({ style: {} })),
      currentTravel: 0,
      maxTravel: path.total,
      reduce: { matches: reduced },
      mobile: { matches: true },
      paintedFrames: '',
      paintedScene: -1,
      activeScene: 0,
      rail: { classList: { toggle() {} } },
      routeNav: { style: { setProperty() {} }, classList: { toggle() {} } },
      panels: [],
      renderMobileNav() {},
    };
    vm.createContext(context);
    vm.runInContext(
      source.slice(
        source.indexOf('function renderJourney()'),
        source.indexOf('function updateJourney(dt)'),
      ),
      context,
    );
    for (const position of [
      0,
      ...path.stops.flatMap((s) => [s.start + s.pan / 2, s.turnStart + s.distance / 2, s.end]),
      0,
    ]) {
      context.currentTravel = position;
      context.renderJourney();
      const state = path.sample(position, reduced),
        visible = state.frames.map((frame) => frame.index);
      for (const [i, scene] of scenes.entries()) {
        assert.equal(
          scene.style.visibility,
          visible.includes(i) ? 'visible' : 'hidden',
          'only the current chapter and its transition neighbor may be visible',
        );
        assert.equal(scene.inert, i !== state.index, 'inactive chapters cannot receive focus');
      }
      if (position === 0)
        assert.equal(
          scenes.at(-1).style.visibility,
          'hidden',
          'the contact chapter cannot cover the start',
        );
    }
  }
  console.log(
    'PASS ' +
      (language || 'de/') +
      ': first chapter, all transitions, return to start and reduced motion hide unrelated chapters',
  );
}
