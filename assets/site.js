// The one place the domain lives. John is still buying it, so change it here and
// nowhere else. scripts/release.mjs reads this line too, for the Atom feed.
window.SITE = 'mergetel.github.io/bfpi';

(() => {
  const SENTENCE = 'Bug fixes and performance improvements.';
  window.SENTENCE = SENTENCE;

  // The site root, worked out from where this script was loaded. On GitHub Pages
  // without a custom domain that's /bfpi/, with one it's /.
  const BASE = new URL('..', document.currentScript.src).pathname;
  window.BASE = BASE;

  const here = location.pathname.replace(/index\.html$/, '');
  const link = (path, text, cls) =>
    `<a href="${BASE}${path}"${cls ? ` class="${cls}"` : ''}${here === BASE + path ? ' aria-current="page"' : ''}>${text}</a>`;

  const nav = document.getElementById('nav');
  if (nav) {
    nav.innerHTML = `
      <div class="wrap navbar">
        <a class="brand" href="${BASE}" aria-label="BFPI home">
          <span class="mark" aria-hidden="true">✓</span><span>BFPI</span>
        </a>
        <nav aria-label="Main">
          ${link('', 'Product', 'home')}
          ${link('pricing/', 'Pricing')}
          ${link('changelog/', 'Changelog')}
          ${link('card/', 'Share card')}
        </nav>
        <a class="btn btn-primary btn-sm" href="${BASE}#try">Start free</a>
      </div>`;
  }

  const foot = document.getElementById('foot');
  if (foot) {
    foot.innerHTML = `
      <div class="wrap">
        <section class="john" aria-labelledby="why">
          <h2 id="why">Why this exists</h2>
          <p>I've written "bug fixes and performance improvements" myself. More than once. Usually late, after the real work was done, when telling anyone about it felt like a second job I hadn't applied for.</p>
          <p>And the work was real every time. Somebody fixed the bug a customer had complained about for a month, and that customer never heard, because the release note said what they all say.</p>
          <p>So I built <a href="https://merge.tel">merge.tel</a>. It reads the pull requests your team merges and writes the customer update for you, the kind that says what changed. I use it every day on merge.tel and my other projects.</p>
          <p>This site ships a release on its own every day, and every one of them says the same sentence. It's the most consistent thing I've ever shipped.</p>
        </section>
        <div class="footbar">
          <p>BFPI is a parody. The companies, logos, people and quotes on it are made up. No changelog has ever been read.</p>
          <p><a href="${BASE}changelog.xml">Atom feed</a> · <a href="${BASE}pricing/">Pricing</a> · <a href="https://merge.tel">merge.tel</a></p>
        </div>
      </div>`;
  }

  document.querySelectorAll('[data-site]').forEach((el) => { el.textContent = window.SITE; });
})();
