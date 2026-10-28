#!/usr/bin/env node
// Cuts today's release: bumps the version, appends the sentence to
// data/changelog.json, rewrites changelog.xml, and on a major writes a launch
// week page. The daily workflow runs it, then opens and merges the PR.
//
//   node scripts/release.mjs                 today's release, kind from the calendar
//   node scripts/release.mjs --kind=major    force a kind (also skips the once-a-day check)
//   node scripts/release.mjs --date=2026-11-01
//   node scripts/release.mjs --feed-only     rewrite changelog.xml, say after a domain change
//
// The calendar: a major on the 1st of the month, a minor on Mondays, a patch
// every other day.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data/changelog.json');
const FEED = path.join(ROOT, 'changelog.xml');
const SENTENCE = 'Bug fixes and performance improvements.';
const FEED_SIZE = 100;

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));

// The domain lives in assets/site.js and nowhere else.
function siteDomain() {
  const src = fs.readFileSync(path.join(ROOT, 'assets/site.js'), 'utf8');
  const m = src.match(/window\.SITE\s*=\s*'([^']+)'/);
  if (!m) throw new Error("assets/site.js has no window.SITE = '...' line");
  return m[1];
}

function today() {
  if (typeof args.date === 'string') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) throw new Error(`--date must be YYYY-MM-DD, got ${args.date}`);
    return args.date;
  }
  return new Date().toISOString().slice(0, 10);
}

function kindFor(date) {
  const d = new Date(date + 'T12:00:00Z');
  if (d.getUTCDate() === 1) return 'major';
  if (d.getUTCDay() === 1) return 'minor';
  return 'patch';
}

function bump(version, kind) {
  const [ma, mi, pa] = version.split('.').map(Number);
  if (kind === 'major') return `${ma + 1}.0.0`;
  if (kind === 'minor') return `${ma}.${mi + 1}.0`;
  return `${ma}.${mi}.${pa + 1}`;
}

// Stable ids, so a reader never sees the same release twice.
function uuid(name) {
  const h = crypto.createHash('sha1').update('bfpi:' + name).digest('hex');
  return `urn:uuid:${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h[16], 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const xml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const stamp = (date) => `${date}T15:17:00Z`;

function feed(entries, domain) {
  const base = `https://${domain}`;
  const recent = entries.slice(-FEED_SIZE).reverse();
  const items = recent.map((e) => {
    const url = e.launchWeek ? base + e.launchWeek : `${base}/changelog#v${e.version}`;
    const html = `<p>${xml(e.notes)}</p>` + (e.launchWeek ? `<p><a href="${xml(url)}">Launch Week ${xml(e.version.split('.')[0])}</a></p>` : '');
    return `  <entry>
    <title>v${xml(e.version)}</title>
    <link rel="alternate" type="text/html" href="${xml(url)}"/>
    <id>${uuid(e.version)}</id>
    <published>${stamp(e.date)}</published>
    <updated>${stamp(e.date)}</updated>
    <category term="${xml(e.kind)}"/>
    <summary>${xml(e.notes)}</summary>
    <content type="html">${xml(html)}</content>
  </entry>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>BFPI changelog</title>
  <subtitle>A parody changelog. Every release says the same thing.</subtitle>
  <link rel="self" type="application/atom+xml" href="${base}/changelog.xml"/>
  <link rel="alternate" type="text/html" href="${base}/changelog"/>
  <id>${uuid('feed')}</id>
  <updated>${stamp(recent[0].date)}</updated>
  <author><name>BFPI</name><uri>${base}/</uri></author>
  <rights>Parody. Nothing in this feed describes a real change.</rights>
${items}
</feed>
`;
}

function launchWeekPage(version, date) {
  const n = version.split('.')[0];
  const days = [
    ['Monday', 'Bug fixes', 'We fixed bugs. Which ones is between us and the bugs.'],
    ['Tuesday', 'Performance improvements', 'Everything is faster, or it isn\'t slower, depending on how you measure.'],
    ['Wednesday', 'And', 'A conjunction, shipped. Day three is always the hardest.'],
    ['Thursday', 'Stability', 'Enterprise only. Please contact sales, who will tell you what it is.'],
    ['Friday', 'One more thing', SENTENCE],
  ];
  const cards = days.map(([d, t, p], i) => `
        <article class="card day">
          <p class="kicker">Day ${i + 1} · ${d}</p>
          <h2>${xml(t)}</h2>
          <p class="muted">${xml(p)}</p>
        </article>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Launch Week ${n} · BFPI</title>
<meta name="description" content="Launch Week ${n}: five days, five announcements, one sentence. BFPI v${version}. A parody.">
<link rel="alternate" type="application/atom+xml" title="BFPI changelog" href="/changelog.xml">
<link rel="stylesheet" href="/assets/site.css">
<style>
  .lw-hero { padding: 64px 0 36px; }
  .lw-num { font-size: clamp(90px, 22vw, 220px); font-weight: 900; line-height: .9; letter-spacing: -.06em; }
  .days { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }
  .day h2 { font-size: 22px; }
  .day p { margin: 0; }
  .day .kicker { margin-bottom: 14px; }
  @media (max-width: 960px) { .days { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<header id="nav"></header>
<main class="wrap">
  <section class="lw-hero">
    <p class="kicker">v${version} · ${date}</p>
    <div class="lw-num grad">LW${n}</div>
    <h1>Launch Week ${n}.</h1>
    <p class="lede">The biggest release in our history. Five days. Five announcements. We've been working on this one since yesterday.</p>
    <a class="btn btn-primary" href="/changelog#v${version}">See it in the changelog</a>
  </section>
  <section class="days" aria-label="This week's announcements">${cards}
  </section>
  <p class="fine" style="margin:28px 0 12px">Launch Week ${n} is a parody. The workflow that publishes this site wrote this page on its own, the same way it writes every release.</p>
</main>
<footer id="foot"></footer>
<script src="/assets/site.js"></script>
</body>
</html>
`;
}

function setOutput(pairs) {
  const out = process.env.GITHUB_OUTPUT;
  const lines = Object.entries(pairs).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
  if (out) fs.appendFileSync(out, lines);
  else process.stdout.write(lines);
}

const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const domain = siteDomain();

if (args['feed-only']) {
  fs.writeFileSync(FEED, feed(data.entries, domain));
  console.log(`Rewrote changelog.xml for ${domain}.`);
  process.exit(0);
}

const date = today();
const forced = typeof args.kind === 'string' && args.kind ? args.kind : process.env.RELEASE_KIND || '';
if (forced && !['patch', 'minor', 'major'].includes(forced)) throw new Error(`unknown kind: ${forced}`);
const last = data.entries[data.entries.length - 1];

if (!forced && last && last.date >= date) {
  console.log(`Already released v${last.version} on ${last.date}. Nothing to do.`);
  setOutput({ released: 'false' });
  process.exit(0);
}

const kind = forced || kindFor(date);
const version = bump(last ? last.version : '0.0.0', kind);
const entry = { version, date, kind, notes: SENTENCE };

if (kind === 'major') {
  const rel = `/launch-week/v${version.split('.')[0]}/`;
  const dir = path.join(ROOT, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), launchWeekPage(version, date));
  entry.launchWeek = rel;
}

data.entries.push(entry);
fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
fs.writeFileSync(FEED, feed(data.entries, domain));

const body = kind === 'major'
  ? `${SENTENCE}\n\nThis is a major. It's Launch Week ${version.split('.')[0]}, and the page for it is at \`${entry.launchWeek}\`.\n\nThe daily release workflow opened this PR and merges it on its own.`
  : `${SENTENCE}\n\nToday's bump is a ${kind}. The daily release workflow opened this PR and merges it on its own.`;
if (process.env.RUNNER_TEMP) fs.writeFileSync(path.join(process.env.RUNNER_TEMP, 'release-body.md'), body + '\n');

console.log(`Released v${version} (${kind}) on ${date}.`);
setOutput({ released: 'true', version, kind });
