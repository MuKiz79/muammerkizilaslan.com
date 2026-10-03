const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const mobilePath = require('../journey-path.js').mobile;
let writes = 0;
function element() {
  const names = new Set();
  return {
    children: [],
    append(child) {
      this.children.push(child);
    },
    setAttribute() {},
    classList: {
      add: (name) => names.add(name),
      remove: (name) => names.delete(name),
      contains: (name) => names.has(name),
      toggle(name, on) {
        on ? names.add(name) : names.delete(name);
      },
    },
    style: new Proxy(
      {
        setProperty(name, value) {
          this[name] = value;
        },
      },
      {
        set(target, key, value) {
          writes++;
          target[key] = value;
          return true;
        },
      },
    ),
    clientHeight: 844,
  };
}
for (const reduced of [false, true]) {
  const root = {},
    html = element(),
    stage = element(),
    scenes = Array.from({ length: 8 }, element),
    contents = scenes.map(element);
  vm.runInNewContext(fs.readFileSync(require.resolve('../mobile-reader.js'), 'utf8'), {
    window: root,
    document: { documentElement: html, createElement: element },
  });
  const reader = root.createMobileReader({ scenes, contents, stage });
  reader.mode(true);
  const height = reader.height();
  assert.equal(height, 844);
  const path = mobilePath(
    390,
    height,
    [1400, 1800, 1000, 3200, 1600, 1100, 1500, 1200].map((height, i) => ({
      height,
      direction: ['right', 'down', 'right', 'up', 'down', 'right', 'up', 'right'][i],
    })),
  );
  reader.layout(path, height);
  let offset = 0;
  for (const [i, stop] of path.stops.entries()) {
    assert.ok(
      Math.abs(offset - stop.start) < 1e-8,
      'flow starts align with original chapter positions',
    );
    offset += parseFloat(scenes[i].style['--reader-span']) - height;
    assert.equal(parseFloat(scenes[i].style['--reader-pin']), -stop.pan);
    reader.render(path.sample(stop.start, reduced));
    writes = 0;
    for (let p = 0.01; p < 1; p += 0.013)
      reader.render(path.sample(stop.start + stop.pan * p, reduced));
    assert.equal(writes, 0, 'reading never writes a position or transform');
    assert.equal(contents[i].style.transform, '');
    assert.equal(
      scenes.at(-1).style.visibility,
      i === scenes.length - 1 ? 'visible' : 'hidden',
      'contact stays hidden until reached',
    );
    if (stop.distance) {
      reader.render(path.sample(stop.turnStart + stop.distance * 0.4, reduced));
      assert.ok(
        scenes[i].classList.contains('is-turning') &&
          scenes[i + 1].classList.contains('is-turning'),
      );
      assert.equal(contents[i].style.transform, `translate3d(0,${-stop.pan}px,0)`);
      reader.render(path.sample(stop.turnStart + stop.distance * 0.2, reduced));
      reader.render(path.sample(stop.start + stop.pan * 0.9, reduced));
      assert.ok(
        scenes.every((scene) => !scene.classList.contains('is-turning')),
        'reversing into reading releases fixed surfaces',
      );
    }
  }
  reader.mode(false);
  assert.equal(html.classList.contains('native-reading'), false);
  assert.ok(contents.every((content) => content.style.transform === ''));
}
console.log(
  'PASS: native reading has zero JS position writes; exact route spans, reverse transitions, chapter isolation, reduced motion and desktop cleanup',
);
