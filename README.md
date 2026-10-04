# Muammer Kizilaslan

Static website served by GitHub Pages. No build step or runtime package installation is required.

## Structure

- `index.html` and `en/index.html` contain the translated pages.
- Root JavaScript files provide the shared navigation, animation and interaction logic.
- `ui-text.js` selects interface labels using the page's `lang` attribute.
- `topics.js`, `topic-evidence.js`, `cases.js` and `experience-data.js` contain content. Their English versions live in `en/`.
- CSS files are loaded in the order specified in each page. Preserve that order when editing the cascade.
- `typography.css` is the final type layer for both languages: Manrope for reading and clear headings, real Bodoni Moda italics for selected accents, Space Grotesk for labels. The body, lead, heading and caption scales are shared; compact desktop and mobile sizes are defined there. Font files, including italic Latin and Latin Extended subsets, are self-hosted.
- `world-land.js` contains local map geometry; fonts are hosted locally.

## Development

Run `npm ci` to install development tools, then:

```sh
npm test
npm run format:check
python3 -m http.server 8765
```

Open `http://localhost:8765/tests/mobile-reader-browser.html` and run the browser checks for both languages and mobile sizes. Use `npm run format` to apply consistent formatting.

## Scroll behavior

`journey-path.js` defines chapter positions and transitions. `mobile-reader.js` lets the browser scroll chapter content natively and only positions the surfaces during transitions. Resize events with unchanged geometry must not reset the scroll position.

When changing shared assets, update their query versions in both entry pages together. Check both languages, chapter navigation, expanded content and desktop/mobile transitions before publishing.
