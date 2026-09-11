# Assets and Performance

Themes are the largest single factor in Core Web Vitals. Targets on mobile Lighthouse
for home, single, and archive: **LCP < 2.5 s, INP < 200 ms, CLS < 0.1**.

## Contents

- Enqueue rules
- Loading strategy: defer, async, footer
- Conditional loading
- CSS strategy
- Fonts
- Images
- JavaScript budget
- Queries and caching
- Build pipeline
- Measuring

---

## Enqueue rules

All assets go through the API, on the right hook, with dependencies and a version.

```php
function pfx_enqueue_assets() {
	$ver = PFX_VERSION; // wp_get_theme()->get( 'Version' ); bump on every release.

	wp_enqueue_style( 'pfx-main', get_theme_file_uri( 'assets/css/main.css' ), array(), $ver );
	wp_style_add_data( 'pfx-main', 'rtl', 'replace' ); // loads main-rtl.css automatically for RTL locales

	wp_enqueue_script(
		'pfx-navigation',
		get_theme_file_uri( 'assets/js/navigation.js' ),
		array(),
		$ver,
		array( 'strategy' => 'defer', 'in_footer' => true )
	);

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'pfx_enqueue_assets' );
```

| Hook | Use for |
| --- | --- |
| `wp_enqueue_scripts` | front-end CSS/JS |
| `enqueue_block_editor_assets` | editor-only JS/CSS (editor UI) |
| `enqueue_block_assets` | CSS needed in both editor canvas and front end |
| `admin_enqueue_scripts` (check `$hook_suffix`) | theme admin page only |
| `login_enqueue_scripts` | login page (plugin territory, usually) |
| `init` with `wp_enqueue_block_style()` | per-block CSS loaded only when the block renders |

- Handles prefixed; third-party libs keep their own handle (`swiper`) and version.
- `get_theme_file_uri()` / `get_theme_file_path()` are child-theme aware; use them.
- Never bundle jQuery, React, lodash, or other core-shipped libraries; declare
  `array( 'jquery' )` as a dependency instead. Never deregister core jQuery.
- Register (`wp_register_*`) in one place, enqueue conditionally elsewhere.
- Styles for the editor: `add_editor_style( 'assets/css/editor.css' )` in setup.

---

## Loading strategy: defer, async, footer

`wp_enqueue_script()` fifth argument (WP 6.3+):

| Value | Effect | Use for |
| --- | --- | --- |
| `array( 'strategy' => 'defer' )` | downloads in parallel, executes after parse, in order | almost all theme JS (navigation, sliders, interactions) |
| `array( 'strategy' => 'async' )` | executes as soon as downloaded, any order | independent scripts with no DOM dependency (analytics, which belong in a plugin anyway) |
| `array( 'in_footer' => true )` | printed before `</body>` | legacy fallback; combine with defer |
| `true` (bool) | same as `in_footer => true` | pre-6.3 compatibility |

- A deferred script's dependents inherit the strategy only if they are compatible; core
  handles this. Do not mix `async` with dependency chains.
- Inline scripts added with `wp_add_inline_script( $handle, $js, 'after' )` on a
  deferred script are printed as `after`-type and run after the deferred script.
- Do not add `defer` by filtering `script_loader_tag`; use the API.
- Module scripts (`wp_enqueue_script_module()`, WP 6.5+) for ES modules and the
  Interactivity API; they are deferred by default.

---

## Conditional loading

Load only what the page needs. This is the single biggest win.

```php
if ( is_front_page() ) {
	wp_enqueue_script( 'pfx-hero', ... );
}
if ( is_singular( 'pfx_project' ) ) {
	wp_enqueue_style( 'pfx-project', ... );
}
if ( has_block( 'core/gallery' ) ) {
	wp_enqueue_script( 'pfx-lightbox', ... );
}
```

- Block themes: `wp_enqueue_block_style()` (with `path`) makes core inline block CSS
  only when the block is present. Use it for every block you restyle heavily.
- `has_block()` / `has_shortcode()` for feature scripts.
- Dequeue core assets only when certain: `wp_dequeue_style( 'wp-block-library-theme' )`
  is common when your theme fully styles core blocks; `classic-theme-styles` for block
  themes. Never dequeue `wp-block-library` on the front end unless every block is styled.
- `should_load_separate_core_block_assets` is `true` for block themes automatically
  (only used blocks' CSS is loaded); enable for classic:
  `add_filter( 'should_load_separate_core_block_assets', '__return_true' );`.
- Emoji and oEmbed script removal is plugin territory for wp.org; document it if you do
  it in a client theme.

---

## CSS strategy

- One main stylesheet, minified, under ~50 KB gzipped for most sites. Split per template
  or per block beyond that.
- Prefer `theme.json` for design tokens so core generates the variables and per-block
  styles; your CSS then references `var(--wp--preset--*)`.
- Critical CSS: for client sites with strict LCP targets, inline above-the-fold CSS for
  the header/hero via `wp_add_inline_style( 'pfx-main', $critical )` **or** let a
  performance plugin/host do it. Keep the theme simple; do not hand-roll critical-CSS
  extraction in PHP.
- Avoid `@import` in CSS (serial requests). Use the build step or enqueue dependencies.
- No unused frameworks: shipping all of Bootstrap/Tailwind unpurged is a review and
  performance failure. Purge or write custom CSS.
- Layout shift: set `aspect-ratio` on media containers, reserve space for embeds and ads,
  never inject content above existing content on load.
- Content-visibility: `content-visibility: auto` on long below-fold sections (footers,
  comment lists) is a cheap win.
- RTL: `wp_style_add_data( handle, 'rtl', 'replace' )` with a generated `-rtl.css`, or
  logical properties so no separate file is needed.

---

## Fonts

- Self-host in `assets/fonts/`, WOFF2 only, variable fonts where possible, subset to the
  needed scripts (Latin, Latin-ext, Arabic, …).
- Declare in `theme.json` `fontFace` (core prints `@font-face`) or in CSS with
  `font-display: swap` (or `optional` for body text on strict CLS budgets).
- Preload only the one or two font files used above the fold:
  ```php
  function pfx_preload_fonts() {
  	printf( '<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' . "\n", esc_url( get_theme_file_uri( 'assets/fonts/inter-variable.woff2' ) ) );
  }
  add_action( 'wp_head', 'pfx_preload_fonts', 1 );
  ```
- Use `size-adjust` / fallback font metrics in `@font-face` to reduce CLS during swap.
- No Google Fonts `<link>` on the front end (privacy, extra connection). If a client
  insists on Google Fonts, load through the Font Library (which downloads locally).
- Max two families, ideally one variable font.

---

## Images

- Always `wp_get_attachment_image( $id, 'size', false, array( 'class' => '...' ) )` or
  `the_post_thumbnail( 'size' )`; never build `<img>` by hand. Core adds `srcset`,
  `sizes`, `width`/`height`, `loading="lazy"`, `decoding="async"`.
- Register sizes that match the design: `add_image_size( 'pfx-card', 640, 400, true )`.
  Do not register sizes you do not use (each costs disk and upload time). Expose them in
  the editor with `image_size_names_choose` only if editors need them.
- The LCP image (hero, first featured image) must **not** be lazy-loaded:
  ```php
  the_post_thumbnail( 'pfx-hero', array( 'loading' => 'eager', 'fetchpriority' => 'high' ) );
  ```
  In block markup, core auto-detects the first image in many cases (`wp_get_loading_optimization_attributes`);
  verify in DevTools.
- Correct `sizes` attribute: filter `wp_calculate_image_sizes` or pass `'sizes'` so the
  browser picks the right candidate. Default `(max-width: 640px) 100vw, 640px` is often
  wrong for full-width heroes.
- Modern formats: core generates WebP/AVIF when the host supports it (6.5+ AVIF). Do
  not implement conversion in the theme.
- Theme-owned images (`assets/images/`) optimised and sized; SVG inline from a fixed
  icon map, never from uploads.
- Placeholder/backgrounds: CSS gradients over images where possible.

---

## JavaScript budget

- A theme should ship < 30 KB of its own JS. Navigation toggle, maybe a slider,
  maybe a lightbox (core has one for images: `settings.lightbox`).
- Vanilla JS, no jQuery dependency for new code. If jQuery is needed for a plugin,
  it is already loaded; do not load a second copy.
- One deferred bundle or a few small deferred files; avoid ten separate requests.
- Use `IntersectionObserver` for on-scroll effects; never scroll listeners without
  throttling.
- Respect `prefers-reduced-motion` in animations.
- Long tasks kill INP: avoid heavy work on `DOMContentLoaded`; split with
  `requestIdleCallback` / `setTimeout`.
- Third-party embeds (maps, video) load lazily behind a facade/click.

---

## Queries and caching

- Never query in a loop (N+1). Use `WP_Query` args, `update_post_meta_cache`,
  `_prime_post_caches()`, or fetch IDs then batch.
- `no_found_rows => true` when not paginating; `fields => 'ids'` when only IDs are
  needed.
- Cache expensive computed data in transients (prefixed) with invalidation on
  `save_post`/`edited_term`; object cache (`wp_cache_*`) for per-request memoisation.
- `get_option()` for autoloaded options is free; `get_theme_mod()` is one autoloaded
  option; do not add many options.
- Avoid `posts_per_page => -1`. Cap at a sane number.
- Check with Query Monitor: theme code should add zero duplicate queries and no query
  > 50 ms.

---

## Build pipeline

Keep it optional and boring. Two accepted setups:

1. **No build**: plain CSS with custom properties, plain JS with modules. Ship as-is.
   Minify manually or via host. Simplest for hand-off.
2. **`@wordpress/scripts`**: `wp-scripts build` compiles `src/*.js` and `src/*.scss`
   (or PostCSS) into `build/` with sourcemaps, lints JS/CSS, and provides `start`
   (watch). Commit `build/` so hosts without Node still deploy, or build in CI.
   ```json
   "scripts": {
   	"start": "wp-scripts start --webpack-src-dir=assets/src --output-path=assets/build",
   	"build": "wp-scripts build --webpack-src-dir=assets/src --output-path=assets/build",
   	"lint:js": "wp-scripts lint-js assets/src",
   	"lint:css": "wp-scripts lint-style 'assets/src/**/*.scss'",
   	"lint:php": "composer run lint",
   	"packages-update": "wp-scripts packages-update",
   	"plugin-zip": "wp-scripts plugin-zip"
   }
   ```
   Tailwind is acceptable if purged against theme files and `theme.json` presets are
   mirrored into the Tailwind config (or generated from it); otherwise you get two
   sources of truth.
- Ship unminified sources next to minified files (review rule).
- Enqueue the built file with `asset.php` metadata when using wp-scripts:
  ```php
  $asset = require get_theme_file_path( 'assets/build/main.asset.php' );
  wp_enqueue_script( 'pfx-main', get_theme_file_uri( 'assets/build/main.js' ), $asset['dependencies'], $asset['version'], array( 'strategy' => 'defer' ) );
  ```

---

## Measuring

- Lighthouse (mobile, throttled) on home, single post, archive, and the heaviest
  landing page; record before/after.
- Chrome DevTools Performance panel for INP: look for long tasks from theme JS.
- WebPageTest filmstrip for LCP element identification.
- Query Monitor for PHP time, queries, hooks, and enqueued assets per page.
- `SCRIPT_DEBUG` true during development so you see unminified core assets and errors.
- Test with caching disabled first (true cost), then with the host cache.
