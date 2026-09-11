# WordPress Theme Security Rules

The rules a senior developer applies to every line of theme code. Violations here are
the number one reason themes fail review and the number one source of theme CVEs.

## Contents

- Core principles
- Escaping on output (by context)
- Sanitizing and validating input
- Superglobals: the only correct pattern
- Nonces
- Capabilities
- Database access
- Customizer and options
- AJAX and REST endpoints
- Passing data to JavaScript
- Files, uploads, SVG, remote requests
- Prefixing (namespace hygiene)
- Forbidden and dangerous functions
- Before / after examples
- Self-review checklist

---

## Core principles

1. **Never trust input.** `$_GET`, `$_POST`, `$_REQUEST`, `$_COOKIE`, `$_SERVER`, the
   database, post meta, options, third-party APIs, and even WordPress core filters can
   all carry attacker-controlled data.
2. **Sanitize early, escape late.** Sanitize/validate the moment data enters your code.
   Escape at the exact moment it is printed. Do both; they are not interchangeable.
3. **Validate over sanitize.** If a value must be one of five things, reject anything
   else instead of "cleaning" it.
4. **Escape everything, every time.** Even data you "know" is safe (post titles, options
   you set yourself). Reviewers and static tools cannot prove safety; escaping makes it
   obvious.
5. **Every state change needs a nonce AND a capability check.** One without the other
   is a vulnerability.
6. **Themes are presentation.** The less a theme processes input, the smaller its attack
   surface. Push forms, settings and data handling to a plugin where possible.

---

## Escaping on output (by context)

Pick the function by **where the value lands in the HTML**, not by what the value is.

| Output context | Function | Example |
| --- | --- | --- |
| Text between tags | `esc_html()` | `<h2><?php echo esc_html( $title ); ?></h2>` |
| Inside an attribute (`class`, `alt`, `data-*`, `value`) | `esc_attr()` | `<div class="<?php echo esc_attr( $cls ); ?>">` |
| `href`, `src`, `action`, any URL | `esc_url()` | `<a href="<?php echo esc_url( $link ); ?>">` |
| URL saved to DB or used in redirect/header | `esc_url_raw()` / `sanitize_url()` | `update_option( 'x', esc_url_raw( $url ) );` |
| Inside `<textarea>` | `esc_textarea()` | `<textarea><?php echo esc_textarea( $v ); ?></textarea>` |
| Inline JS string (avoid; prefer `wp_add_inline_script` + `wp_json_encode`) | `esc_js()` | `onclick="go('<?php echo esc_js( $s ); ?>')"` |
| JSON for JS | `wp_json_encode()` | `wp_add_inline_script( 'h', 'var cfg = ' . wp_json_encode( $cfg ) . ';', 'before' );` |
| XML / RSS | `esc_xml()` | |
| HTML that must keep tags (post content, widget text) | `wp_kses_post()` | `echo wp_kses_post( $html );` |
| HTML with a custom whitelist | `wp_kses( $html, $allowed )` | |
| Comment-like HTML | `wp_kses_data()` | |
| Translated text between tags | `esc_html__()` / `esc_html_e()` / `esc_html_x()` | `esc_html_e( 'Read more', 'slug' );` |
| Translated text in attribute | `esc_attr__()` / `esc_attr_e()` / `esc_attr_x()` | |
| Translated with placeholders | `printf( esc_html__( '%s items', 'slug' ), esc_html( $n ) )` | note both are escaped |

### Rules

- Escape **as late as possible**, ideally inside the `echo`. Do not escape into a
  variable and print it 20 lines later; someone will modify the variable in between.
- Exception: when building HTML strings internally, escape as you build and suffix the
  variable `_escaped` / `_safe` so reviewers can see it.
- `__()` and `_e()` **do not escape**. Translation files can contain HTML/JS. Use the
  `esc_html__` / `esc_attr__` variants, or wrap in `wp_kses_post()` if markup is
  intentional.
- `esc_url()` strips `javascript:` and other dangerous protocols. `esc_attr()` does not.
  Never put a URL through only `esc_attr()`.
- `wp_kses_post()` is the maximum allowed for untrusted HTML. Never `echo` raw HTML
  from a user, option, or meta.
- **Functions that already escape** (safe to echo directly): `the_title()`, `the_content()`,
  `the_excerpt()`, `the_permalink()`, `the_post_thumbnail()`, `wp_nav_menu()`,
  `body_class()`, `post_class()`, `bloginfo()` (not `get_bloginfo()`),
  `wp_get_attachment_image()`, `get_the_post_thumbnail()`, `paginate_links()` (returns
  escaped HTML), `get_search_form()`, `comment_form()`, `wp_list_comments()`,
  `get_the_password_form()`, `wp_kses_post()`, `wp_kses()`, `wp_json_encode()`,
  `esc_*()`. Everything else, including `get_the_title()`, `get_permalink()`,
  `get_bloginfo()`, `get_the_author()`, `get_post_meta()`, `get_option()`,
  `get_theme_mod()`, must be escaped when echoed.
- `wp_localize_script()` escapes for you; `wp_add_inline_script()` does not.
- Do not escape too early and double-escape: `esc_html( esc_html( $x ) )` produces
  `&amp;amp;`.

---

## Sanitizing and validating input

Sanitize **the moment** untrusted data enters your code, before storing or using it.

| Input type | Function |
| --- | --- |
| Single-line text | `sanitize_text_field()` |
| Multi-line text | `sanitize_textarea_field()` |
| Email | `sanitize_email()` then `is_email()` to validate |
| URL (for storage) | `sanitize_url()` (alias of `esc_url_raw()`) |
| Integer / ID | `absint()` (non-negative) or `intval()` / `(int)` |
| Float | `floatval()` / `(float)` |
| Boolean | `rest_sanitize_boolean()` or `(bool)` with explicit `'1'`/`'true'` comparison |
| Slug / key | `sanitize_key()` (lowercase a-z0-9_-) or `sanitize_title()` |
| Hex colour | `sanitize_hex_color()` / `sanitize_hex_color_no_hash()` |
| CSS class | `sanitize_html_class()` |
| File name | `sanitize_file_name()` |
| Username | `sanitize_user()` |
| Option value | `sanitize_option()` |
| Meta value | `sanitize_meta()` |
| ORDER BY clause | `sanitize_sql_orderby()` |
| Rich HTML | `wp_kses_post()` / `wp_kses()` |
| One of N choices | validate: `in_array( $v, $allowed, true ) ? $v : $default` |
| Array of things | `array_map( 'sanitize_text_field', (array) $arr )` |

### Rules

- **Validate when you can.** A select with three options is validated with `in_array()`
  (strict), not "sanitized".
- Always `wp_unslash()` superglobals **before** sanitizing (WordPress adds slashes to
  `$_POST`, `$_GET`, `$_COOKIE`, `$_SERVER`, `$_REQUEST`).
- Sanitizing does **not** replace escaping. Sanitized data stored in the DB still gets
  escaped on output.
- Never store raw `$_POST` values. Never pass them straight to `update_option`,
  `update_post_meta`, `set_theme_mod`, `WP_Query`, or `$wpdb`.

---

## Superglobals: the only correct pattern

```php
// Read a query var safely.
$view = isset( $_GET['view'] ) ? sanitize_key( wp_unslash( $_GET['view'] ) ) : 'grid'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
if ( ! in_array( $view, array( 'grid', 'list' ), true ) ) {
	$view = 'grid';
}

// Read a posted value (state change): nonce + capability + unslash + sanitize.
if ( isset( $_POST['pfx_action'] ) ) {
	if ( ! isset( $_POST['pfx_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['pfx_nonce'] ) ), 'pfx_do_action' ) ) {
		wp_die( esc_html__( 'Security check failed.', 'textdomain' ) );
	}
	if ( ! current_user_can( 'edit_theme_options' ) ) {
		wp_die( esc_html__( 'You are not allowed to do that.', 'textdomain' ) );
	}
	$value = sanitize_text_field( wp_unslash( $_POST['pfx_value'] ) );
	// ... use $value
}
```

Always check `isset()` first, then `wp_unslash()`, then sanitize, then validate. Read-only
`$_GET` usage (filters, pagination) does not need a nonce, but PHPCS will warn; add a
`// phpcs:ignore WordPress.Security.NonceVerification.Recommended` comment with a reason
so reviewers see it was deliberate.

`$_SERVER['REQUEST_URI']`, `HTTP_HOST`, `HTTP_REFERER`, `HTTP_USER_AGENT` are user
controlled. Treat them like `$_GET`. Prefer `wp_get_referer()`, `home_url()`,
`add_query_arg( array(), '' )` over raw `$_SERVER`.

---

## Nonces

A nonce proves the request came from a page you rendered, for this user, recently. It
prevents CSRF. It does **not** prove authorization; always pair with `current_user_can()`.

| Situation | Create | Verify |
| --- | --- | --- |
| HTML form | `wp_nonce_field( 'pfx_action', 'pfx_nonce' );` | `wp_verify_nonce( $_POST['pfx_nonce'], 'pfx_action' )` |
| Admin form/URL | `wp_nonce_url( $url, 'pfx_action' )` | `check_admin_referer( 'pfx_action' )` (dies on failure) |
| admin-ajax | `wp_create_nonce( 'pfx_ajax' )` passed to JS | `check_ajax_referer( 'pfx_ajax', 'nonce' )` |
| REST API (logged-in) | `wp_create_nonce( 'wp_rest' )` sent as `X-WP-Nonce` header | automatic when header present, plus `permission_callback` |

- Action names must be specific (`pfx_save_settings`, not `pfx_nonce`). Include the object
  ID for per-object actions: `'pfx_delete_' . $post_id`.
- `wp_verify_nonce()` returns `false`, `1`, or `2`. Test with `! wp_verify_nonce(...)`.
- Nonces are useless on cached pages for logged-out users. Do not build logged-out
  forms in the theme; use a plugin.

---

## Capabilities

- Check **capabilities**, never roles: `current_user_can( 'edit_theme_options' )`, not
  `in_array( 'administrator', $user->roles )`.
- Theme settings pages and Customizer: `edit_theme_options`.
- Per-post actions: `current_user_can( 'edit_post', $post_id )` with the ID.
- Check on every request that changes state, not just when rendering the button.
- `is_admin()` is **not** a security check (it means "is this an admin URL").
- `is_user_logged_in()` is **not** authorization.
- `admin_enqueue_scripts` handlers must check `$hook_suffix` so theme admin assets do
  not leak onto other admin pages.

---

## Database access

Themes rarely need `$wpdb`. Use `WP_Query`, `get_posts()`, `get_terms()`, `get_option()`,
`get_post_meta()` and the transient API first.

If you must:

```php
global $wpdb;
$rows = $wpdb->get_results(
	$wpdb->prepare(
		"SELECT ID, post_title FROM {$wpdb->posts} WHERE post_type = %s AND post_status = 'publish' LIMIT %d",
		$type,
		$limit
	)
);
```

- Every variable goes through `$wpdb->prepare()` with `%s`, `%d`, `%f`, `%i` (identifier,
  WP 6.2+). Never interpolate variables into SQL strings.
- Use `$wpdb->posts`, `$wpdb->postmeta`, `$wpdb->prefix . 'table'` for table names.
- `LIKE` values: `$wpdb->esc_like( $term )` then wrap with `%`.
- `ORDER BY` column names cannot be prepared; whitelist them.
- Never use `$wpdb->query()` with raw user input, `mysql_*`, `mysqli_*`, or PDO directly.
- Themes must not create tables. That is plugin territory.

---

## Customizer and options

- Every `$wp_customize->add_setting()` **must** have a `sanitize_callback`. Theme review
  rejects settings without one. Also set `'capability' => 'edit_theme_options'`.

```php
$wp_customize->add_setting(
	'pfx_accent_color',
	array(
		'default'           => '#0055aa',
		'sanitize_callback' => 'sanitize_hex_color',
		'transport'         => 'postMessage',
	)
);
```

- Common callbacks: `sanitize_hex_color`, `sanitize_text_field`, `absint`, `esc_url_raw`,
  `wp_kses_post`, `sanitize_key`, and custom validators for selects/checkboxes:

```php
function pfx_sanitize_checkbox( $checked ) {
	return ( isset( $checked ) && true === (bool) $checked );
}
function pfx_sanitize_select( $input, $setting ) {
	$choices = $setting->manager->get_control( $setting->id )->choices;
	return array_key_exists( $input, $choices ) ? $input : $setting->default;
}
```

- Escape `get_theme_mod()` output every time. Colours in inline CSS: `esc_attr()` after
  `sanitize_hex_color()`; URLs: `esc_url()`.
- Themes may add **one** option (array), prefixed with the theme slug. Use the Settings
  API with `register_setting( ..., array( 'sanitize_callback' => ... ) )`.
- Inline CSS from theme mods goes through `wp_add_inline_style( 'handle', $css )` where
  every value was sanitized and `wp_strip_all_tags()` applied.

---

## AJAX and REST endpoints

Prefer a plugin. If the theme must expose an endpoint:

**admin-ajax**
```php
add_action( 'wp_ajax_pfx_load_more', 'pfx_load_more' );
add_action( 'wp_ajax_nopriv_pfx_load_more', 'pfx_load_more' ); // only if logged-out users need it
function pfx_load_more() {
	check_ajax_referer( 'pfx_ajax', 'nonce' );
	$page = isset( $_POST['page'] ) ? absint( wp_unslash( $_POST['page'] ) ) : 1;
	// ... build $html with escaped output
	wp_send_json_success( array( 'html' => $html ) );
}
```

**REST**
```php
register_rest_route(
	'pfx/v1',
	'/posts',
	array(
		'methods'             => WP_REST_Server::READABLE,
		'callback'            => 'pfx_rest_posts',
		'permission_callback' => '__return_true', // public read only; for writes use current_user_can()
		'args'                => array(
			'page' => array(
				'sanitize_callback' => 'absint',
				'validate_callback' => function ( $v ) { return $v > 0; },
			),
		),
	)
);
```

- `permission_callback` is mandatory (WP 5.5+ warns without it). `__return_true` only
  for public read-only data.
- Output through `wp_send_json_*()` / `rest_ensure_response()`; never `echo json_encode`.
- Do not expose private data (emails, drafts, meta) without capability checks.

---

## Passing data to JavaScript

```php
wp_enqueue_script( 'pfx-app', get_theme_file_uri( 'assets/js/app.js' ), array(), PFX_VERSION, array( 'strategy' => 'defer' ) );
wp_add_inline_script(
	'pfx-app',
	'window.pfxConfig = ' . wp_json_encode(
		array(
			'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			'nonce'   => wp_create_nonce( 'pfx_ajax' ),
			'restUrl' => esc_url_raw( rest_url( 'pfx/v1/' ) ),
		)
	) . ';',
	'before'
);
```

- `wp_json_encode()` handles escaping. Never build JS strings by concatenation.
- `wp_localize_script()` is fine but casts everything to strings; use
  `wp_add_inline_script()` + `wp_json_encode()` for typed data.
- In JS, never use `innerHTML` with server data unless it was `wp_kses_post()`ed
  server-side; prefer `textContent`.
- Never inline `<script>` tags with PHP variables in templates.

---

## Files, uploads, SVG, remote requests

- Themes must not handle file uploads. Plugin territory.
- Never include files from user input: `include $_GET['tpl'] . '.php'` is remote/local
  file inclusion. Use `get_template_part()` with a whitelist.
- `get_template_part( 'template-parts/content', $post_type )` is safe: WordPress
  sanitizes the path against the theme directory.
- SVG: WordPress blocks SVG upload by default for a reason (XSS). If the theme ships
  SVG icons, inline them from theme files only, never from uploads or options. Provide a
  fixed icon map `pfx_get_icon( 'arrow' )`; never let input select a file path.
- Remote requests: use `wp_remote_get()` / `wp_safe_remote_get()`, never `curl_*` or
  `file_get_contents( 'http://...' )`. Themes should not fetch remote data on the front
  end at all (privacy + performance + review rule). Google Fonts are the only accepted
  remote asset and even those should be self-hosted for GDPR.
- `wp_redirect()` is unsafe with external URLs; use `wp_safe_redirect()` and always
  `exit;` after.

---

## Prefixing (namespace hygiene)

Everything the theme defines in the global namespace must carry a unique prefix of at
least four characters, derived from the theme slug. Prevents collisions with plugins
and other themes, and is a hard review requirement.

Prefix these:
- Functions: `pfx_setup()`, `pfx_enqueue_assets()`
- Classes: `Pfx_Walker_Nav` or namespace `Pfx\Theme`
- Constants: `PFX_VERSION`
- Global variables: `$pfx_options`
- Options and theme mods: `pfx_options`, `pfx_accent_color`
- Transients: `pfx_featured_posts`
- Script/style handles: `pfx-main`, `pfx-navigation` (third-party libs keep their names)
- Image sizes: `pfx-card`, `pfx-hero`
- Custom template slugs, block style names, pattern slugs: `pfx/hero`
- Customizer sections/settings/controls: `pfx_colors`
- Hooks you fire: `do_action( 'pfx_after_header' )`, `apply_filters( 'pfx_card_classes', $c )`
- Post meta keys (if any): `_pfx_subtitle` (leading underscore hides from Custom Fields UI)
- CSS classes for theme-specific components: `.pfx-card` (plus BEM); standard WP classes
  (`.site-header`, `.entry-content`, `.wp-block-*`) stay unprefixed

Exceptions: `add_theme_support()` features, sidebar/menu IDs (`primary`, `footer-1`),
template file names, and third-party asset handles.

Also guard against re-declaration in child-theme scenarios:
```php
if ( ! function_exists( 'pfx_setup' ) ) {
	function pfx_setup() { /* ... */ }
}
```
(Only for functions a child theme should be allowed to override.)

---

## Forbidden and dangerous functions

Never use in a theme:

| Function / pattern | Why | Use instead |
| --- | --- | --- |
| `eval()`, `create_function()`, `assert()` with strings | code execution | nothing |
| `base64_decode()` on stored/remote strings | obfuscation, review auto-reject | plain code |
| `extract()` | variable injection | explicit assignment |
| `unserialize()` on untrusted data | object injection | `json_decode()` |
| `query_posts()` | breaks main query & pagination | `pre_get_posts` or `new WP_Query` |
| `$_GET/$_POST` raw | injection | unslash + sanitize |
| `mysql_*`, `mysqli_*`, PDO | bypass WP DB layer | `$wpdb->prepare()` |
| `curl_*`, `file_get_contents( 'http...' )`, `fopen( url )` | unsafe HTTP, review reject | `wp_remote_get()` |
| `file_put_contents()`, `fwrite()`, `unlink()`, `mkdir()` in theme dir | themes do not write files | `WP_Filesystem` in a plugin |
| `move_uploaded_file()` | upload handling | plugin + `wp_handle_upload()` |
| `header( 'Location: ...' )` | unsafe redirect | `wp_safe_redirect()` + `exit` |
| `ini_set()`, `set_time_limit()`, `error_reporting()` | environment tampering | nothing |
| `wp_deregister_script( 'jquery' )` / bundling jQuery | breaks plugins, review reject | use core jQuery |
| `remove_action( 'wp_head', 'wp_generator' )` and other non-presentational hook removals | review reject (plugin territory) | leave to plugins |
| `add_filter( 'show_admin_bar', '__return_false' )` | review reject | nothing |
| `ob_start()` around `the_content()` | brittle, breaks plugins | filters |
| `date()`, `time()` for display | wrong timezone | `wp_date()`, `current_time()` |
| `strip_tags()` for security | incomplete | `wp_kses()` / `wp_strip_all_tags()` |
| `rand()`, `mt_rand()` for tokens | predictable | `wp_generate_password()`, `random_int()` |
| `var_dump`, `print_r`, `error_log`, `console.log` in shipped code | leaks | remove |
| `@` error suppression | hides bugs | handle errors |
| `define( 'WP_DEBUG' ...)` in theme | belongs to `wp-config.php` | nothing |
| Deprecated functions (`get_currentuserinfo`, `wp_title` for title, `screen_icon`, `get_page`, `wp_get_sites`, `create_function`, `the_meta`, `get_settings`, `attribute_escape`, `wp_specialchars`, `clean_url`, `get_bloginfo('url')` for home) | review reject, notices | modern equivalents; check `WP_DEBUG` |

Also always start every PHP file that can be requested directly with an `ABSPATH` guard
(PHP files in `inc/` and the companion plugin):
```php
defined( 'ABSPATH' ) || exit;
```
Template files loaded through the template hierarchy do not strictly need it but it
does no harm.

---

## Before / after examples

**Unescaped title and permalink**
```php
// Bad
<a href="<?php echo get_permalink(); ?>"><?php echo get_the_title(); ?></a>
// Good
<a href="<?php echo esc_url( get_permalink() ); ?>"><?php echo esc_html( get_the_title() ); ?></a>
// Also good (these functions escape internally)
<a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
```

**Theme mod in inline style**
```php
// Bad
echo '<style>.site-header{background:' . get_theme_mod( 'pfx_header_bg' ) . '}</style>';
// Good
$bg  = sanitize_hex_color( get_theme_mod( 'pfx_header_bg', '#ffffff' ) );
$css = '.site-header{background:' . esc_attr( $bg ) . ';}';
wp_add_inline_style( 'pfx-main', $css );
```

**Translated string with HTML**
```php
// Bad
_e( 'Read <strong>more</strong>', 'slug' );
// Good
echo wp_kses(
	__( 'Read <strong>more</strong>', 'slug' ),
	array( 'strong' => array() )
);
// Better: keep markup out of strings
printf( '<strong>%s</strong>', esc_html__( 'Read more', 'slug' ) );
```

**Post meta**
```php
// Bad
echo get_post_meta( get_the_ID(), 'subtitle', true );
// Good
$subtitle = get_post_meta( get_the_ID(), '_pfx_subtitle', true );
if ( $subtitle ) {
	echo '<p class="entry-subtitle">' . esc_html( $subtitle ) . '</p>';
}
```

**Data attribute with JSON**
```php
// Bad
<div data-config='<?php echo json_encode( $cfg ); ?>'>
// Good
<div data-config="<?php echo esc_attr( wp_json_encode( $cfg ) ); ?>">
```

**Pagination / query var**
```php
// Bad
$paged = $_GET['paged'];
// Good
$paged = get_query_var( 'paged' ) ? absint( get_query_var( 'paged' ) ) : 1;
```

**Custom query**
```php
// Bad
query_posts( 'cat=3&posts_per_page=5' );
// Good
$pfx_query = new WP_Query(
	array(
		'category_name'       => 'news',
		'posts_per_page'      => 5,
		'no_found_rows'       => true, // when no pagination needed
		'ignore_sticky_posts' => true,
	)
);
if ( $pfx_query->have_posts() ) {
	while ( $pfx_query->have_posts() ) {
		$pfx_query->the_post();
		get_template_part( 'template-parts/content', 'card' );
	}
	wp_reset_postdata();
}
```

---

## Self-review checklist

Run through this on every PHP file before declaring it done:

- [ ] Every `echo` / `print` / `<?=` / `printf` prints an `esc_*`, `wp_kses*`, or a
      known self-escaping template tag
- [ ] No `__()` / `_e()` printed without escaping
- [ ] Every superglobal read: `isset` → `wp_unslash` → `sanitize_*` → validate
- [ ] Every state change: nonce verified AND `current_user_can()` checked
- [ ] Every Customizer setting has `sanitize_callback`
- [ ] Every `$wpdb` call uses `prepare()`
- [ ] No function from the forbidden list
- [ ] Every function, class, constant, handle, option, hook, image size is prefixed
- [ ] No remote resources loaded on the front end without consent
- [ ] No debug output left in
- [ ] `defined( 'ABSPATH' ) || exit;` on includes
- [ ] PHPCS with `WordPress` standard passes (see [tooling.md](tooling.md))
