// The /resume page: the same content as the scroll presentation, as a plain
// semantic document for crawlers, ATS parsers and anyone who would rather read
// than scroll.
//
// Built to static HTML at build time (see the resumePage plugin in
// vite.config.js) rather than rendered by React, so the text is in the file a
// crawler fetches, not in a bundle it has to execute.
//
// Links here are relative, because the site has to work both at a domain root
// and under a GitHub Pages project subpath.
//
// Source of truth is src/data/stations.js — nothing here restates copy. The
// one presentational liberty is order: a résumé reads newest-first, while the
// journey reads oldest-first.

import { finale, hero, stations } from '../data/stations.js';

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const isEducation = (s) => /education/i.test(s.eyebrow);

function entry(s) {
  return `
      <article class="entry">
        <h3>${esc(s.title)}</h3>
        <p class="role">${esc(s.subtitle)}</p>
        <p class="meta"><span>${esc(s.eyebrow)}</span> · <time>${esc(s.dates)}</time></p>
        <ul>
${s.bullets.map((b) => `          <li>${esc(b)}</li>`).join('\n')}
        </ul>
        <p class="tags">${s.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</p>
      </article>`;
}

function contactRow(row) {
  const text = esc(row.address);
  return row.href
    ? `          <li><span class="label">${esc(row.line)}</span> <a href="${esc(row.href)}">${text}</a></li>`
    : `          <li><span class="label">${esc(row.line)}</span> ${text}</li>`;
}

export function renderResume() {
  const experience = stations.filter((s) => !isEducation(s)).slice().reverse();
  const education = stations.filter(isEducation);
  const skills = [...new Set(stations.flatMap((s) => s.tags))];

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(hero.name)} — résumé</title>
<meta name="description" content="${esc(hero.role)}. ${esc(finale.paragraph)}">
<style>
  :root { color-scheme: light; }
  body {
    margin: 0 auto; padding: 48px 24px 96px; max-width: 46rem;
    font: 16px/1.55 ui-sans-serif, system-ui, sans-serif;
    color: #23262b; background: #f6f6f7;
  }
  a { color: #96482f; }
  header { margin-bottom: 36px; }
  h1 { margin: 0 0 6px; font-size: 2.2rem; letter-spacing: -0.03em; }
  .subtitle { margin: 0; font-size: 1.05rem; color: #43474d; }
  h2 {
    margin: 40px 0 14px; font-size: 0.78rem; letter-spacing: 0.18em;
    text-transform: uppercase; color: #74797f;
    border-bottom: 1px solid rgba(35,38,43,0.14); padding-bottom: 7px;
  }
  h3 { margin: 0; font-size: 1.1rem; letter-spacing: -0.01em; }
  .entry { margin-bottom: 28px; }
  .role { margin: 3px 0 0; font-weight: 600; color: #4c5157; }
  .meta { margin: 2px 0 0; font-size: 0.85rem; color: #8b8f96; }
  ul { margin: 10px 0 0; padding-left: 1.1rem; }
  li { margin-bottom: 5px; }
  .tags { margin: 9px 0 0; font-size: 0.8rem; color: #96482f; }
  .tags span:not(:last-child)::after { content: ' · '; color: #b9bcc1; }
  .contact { list-style: none; margin: 0; padding: 0; }
  .contact li { margin-bottom: 4px; }
  .label {
    display: inline-block; min-width: 6.5rem; font-size: 0.75rem;
    letter-spacing: 0.14em; text-transform: uppercase; color: #8b8f96;
  }
  footer { margin-top: 48px; font-size: 0.85rem; color: #74797f; }
  @media print {
    body { background: #fff; padding: 0; max-width: none; font-size: 11pt; }
    h2 { margin-top: 22px; }
    .entry { page-break-inside: avoid; }
    footer { display: none; }
  }
</style>
</head>
<body>

<header>
  <h1>${esc(hero.name)}</h1>
  <p class="subtitle">${esc(hero.role)}</p>
</header>

<section>
  <h2>Contact</h2>
  <ul class="contact">
${finale.board.rows.map(contactRow).join('\n')}
  </ul>
</section>

<section>
  <h2>Summary</h2>
  <p>${esc(finale.paragraph)}</p>
</section>

<section>
  <h2>Experience</h2>
${experience.map(entry).join('\n')}
</section>

<section>
  <h2>Education</h2>
${education.map(entry).join('\n')}
</section>

<section>
  <h2>Recognition</h2>
  <ul>
${finale.credits.map((c) => `    <li>${esc(c)}</li>`).join('\n')}
  </ul>
</section>

<section>
  <h2>Skills</h2>
  <p>${skills.map(esc).join(' · ')}</p>
</section>

<footer>
  <a href="../">Back to the scroll-driven version</a>
</footer>

</body>
</html>
`;
}
