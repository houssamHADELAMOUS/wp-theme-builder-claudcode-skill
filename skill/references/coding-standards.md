# WordPress Coding Standards for Themes

Enforced by PHP_CodeSniffer with the `WordPress` ruleset (WPCS 3.x). Code that fails
PHPCS is not done. See [tooling.md](tooling.md) for setup.

## Contents

- PHP style
- Naming
- File organisation
- Internationalisation (i18n)
- DocBlocks
- JavaScript
- CSS
- HTML
- Namespaces and autoloading in themes

---

## PHP style

- **Tabs** for indentation, not spaces. Align `=>` in arrays with spaces only when it
  helps.
- Spaces inside parentheses: `if ( $x ) {`, `foo( $a, $b )`, `array( 1, 2 )`. No space
  for empty parens `foo()`.
- Braces always, even for one-line bodies. Opening brace on the same line.
- `elseif`, not `else if`.
- **Yoda conditions** for `==`, `===`, `!=`, `!==`: `if ( 'grid' === $view )`. Never for
  `<`, `>`, `<=`, `>=`.
- Always strict comparison `===` / `!==` and `in_array( $v, $arr, true )`,
  `array_search( $v, $arr, true )`.
- Long array syntax `array()` is the WPCS default; `[]` is allowed (WPCS 3 accepts both)
  but be consistent within one theme. Match core: `array()`.
- One statement per line. No trailing whitespace. Newline at end of file.
- Single quotes unless the string contains a variable or an escape sequence.
- Use `<?php` and `?>` only; never short tags `<?`. `<?=` is not allowed by WPCS.
- Do not close `?>` at the end of pure-PHP files (functions.php, inc/*.php).
- In templates, PHP blocks mixed with HTML use full open/close and are indented with the
  HTML around them.
- No `else` after `return`. Early returns are good.
- Avoid `extract()`, `goto`, `eval()`, `@`.
- Do not use PHP 8-only syntax unless `Requires PHP` in `style.css` says 8.x. Match the
  minimum you declare (`PHPCompatibilityWP` sniff checks this).
- Type declarations and `declare(strict_types=1)` are allowed but not core style; if you
  use them, be consistent and set `Requires PHP: 7.4` or above.

Reference: [PHP Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/php/)

---

## Naming

| Thing | Convention | Example |
| --- | --- | --- |
| Functions | `snake_case`, prefixed | `pfx_get_icon()` |
| Variables | `snake_case` | `$post_count` |
| Classes | `Capitalized_Words_With_Underscores`, prefixed | `Pfx_Nav_Walker` |
| Class files | `class-` + lowercase-hyphen | `class-pfx-nav-walker.php` |
| Constants | `UPPER_SNAKE`, prefixed | `PFX_VERSION` |
| Files | lowercase, hyphens | `template-tags.php`, `content-page.php` |
| Hooks | lowercase, prefixed, underscores | `pfx_after_header` |
| Script/style handles | lowercase, hyphens, prefixed | `pfx-navigation` |
| Template parts | `template-parts/{type}/{name}.php` | `template-parts/content/content-single.php` |
| CSS classes | lowercase, hyphens; BEM allowed | `.pfx-card__title` |
| JS variables | `camelCase`; globals prefixed | `pfxConfig` |
| Text domain | theme slug exactly | `my-theme` |
| Block patterns | `slug/name` | `my-theme/hero` |
| Block styles | lowercase-hyphen, prefixed | `pfx-outline` |

- Reserved: never start your functions with `wp_`, `_` (single underscore), or reuse core
  names.
- Boolean functions read as questions: `pfx_has_sidebar()`, `pfx_is_landing()`.
- Getters that return escaped HTML should say so: `pfx_get_card_html()`; echo variants
  drop `get_`: `pfx_card()`.

---

## File organisation

Keep `functions.php` tiny: constants, setup hook, and `require` calls.

```
my-theme/
├── functions.php            # constants + requires only
├── inc/
│   ├── setup.php            # after_setup_theme: theme supports, menus, image sizes
│   ├── enqueue.php          # scripts, styles, fonts, editor assets
│   ├── template-tags.php    # pfx_posted_on(), pfx_entry_footer(), etc.
│   ├── template-functions.php  # filters: body_class, excerpt_more, pre_get_posts
│   ├── customizer.php       # classic/hybrid only
│   ├── block-patterns.php   # pattern categories (block/hybrid)
│   ├── block-styles.php     # register_block_style (block/hybrid)
│   └── class-pfx-*.php      # one class per file
├── template-parts/          # classic/hybrid
├── templates/ parts/ patterns/ styles/   # block/hybrid
├── assets/
│   ├── css/  js/  fonts/  images/
│   └── src/  (if a build step exists; ship built + source)
├── languages/               # .pot file
├── style.css  theme.json  screenshot.png  readme.txt
└── .phpcs.xml.dist  composer.json  package.json  .editorconfig  .gitignore
```

- One responsibility per file. Files named for what they contain.
- `require get_theme_file_path( 'inc/setup.php' );` (child-theme aware) or
  `require get_template_directory() . '/inc/setup.php';` (parent-only).
- Never `require_once` templates; use `get_template_part()`.
- No business logic in template files: templates call template tags, template tags live in
  `inc/`.

---

## Internationalisation (i18n)

Every user-visible string is translatable, with the theme slug as the **literal** text
domain. Theme review requires it; PHPCS `WordPress.WP.I18n` enforces it.

| Need | Function |
| --- | --- |
| Return translated | `__( 'Text', 'slug' )` |
| Echo translated | `_e( 'Text', 'slug' )` (unescaped, avoid) |
| Return + escape HTML | `esc_html__( 'Text', 'slug' )` |
| Echo + escape HTML | `esc_html_e( 'Text', 'slug' )` |
| Return + escape attr | `esc_attr__( 'Text', 'slug' )` |
| With context | `_x( 'Post', 'noun', 'slug' )`, `esc_html_x()`, `esc_attr_x()` |
| Plurals | `_n( '%s item', '%s items', $count, 'slug' )`, `_nx()` |
| Register-only (no translate now) | `_n_noop()`, `_x_noop()` |
| Number formatting | `number_format_i18n( $n )` |
| Dates | `wp_date( get_option( 'date_format' ) )` |

Rules:
- Text domain is a **string literal**, never a variable or constant.
- Never concatenate translatable fragments. Use placeholders:
  ```php
  /* translators: %s: post author name. */
  printf( esc_html__( 'Written by %s', 'slug' ), esc_html( get_the_author() ) );
  ```
- Every string with a placeholder gets a `/* translators: ... */` comment directly above
  the call.
- Numbered placeholders when there are two or more: `%1$s`, `%2$s`.
- Do not translate URLs, prefixes, CSS classes, or empty strings.
- No HTML in strings unless unavoidable; then `wp_kses()` the output.
- Block themes: strings in `patterns/*.php` use the same functions. Strings in
  `templates/*.html` and `parts/*.html` cannot be translated; move user-facing text into
  patterns.
- `theme.json` and `block.json` strings (`title`, `name`) are translated by core via the
  `.pot` when using `wp i18n make-pot`.
- Classic themes: `load_theme_textdomain( 'slug', get_template_directory() . '/languages' );`
  in `after_setup_theme`. Since WP 4.6 language packs load automatically for wp.org
  themes, but keep the call for self-hosted translations.
- Generate the POT: `wp i18n make-pot . languages/slug.pot` (or `npx @wordpress/scripts`
  equivalent). Ship the `.pot` in `languages/`.
- RTL: ship `rtl.css` (classic) or ensure `theme.json`/CSS uses logical properties
  (`margin-inline-start`) so RTL works automatically. Test with the RTL Tester plugin.

---

## DocBlocks

Every function, class, method, hook, and file gets a DocBlock. `WordPress-Docs` sniffs
enforce it.

```php
<?php
/**
 * Template tags used across the theme.
 *
 * @package My_Theme
 */

/**
 * Print the post date and author line.
 *
 * @since 1.0.0
 *
 * @param bool $show_author Whether to include the author. Default true.
 * @return void
 */
function pfx_posted_on( $show_author = true ) {
```

- File header: description + `@package Theme_Name`.
- `@since` on new functions (theme version).
- `@param type $name Description.` with type first; `@return`.
- Hooks you fire get a DocBlock right above `do_action` / `apply_filters` describing
  parameters.
- Inline comments explain **why**, not what. Start with a capital, end with a period.
- Template files start with a header comment (`Template Name:` for page templates,
  `Template Post Type:` when applicable).

---

## JavaScript

- Follow `@wordpress/eslint-plugin` (`wp-scripts lint-js`) or WordPress JS standards:
  tabs, single quotes, spaces inside parens, semicolons, `camelCase`.
- Never rely on a global `$`; if using core jQuery, wrap: `( function ( $ ) { ... } )( jQuery );`
  and declare the `jquery` dependency in `wp_enqueue_script()`.
- Prefer vanilla JS for theme scripts (navigation toggle, etc.). Themes should ship as
  little JS as possible.
- No inline event handlers (`onclick=`). Use `addEventListener`.
- Use `defer` strategy; do not depend on load order across files.
- Progressive enhancement: the site works without JS (menus visible, content readable).
- Interactivity API (`@wordpress/interactivity`) is for custom blocks, which live in the
  companion plugin, not the theme.
- No `console.log`, `debugger`, or `alert` in shipped files.
- Ship unminified source alongside minified builds (review requirement).

---

## CSS

- WordPress CSS standards: tabs, one selector per line, one declaration per line,
  lowercase hex, space after colon, blank line between rules.
- Mobile-first, `min-width` media queries.
- Use WordPress preset variables from `theme.json`: `var(--wp--preset--color--primary)`,
  `var(--wp--preset--spacing--40)`, `var(--wp--preset--font-size--large)`. Never
  hard-code values that exist as presets.
- Logical properties (`margin-inline`, `padding-block`, `inset-inline-start`) for RTL.
- Do not override core block classes globally with `!important`. Target with
  `.wp-block-x` + your class, or use `theme.json` `styles.blocks`.
- Keep specificity low: block/element/modifier, avoid IDs and nested descendant chains.
- Required core classes must be styled (classic themes): `.alignleft`, `.alignright`,
  `.aligncenter`, `.alignwide`, `.alignfull`, `.wp-caption`, `.wp-caption-text`,
  `.sticky`, `.bypostauthor`, `.gallery-caption`, `.screen-reader-text`.
- Visible focus styles on all interactive elements (see [accessibility.md](accessibility.md)).
- `style.css` header is mandatory; actual CSS may live in `assets/css/` and be enqueued.
- If using Sass/PostCSS/Tailwind, ship source and compiled output; never ship only
  `node_modules`-generated CSS without the source.

---

## HTML

- HTML5 semantic elements: `header`, `nav`, `main`, `article`, `aside`, `footer`,
  `figure`, `time`.
- Exactly one `<main>` per page, one `<h1>`.
- Valid, well-formed markup; lowercase tags/attributes; quote all attribute values.
- Self-closing void elements without slash is fine (`<br>`, `<img>`), stay consistent.
- Class names on the WordPress "standard" hooks: `.site`, `.site-header`, `.site-main`,
  `.site-footer`, `.entry-header`, `.entry-title`, `.entry-content`, `.entry-footer`,
  `.entry-meta`, `.post-thumbnail`, `.comments-area`. Plugins target these.
- Classic templates must include: `<!DOCTYPE html>`, `<html <?php language_attributes(); ?>>`,
  `<meta charset="<?php bloginfo( 'charset' ); ?>">`, `<meta name="viewport" ...>`,
  `wp_head()`, `<body <?php body_class(); ?>>`, `wp_body_open()`, `wp_footer()`.
- Block templates: valid block comment delimiters, no stray text outside blocks, every
  opening block closed.

---

## Namespaces and autoloading in themes

Namespaces are allowed and increasingly common in agency themes. Rules if you use them:

```php
<?php
/**
 * Theme setup.
 *
 * @package My_Theme
 */

namespace Pfx\Theme;

defined( 'ABSPATH' ) || exit;

add_action( 'after_setup_theme', __NAMESPACE__ . '\setup' );

/**
 * Register theme supports.
 */
function setup() {
	add_theme_support( 'title-tag' );
}
```

- Namespace name itself is the prefix (`Pfx\...`); functions inside still need not be
  prefixed. PHPCS `WordPress.NamingConventions.PrefixAllGlobals` accepts the namespace as
  the prefix when listed in `phpcs.xml.dist`.
- Hook callbacks: `__NAMESPACE__ . '\function_name'` (string) or `[ $this, 'method' ]`.
- Autoloading: Composer PSR-4 autoloader is fine for **development**, but shipped themes
  must include `vendor/` or a hand-written `spl_autoload_register()`; do not require
  clients to run `composer install`. Simplest robust option: explicit `require` list in
  `functions.php`.
- Do not namespace template files (they are included in the global scope by core).
- Template tags that templates call should be plain prefixed global functions (or a
  `use function` import at the top of each template, which is clumsy). Common pattern:
  namespaced internals in `inc/`, thin prefixed global wrappers in `inc/template-tags.php`.
