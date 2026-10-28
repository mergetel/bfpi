# Bug fixes and performance improvements

A straight-faced SaaS landing page for BFPI, a release notes summarizer. You paste any changelog of any length, press Summarize, watch a progress bar analyze 4,812 tokens, and get back "Bug fixes and performance improvements." Every time.

It's a parody, and a satire site for [merge.tel](https://merge.tel), which writes the customer update that actually says what changed.

## What's here

| Path | What it is |
|---|---|
| `index.html` | The landing page and the summarizer, plus made-up logos and testimonials |
| `pricing/` | Free gets "Bug fixes." Pro adds "and performance improvements." Enterprise adds "and stability", and Contact sales opens a modal that only knows that sentence |
| `card/` | The share card generator. It draws a 1200x630 PNG in a canvas, with a stamp and a parody strip baked into the image. The product name and a seed live in the URL hash, so every card is a permalink |
| `changelog/` | The product's own changelog, read from `data/changelog.json` |
| `changelog.xml` | A real Atom feed that says the same sentence forever |
| `launch-week/vN/` | Written by the release script on every major |
| `assets/site.js` | The domain constant, plus the nav and the "Why this exists" footer every page shares |
| `scripts/release.mjs` | Cuts a release. No dependencies |
| `.github/workflows/release.yml` | Runs the release every day, merges it, then deploys |
| `.github/workflows/pages.yml` | Publishes the site to GitHub Pages |

There's no build step, no framework, no database and no `package.json`.

## Run it

The pages fetch `data/changelog.json`, which a browser won't do from a file opened straight off disk. Serve the folder instead:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

The site is on GitHub Pages at https://mergetel.github.io/bfpi/. In Settings, Pages, the source has to be "GitHub Actions". `pages.yml` then publishes on every push to `main`, and only the site files go up. `scripts/`, `.github/` and the README stay in the repo.

The daily release deploys too. Its merge is made with the workflow's own token, and GitHub doesn't start other workflows from that, so `release.yml` calls `pages.yml` itself once the PR has merged.

Every link is relative, and `assets/site.js` works out the site root from its own URL, so the same files work under `/bfpi/` now and at `/` once there's a custom domain. `404.html` is the exception, since Pages serves it at whatever path was missing. It works out the root from the hostname instead.

## Set the domain

The address lives in one place, the `window.SITE` line at the top of `assets/site.js`. It's `mergetel.github.io/bfpi` until a domain is bought. The share card, the copyable post and the API snippet read it in the browser, and `scripts/release.mjs` reads the same line to write the feed.

To move to a real domain:

1. Point its DNS at GitHub Pages (an `ALIAS` or `A` records for an apex domain, a `CNAME` to `mergetel.github.io` for a subdomain).
2. Enter it in Settings, Pages, Custom domain, and tick "Enforce HTTPS" once the certificate is issued.
3. Change `window.SITE` to the bare domain, then rewrite the feed so its links follow:

```sh
node scripts/release.mjs --feed-only
```

The next daily release would rewrite the feed anyway. No CNAME file is needed, because an Actions deploy takes the domain from the setting.

## The daily release

`.github/workflows/release.yml` runs at 15:17 UTC every day. It calls `scripts/release.mjs`, which picks the bump from the calendar:

- a major on the 1st of the month, which also writes a Launch Week page
- a minor on Mondays
- a patch on every other day

The script appends a "Bug fixes and performance improvements." entry to `data/changelog.json` and rewrites `changelog.xml`. The workflow then pushes a `release/vX.Y.Z` branch, opens a PR titled `vX.Y.Z`, squash merges it and deploys. It tries auto-merge first and merges directly if the repo has auto-merge off. If today already has a release, it does nothing.

Two repo settings have to be on, or the PR step fails:

1. Settings, Actions, General, Workflow permissions: "Read and write permissions", and tick "Allow GitHub Actions to create and approve pull requests". The org may have to allow this first.
2. If `main` is protected, the protection has to let `github-actions[bot]` merge.

To run it by hand, use "Run workflow" on the Actions tab. The `kind` input forces a patch, minor or major and skips the once-a-day check. Locally:

```sh
node scripts/release.mjs --date=2026-11-01   # what a given day would do
node scripts/release.mjs --kind=major        # force one
```

Both write to the working tree, so reset afterwards if you only wanted a look.

## Rules

Everything on the site is made up, including the companies, logos, people and quotes. None of them is meant to be a real one. The share card carries a stamp and a "Parody. Not real release notes." strip inside the PNG, so a cropped screenshot still says it's a joke. Nothing on the site collects an email address.
