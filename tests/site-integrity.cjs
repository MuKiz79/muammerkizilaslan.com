const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const postcss = require('postcss');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const pages = [
  'index.html',
  'en/index.html',
  'impressum.html',
  'en/impressum.html',
  'datenschutz.html',
  'en/datenschutz.html',
];

for (const page of pages) {
  const html = read(page);
  for (const [, reference] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(?:[a-z]+:|\/\/|#)/i.test(reference)) continue;
    const clean = reference.split(/[?#]/)[0];
    const file = clean.startsWith('/')
      ? path.join(root, clean)
      : path.resolve(root, path.dirname(page), clean);
    assert.ok(fs.existsSync(file), page + ': missing asset ' + reference);
  }
}

const scripts = (page) =>
  [...read(page).matchAll(/<script\s+src="([^"]+)"/g)].map(([, src]) =>
    path.basename(src.split('?')[0]),
  );
assert.deepEqual(
  scripts('index.html'),
  scripts('en/index.html'),
  'both languages load the same script sequence',
);
const localized = ['cases.js', 'experience-data.js', 'topic-evidence.js', 'topics.js'];
assert.deepEqual(
  fs
    .readdirSync(path.join(root, 'en'))
    .filter((file) => file.endsWith('.js'))
    .sort(),
  localized,
);

for (const directory of ['', 'en']) {
  for (const name of fs.readdirSync(path.join(root, directory))) {
    const file = path.join(directory, name);
    if (name.endsWith('.js')) new vm.Script(read(file), { filename: file });
    if (name.endsWith('.css')) postcss.parse(read(file), { from: file });
  }
}

console.log(
  'PASS: local assets resolve, shared scripts load in the same order, JavaScript and CSS parse',
);
