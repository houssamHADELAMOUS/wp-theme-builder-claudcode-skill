# Block (FSE) Theme Development

Block themes are built from HTML block markup, `theme.json`, and patterns. PHP is
limited to `functions.php`, `inc/`, and pattern files. See [theme-json.md](theme-json.md)
for the configuration side.

## Contents

- Required files and folders
- Templates and the block template hierarchy
- Template parts
- Block markup rules
- Patterns
- functions.php for block themes
- Styling blocks (theme.json vs CSS)
- Style variations
- Fonts
- Locking and client-proofing
- Custom blocks and the Interactivity API
- Common mistakes

---

## Required files and folders

Minimum: `style.css` (headers) + `templates/index.html`. In practice also `theme.json`,
`readme.txt`, `screenshot.png`, `functions.php`.

```
templates/   full-page block templates (HTML)
parts/       reusable template parts: header, footer, sidebar, comments, post-meta
patterns/    PHP files with a header comment; auto-registered since WP 6.0
styles/      style variations (JSON), plus styles/blocks/ and styles/sections/
```

---

## Templates and the block template hierarchy

Block templates follow the same hierarchy as classic templates, with `.html` instead of
`.php`. Most specific wins.

| Page | Lookup order (first found wins) |
| --- | --- |
| Front page (static) | `front-page.html` → `page-{slug}.html` → `page-{id}.html` → `page.html` → `singular.html` → `index.html` |
| Front page (posts) | `front-page.html` → `home.html` → `index.html` |
| Blog index | `home.html` → `index.html` |
| Single post | `single-{post-type}-{slug}.html` → `single-{post-type}.html` → `single.html` → `singular.html` → `index.html` |
| Page | `page-{slug}.html` → `page-{id}.html` → `page.html` → `singular.html` → `index.html` |
| Category | `category-{slug}.html` → `category-{id}.html` → `category.html` → `archive.html` → `index.html` |
| Tag | `tag-{slug}.html` → `tag.html` → `archive.html` → `index.html` |
| Custom taxonomy | `taxonomy-{tax}-{term}.html` → `taxonomy-{tax}.html` → `taxonomy.html` → `archive.html` → `index.html` |
| CPT archive | `archive-{post-type}.html` → `archive.html` → `index.html` |
| Author | `author-{nicename}.html` → `author-{id}.html` → `author.html` → `archive.html` → `index.html` |
| Date | `date.html` → `archive.html` → `index.html` |
| Search | `search.html` → `index.html` |
| 404 | `404.html` → `index.html` |
| Attachment | `{mime}.html` → `attachment.html` → `single.html` → ... |
| Privacy policy page | `privacy-policy.html` → page hierarchy |

A sensible starter set: `index`, `home`, `front-page` (only if the front page design
differs), `singular` (or `single` + `page`), `archive`, `search`, `404`.

**Custom templates** (selectable in the editor) are declared in `theme.json`:
```json
"customTemplates": [
	{ "name": "page-landing", "title": "Landing Page", "postTypes": [ "page" ] },
	{ "name": "single-no-sidebar", "title": "No Sidebar", "postTypes": [ "post", "page" ] }
]
```
with matching `templates/page-landing.html`.

Typical `templates/index.html`:
```html
<!-- wp:template-part {"slug":"header","area":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">
	<!-- wp:query {"queryId":1,"query":{"perPage":10,"inherit":true},"tagName":"div"} -->
	<div class="wp-block-query">
		<!-- wp:post-template {"layout":{"type":"default"}} -->
			<!-- wp:post-title {"isLink":true,"level":2} /-->
			<!-- wp:post-featured-image {"isLink":true} /-->
			<!-- wp:post-excerpt /-->
		<!-- /wp:post-template -->
		<!-- wp:query-pagination -->
			<!-- wp:query-pagination-previous /-->
			<!-- wp:query-pagination-numbers /-->
			<!-- wp:query-pagination-next /-->
		<!-- /wp:query-pagination -->
		<!-- wp:query-no-results -->
			<!-- wp:pattern {"slug":"my-theme/no-results"} /-->
		<!-- /wp:query-no-results -->
	</div>
	<!-- /wp:query -->
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","area":"footer","tagName":"footer"} /-->
```

- Always `"inherit":true` on the main archive/index Query Loop so pagination, search,
  and archives work.
- Exactly one `<main>` (via `tagName`), use `header`/`footer` `tagName` on template
  parts for landmarks.

---

## Template parts

`parts/header.html`, `parts/footer.html`, etc. Register them with an area in
`theme.json` so the Site Editor groups them and the correct HTML tag is applied:

```json
"templateParts": [
	{ "name": "header", "title": "Header", "area": "header" },
	{ "name": "footer", "title": "Footer", "area": "footer" },
	{ "name": "sidebar", "title": "Sidebar", "area": "uncategorized" },
	{ "name": "post-meta", "title": "Post Meta", "area": "uncategorized" }
]
```

Reference: `<!-- wp:template-part {"slug":"header","area":"header","tagName":"header"} /-->`.

Header essentials:
```html
<!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group">
	<!-- wp:group {"layout":{"type":"flex","justifyContent":"space-between"}} -->
	<div class="wp-block-group">
		<!-- wp:site-logo {"width":120} /-->
		<!-- wp:site-title {"level":0} /-->
		<!-- wp:navigation {"overlayMenu":"mobile","ariaLabel":"Primary"} /-->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
```

- `site-title` with `"level":0` renders a `<p>` so the page `<h1>` stays the post title.
- Navigation block handles mobile overlay, keyboard, and ARIA. Do not hand-roll menus.
- Do not put user-facing literal text in parts; it is not translatable. Use patterns
  with `esc_html_e()` if text must be translated, or leave text to the site owner.

---

## Block markup rules

- Every block is delimited by HTML comments: `<!-- wp:namespace/name {attrs} -->` ...
  `<!-- /wp:namespace/name -->`. Self-closing: `<!-- wp:name {attrs} /-->`. Core blocks
  omit the `core/` namespace in markup.
- Attributes are valid JSON, double quotes only.
- The inner HTML must match what the block would serialize: classes like
  `wp-block-group`, `has-text-align-center`, `has-primary-color has-text-color`,
  `alignwide`, style attributes generated from attrs. Easiest reliable way: build the
  layout in the Site Editor, copy the code (Options → Code editor), paste into the file.
- Mismatched markup produces "This block contains unexpected or invalid content" in the
  editor and fails theme review.
- Never leave text outside a block comment at the template root.
- Use `{"layout":{"type":"constrained"}}` on wrapping groups so `contentSize`/`wideSize`
  from `theme.json` apply.
- Prefer preset slugs over literal values in attributes: `"backgroundColor":"primary"`
  not `"style":{"color":{"background":"#0055aa"}}`.
- Spacing: `"style":{"spacing":{"padding":{"top":"var:preset|spacing|50"}}}`.

---

## Patterns

Files in `patterns/` are auto-registered. Header comment fields:

```php
<?php
/**
 * Title: Hero with call to action
 * Slug: my-theme/hero-cta
 * Categories: my-theme, banner
 * Keywords: hero, cta, intro
 * Block Types: core/post-content
 * Post Types: page, wp_template
 * Template Types: front-page, home
 * Viewport Width: 1400
 * Inserter: yes
 * Description: Full-width hero with heading, text, and two buttons.
 */

?>
<!-- wp:cover {"dimRatio":50,"overlayColor":"contrast","minHeight":60,"minHeightUnit":"vh","align":"full","layout":{"type":"constrained"}} -->
<div class="wp-block-cover alignfull" style="min-height:60vh">
	<span aria-hidden="true" class="wp-block-cover__background has-contrast-background-color has-background-dim"></span>
	<div class="wp-block-cover__inner-container">
		<!-- wp:heading {"textAlign":"center","level":1} -->
		<h1 class="wp-block-heading has-text-align-center"><?php esc_html_e( 'Welcome to our site', 'my-theme' ); ?></h1>
		<!-- /wp:heading -->
		<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
		<div class="wp-block-buttons">
			<!-- wp:button -->
			<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#"><?php esc_html_e( 'Get started', 'my-theme' ); ?></a></div>
			<!-- /wp:button -->
		</div>
		<!-- /wp:buttons -->
	</div>
</div>
<!-- /wp:cover -->
```

Rules:
- `Slug` must be `theme-slug/name`.
- Register your own category on `init`:
  ```php
  register_block_pattern_category( 'my-theme', array( 'label' => __( 'My Theme', 'my-theme' ), 'description' => __( 'Patterns for My Theme.', 'my-theme' ) ) );
  ```
- Image URLs: `<?php echo esc_url( get_theme_file_uri( 'assets/images/hero.jpg' ) ); ?>`.
  Never hard-code paths.
- `Inserter: no` for patterns used only inside templates (e.g. 404 content, no-results),
  keeps the inserter clean.
- Patterns used in templates: `<!-- wp:pattern {"slug":"my-theme/hero-cta"} /-->` (rendered
  once on template load; becomes normal blocks in the editor).
- Ship 10-20 patterns for a client theme: hero, features grid, testimonials, CTA,
  pricing, team, FAQ, contact, posts grid, footer variants, 404 content, no-results.
- Opt out of remote wp.org patterns if the client should only see theme patterns:
  `remove_theme_support( 'core-block-patterns' );` and
  `add_filter( 'should_load_remote_block_patterns', '__return_false' );`.

---

## functions.php for block themes

```php
<?php
/**
 * My Theme functions.
 *
 * @package My_Theme
 */

defined( 'ABSPATH' ) || exit;

define( 'PFX_VERSION', wp_get_theme()->get( 'Version' ) );

/**
 * Theme setup.
 */
function pfx_setup() {
	// Most supports come from theme.json. These still need PHP:
	add_theme_support( 'wp-block-styles' );      // optional opinionated core block styles
	add_theme_support( 'editor-styles' );
	add_editor_style( 'assets/css/editor.css' ); // only if you have editor-only CSS
	add_theme_support( 'post-thumbnails' );      // implied for block themes but explicit is fine
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'html5', array( 'comment-list', 'comment-form', 'search-form', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' ) );
	// No register_nav_menus, no register_sidebar, no custom-logo/header/background: blocks handle these.
}
add_action( 'after_setup_theme', 'pfx_setup' );

/**
 * Front-end styles and scripts.
 */
function pfx_enqueue_assets() {
	wp_enqueue_style( 'pfx-style', get_stylesheet_uri(), array(), PFX_VERSION );
	wp_enqueue_script( 'pfx-main', get_theme_file_uri( 'assets/js/main.js' ), array(), PFX_VERSION, array( 'strategy' => 'defer', 'in_footer' => true ) );
}
add_action( 'wp_enqueue_scripts', 'pfx_enqueue_assets' );

/**
 * Per-block styles: loaded only when the block renders.
 */
function pfx_enqueue_block_styles() {
	$blocks = array( 'core/button', 'core/quote', 'core/navigation' );
	foreach ( $blocks as $block ) {
		$slug = str_replace( 'core/', '', $block );
		wp_enqueue_block_style(
			$block,
			array(
				'handle' => 'pfx-block-' . $slug,
				'src'    => get_theme_file_uri( 'assets/css/blocks/' . $slug . '.css' ),
				'path'   => get_theme_file_path( 'assets/css/blocks/' . $slug . '.css' ),
				'ver'    => PFX_VERSION,
			)
		);
	}
}
add_action( 'init', 'pfx_enqueue_block_styles' );

/**
 * Block styles (variations selectable in the editor).
 */
function pfx_register_block_styles() {
	register_block_style(
		'core/button',
		array(
			'name'  => 'pfx-outline',
			'label' => __( 'Outline', 'my-theme' ),
		)
	);
}
add_action( 'init', 'pfx_register_block_styles' );

/**
 * Pattern categories.
 */
function pfx_register_pattern_categories() {
	register_block_pattern_category(
		'my-theme',
		array( 'label' => __( 'My Theme', 'my-theme' ) )
	);
}
add_action( 'init', 'pfx_register_pattern_categories' );
```

- `wp_enqueue_block_style()` with a `path` lets core inline small block CSS and only
  load it when the block is on the page.
- Block styles can also be registered from `styles/blocks/*.json` (WP 6.6+) without PHP,
  which is preferred for style-only variations.
- Editor-only tweaks: enqueue on `enqueue_block_editor_assets`. Assets needed in both
  editor and front end: `enqueue_block_assets`.

---

## Styling blocks (theme.json vs CSS)

Order of preference:
1. `theme.json` `styles.blocks["core/x"]` for colour, typography, spacing, border,
   dimensions, and (WP 7.0) `:hover`/`:focus`/`:active`/`:focus-visible` states.
2. `theme.json` `styles.css` (root) or `styles.blocks["core/x"].css` for small custom CSS
   with `&` nesting (WP 6.2+).
3. `wp_enqueue_block_style()` per-block stylesheet for larger block-specific CSS.
4. `style.css` / global stylesheet for layout utilities and anything not block-scoped.

Never fight core with `!important`. If core's CSS wins over yours, you are targeting the
wrong selector or should use `theme.json`.

---

## Style variations

`styles/dark.json`:
```json
{
	"$schema": "https://schemas.wp.org/trunk/theme.json",
	"version": 3,
	"title": "Dark",
	"settings": {
		"color": {
			"palette": [
				{ "slug": "base", "color": "#111111", "name": "Base" },
				{ "slug": "contrast", "color": "#ffffff", "name": "Contrast" }
			]
		}
	},
	"styles": {
		"color": { "background": "var(--wp--preset--color--base)", "text": "var(--wp--preset--color--contrast)" }
	}
}
```

- Keep slugs identical across variations (`base`, `contrast`, `primary`, ...) so
  templates and patterns work under every variation.
- Section styles (`styles/sections/*.json` with `"blockTypes": ["core/group"]`) and
  block-style variations (`styles/blocks/*.json`) let users apply alternative looks to
  groups/blocks (WP 6.6+).
- Variations are also the multi-brand tool: one theme, N brands.

---

## Fonts

Declare in `theme.json` `settings.typography.fontFamilies[].fontFace` and ship the
files in `assets/fonts/`. Core prints `@font-face` for you and the Font Library lets
site owners add more. Use `font-display: swap`, WOFF2 only, subset if possible.

```json
{
	"fontFamily": "\"Inter\", sans-serif",
	"slug": "inter",
	"name": "Inter",
	"fontFace": [
		{ "fontFamily": "Inter", "fontWeight": "400 700", "fontStyle": "normal", "fontDisplay": "swap", "src": [ "file:./assets/fonts/inter-variable.woff2" ] }
	]
}
```

Never load fonts from Google on the front end without consent (GDPR); self-host.

---

## Locking and client-proofing

- Lock a template part or group so clients cannot remove/move inner blocks:
  `<!-- wp:group {"templateLock":"all"} -->` (`"all"`, `"insert"`, or `"contentOnly"`).
- `"contentOnly"` is the best client mode: they can edit text/images but not structure.
  Since WP 7.0 patterns default to content-only editing in the inserter.
- Individual blocks: `"lock":{"move":true,"remove":true}`.
- Restrict Global Styles: set `settings.color.custom: false`,
  `settings.typography.customFontSize: false`, `settings.spacing.customSpacingSize: false`,
  `defaultPalette: false`, `defaultGradients: false`, so clients pick from your presets
  only.
- Limit the block inserter with `allowed_block_types_all` filter (in the companion
  plugin, since it is behaviour rather than presentation, though themes commonly do it).
- Use Pattern Overrides / synced patterns for repeated components with editable fields.

---

## Custom blocks and the Interactivity API

Custom blocks (`register_block_type`, `block.json`, React/Interactivity API) belong in
the **companion plugin**, never in the theme (review rule and portability). The theme
styles them via `theme.json` `styles.blocks["pfx/card"]` and may ship patterns that use
them, guarded so the pattern still renders if the plugin is off.

block.json must be `"apiVersion": 3` (mandatory from WP 7.0).

---

## Common mistakes

- Query Loop without `"inherit":true` on archive templates → pagination broken.
- Hard-coded text in `templates/`/`parts/` → not translatable, not editable.
- Literal hex colours in markup instead of preset slugs → variations do not apply.
- Missing `templateParts` area registration → header renders as `div`, no landmark.
- Copying block markup by hand and mistyping classes → invalid block warnings.
- Registering nav menus/sidebars in a block theme → unused, confusing.
- Enqueuing one giant `style.css` with all block overrides → slower than
  `wp_enqueue_block_style()` per block.
- Forgetting `styles/` variation slugs must match base `theme.json` slugs.
- Loading Google Fonts via `<link>` → privacy and review failure.
