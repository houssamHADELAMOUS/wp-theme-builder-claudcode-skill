# Classic (PHP) Theme Development

Applies to classic and hybrid themes. Every template is PHP; structure comes from the
template hierarchy; global design from CSS and (in hybrids) `theme.json`.

## Contents

- Template hierarchy
- Required markup and hooks
- Theme setup (`after_setup_theme`)
- The Loop and queries
- Template parts and template tags
- Menus
- Widget areas
- Comments
- Pagination
- Customizer
- Page templates
- Hybrid additions
- Common mistakes

---

## Template hierarchy

WordPress picks the first existing file. `index.php` is the only required template.

| Context | Order |
| --- | --- |
| Front page | `front-page.php` → (static page: page hierarchy) / (posts: `home.php`) → `index.php` |
| Blog posts index | `home.php` → `index.php` |
| Single post | `single-{post-type}-{slug}.php` → `single-{post-type}.php` → `single.php` → `singular.php` → `index.php` |
| Page | custom template → `page-{slug}.php` → `page-{id}.php` → `page.php` → `singular.php` → `index.php` |
| Attachment | `{mime-type}-{subtype}.php` → `{subtype}.php` → `{mime-type}.php` → `attachment.php` → `single-attachment.php` → `single.php` → `singular.php` → `index.php` |
| Category | `category-{slug}.php` → `category-{id}.php` → `category.php` → `archive.php` → `index.php` |
| Tag | `tag-{slug}.php` → `tag-{id}.php` → `tag.php` → `archive.php` → `index.php` |
| Custom taxonomy | `taxonomy-{tax}-{term}.php` → `taxonomy-{tax}.php` → `taxonomy.php` → `archive.php` → `index.php` |
| CPT archive | `archive-{post-type}.php` → `archive.php` → `index.php` |
| Author | `author-{nicename}.php` → `author-{id}.php` → `author.php` → `archive.php` → `index.php` |
| Date | `date.php` → `archive.php` → `index.php` |
| Search | `search.php` → `index.php` |
| 404 | `404.php` → `index.php` |
| Embed | `embed-{post-type}-{format}.php` → `embed-{post-type}.php` → `embed.php` → core fallback |
| Privacy policy | `privacy-policy.php` → page hierarchy |

Filter the lookup with `{$type}_template_hierarchy` / `{$type}_template` if needed.
Recommended starter set: `index`, `front-page` (only if design differs), `home`,
`single`, `page`, `archive`, `search`, `404`, `comments`, `searchform`, `header`,
`footer`, `sidebar`.

---

## Required markup and hooks

`header.php`:
```php
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div id="page" class="site">
	<a class="skip-link screen-reader-text" href="#primary"><?php esc_html_e( 'Skip to content', 'my-theme' ); ?></a>
	<header id="masthead" class="site-header">
		...
	</header>
```

`footer.php`:
```php
	<footer id="colophon" class="site-footer">
		...
	</footer>
</div><!-- #page -->
<?php wp_footer(); ?>
</body>
</html>
```

Rules:
- No `<title>`: `add_theme_support( 'title-tag' )` prints it.
- No hard-coded `<link rel="stylesheet">`, `<script>`, favicon, or meta generator.
- `wp_body_open()` immediately after `<body>` (plugins inject GTM etc. here).
- `<main id="primary" class="site-main">` in every content template, exactly one per page.
- `post_class()` on each `<article>`; `wp_link_pages()` after `the_content()`.
- Load sub-templates only with `get_header()`, `get_footer()`, `get_sidebar()`,
  `get_template_part()`, `get_search_form()`, `comments_template()`,
  `locate_template()`. Never `include`/`require` a template.
- Named variants: `get_header( 'landing' )` loads `header-landing.php`.

---

## Theme setup (`after_setup_theme`)

```php
function pfx_setup() {
	load_theme_textdomain( 'my-theme', get_template_directory() . '/languages' );

	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	set_post_thumbnail_size( 1200, 9999 );
	add_image_size( 'pfx-card', 600, 400, true );

	add_theme_support(
		'html5',
		array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' )
	);
	add_theme_support(
		'custom-logo',
		array( 'height' => 80, 'width' => 240, 'flex-width' => true, 'flex-height' => true )
	);
	add_theme_support( 'customize-selective-refresh-widgets' );
	add_theme_support( 'responsive-embeds' );

	// Block editor support (hybrid; most are implied when theme.json exists).
	add_theme_support( 'align-wide' );
	add_theme_support( 'editor-styles' );
	add_editor_style( 'assets/css/editor.css' );
	add_theme_support( 'wp-block-styles' );
	add_theme_support( 'custom-spacing' );
	add_theme_support( 'custom-line-height' );
	add_theme_support( 'custom-units', 'px', 'em', 'rem', '%', 'vw', 'vh' );
	add_theme_support( 'appearance-tools' );
	add_theme_support( 'border' );
	add_theme_support( 'link-color' );

	register_nav_menus(
		array(
			'primary' => esc_html__( 'Primary Menu', 'my-theme' ),
			'footer'  => esc_html__( 'Footer Menu', 'my-theme' ),
		)
	);

	// Only if you really want them; otherwise omit.
	// add_theme_support( 'custom-background' ); add_theme_support( 'custom-header' );
	// add_theme_support( 'post-formats', array( 'aside', 'gallery', ... ) );
}
add_action( 'after_setup_theme', 'pfx_setup' );

function pfx_content_width() {
	$GLOBALS['content_width'] = apply_filters( 'pfx_content_width', 800 ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
}
add_action( 'after_setup_theme', 'pfx_content_width', 0 );
```

`$content_width` is still expected by core for oEmbed sizing; keep it.

---

## The Loop and queries

Main loop (index, archive, search):
```php
if ( have_posts() ) {
	while ( have_posts() ) {
		the_post();
		get_template_part( 'template-parts/content/content', get_post_type() );
	}
	the_posts_pagination( array( 'mid_size' => 2, 'prev_text' => esc_html__( 'Previous', 'my-theme' ), 'next_text' => esc_html__( 'Next', 'my-theme' ) ) );
} else {
	get_template_part( 'template-parts/content/content', 'none' );
}
```

Modify the main query with `pre_get_posts`, never `query_posts()`:
```php
function pfx_modify_main_query( $query ) {
	if ( is_admin() || ! $query->is_main_query() ) {
		return;
	}
	if ( $query->is_home() ) {
		$query->set( 'posts_per_page', 9 );
	}
	if ( $query->is_search() ) {
		$query->set( 'post_type', array( 'post', 'page' ) );
	}
}
add_action( 'pre_get_posts', 'pfx_modify_main_query' );
```

Secondary loops:
```php
$pfx_related = new WP_Query(
	array(
		'post_type'           => 'post',
		'posts_per_page'      => 3,
		'post__not_in'        => array( get_the_ID() ),
		'category__in'        => wp_get_post_categories( get_the_ID() ),
		'no_found_rows'       => true,
		'ignore_sticky_posts' => true,
		'update_post_term_cache' => false, // if not showing terms
	)
);
if ( $pfx_related->have_posts() ) {
	while ( $pfx_related->have_posts() ) {
		$pfx_related->the_post();
		get_template_part( 'template-parts/content/content', 'card' );
	}
	wp_reset_postdata();
}
```

- Always `wp_reset_postdata()` after a custom `WP_Query` loop; `wp_reset_query()` only
  after `query_posts()` (which you do not use).
- `no_found_rows => true` when you do not paginate (skips `SQL_CALC_FOUND_ROWS`).
- Cache expensive queries with transients keyed by prefix; invalidate on `save_post`.
- Use `get_posts()` only for simple lists without `the_post()`.

---

## Template parts and template tags

`get_template_part( 'template-parts/content/content', 'single', array( 'show_meta' => true ) )`
loads `content-single.php`, falling back to `content.php`. Access args with
`$args['show_meta']` (WP 5.5+). Template parts should be "dumb": markup + template tags.

Template tags live in `inc/template-tags.php`, wrapped in `function_exists()` when they
are meant to be overridable by child themes:

```php
if ( ! function_exists( 'pfx_posted_on' ) ) :
	/**
	 * Print the post date.
	 */
	function pfx_posted_on() {
		$time_string = '<time class="entry-date published updated" datetime="%1$s">%2$s</time>';
		if ( get_the_time( 'U' ) !== get_the_modified_time( 'U' ) ) {
			$time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time><time class="updated" datetime="%3$s">%4$s</time>';
		}
		$time_string = sprintf(
			$time_string,
			esc_attr( get_the_date( DATE_W3C ) ),
			esc_html( get_the_date() ),
			esc_attr( get_the_modified_date( DATE_W3C ) ),
			esc_html( get_the_modified_date() )
		);
		echo '<span class="posted-on">' . $time_string . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
	}
endif;
```

Conditional tags to reach for: `is_front_page()`, `is_home()`, `is_singular()`,
`is_single()`, `is_page()`, `is_archive()`, `is_post_type_archive()`, `is_tax()`,
`is_search()`, `is_404()`, `has_post_thumbnail()`, `has_nav_menu()`, `is_active_sidebar()`,
`comments_open()`, `get_comments_number()`, `post_password_required()`, `is_sticky()`.

---

## Menus

```php
wp_nav_menu(
	array(
		'theme_location' => 'primary',
		'menu_id'        => 'primary-menu',
		'menu_class'     => 'menu',
		'container'      => false,
		'fallback_cb'    => false, // do not dump all pages when no menu is set
		'depth'          => 2,
	)
);
```

Wrap in `<nav id="site-navigation" class="main-navigation" aria-label="<?php esc_attr_e( 'Primary', 'my-theme' ); ?>">`.
Mobile toggle button: `<button class="menu-toggle" aria-controls="primary-menu" aria-expanded="false">`,
toggled by `assets/js/navigation.js` (updates `aria-expanded`, handles Escape and
focus). Custom walkers extend `Walker_Nav_Menu` in `inc/class-pfx-walker-nav.php`.
Check `has_nav_menu( 'primary' )` before printing the `<nav>`.

---

## Widget areas

```php
function pfx_widgets_init() {
	register_sidebar(
		array(
			'name'          => esc_html__( 'Sidebar', 'my-theme' ),
			'id'            => 'sidebar-1',
			'description'   => esc_html__( 'Add widgets here.', 'my-theme' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="widget-title">',
			'after_title'   => '</h2>',
		)
	);
}
add_action( 'widgets_init', 'pfx_widgets_init' );
```

`sidebar.php`: `if ( ! is_active_sidebar( 'sidebar-1' ) ) { return; }` then
`<aside id="secondary" class="widget-area"><?php dynamic_sidebar( 'sidebar-1' ); ?></aside>`.
Widget areas use block widgets by default (WP 5.8+); do not disable
(`remove_theme_support( 'widgets-block-editor' )`) without a reason.

---

## Comments

`comments.php`:
```php
if ( post_password_required() ) {
	return;
}
?>
<div id="comments" class="comments-area">
	<?php if ( have_comments() ) : ?>
		<h2 class="comments-title">
			<?php
			$pfx_count = get_comments_number();
			if ( '1' === $pfx_count ) {
				printf( esc_html__( 'One comment on &ldquo;%s&rdquo;', 'my-theme' ), '<span>' . wp_kses_post( get_the_title() ) . '</span>' );
			} else {
				printf(
					/* translators: 1: number of comments, 2: post title. */
					esc_html( _n( '%1$s comment on &ldquo;%2$s&rdquo;', '%1$s comments on &ldquo;%2$s&rdquo;', $pfx_count, 'my-theme' ) ),
					esc_html( number_format_i18n( $pfx_count ) ),
					'<span>' . wp_kses_post( get_the_title() ) . '</span>'
				);
			}
			?>
		</h2>
		<?php the_comments_navigation(); ?>
		<ol class="comment-list">
			<?php wp_list_comments( array( 'style' => 'ol', 'short_ping' => true, 'avatar_size' => 48 ) ); ?>
		</ol>
		<?php the_comments_navigation(); ?>
		<?php if ( ! comments_open() ) : ?>
			<p class="no-comments"><?php esc_html_e( 'Comments are closed.', 'my-theme' ); ?></p>
		<?php endif; ?>
	<?php endif; ?>
	<?php comment_form(); ?>
</div>
```

In single templates: `if ( comments_open() || get_comments_number() ) { comments_template(); }`.
Enqueue the reply script: `if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) { wp_enqueue_script( 'comment-reply' ); }`.

---

## Pagination

- Archives: `the_posts_pagination()` (numbered) or `the_posts_navigation()` (prev/next).
- Single: `the_post_navigation( array( 'prev_text' => ..., 'next_text' => ... ) )`.
- Paginated posts (`<!--nextpage-->`): `wp_link_pages()`.
- Custom `WP_Query` pagination: pass `'paged' => max( 1, get_query_var( 'paged' ) )` and
  use `paginate_links( array( 'total' => $query->max_num_pages ) )`.

---

## Customizer

Only for classic/hybrid. Every setting needs `sanitize_callback` and
`capability => 'edit_theme_options'`. Group in a panel/section prefixed with the slug.

```php
function pfx_customize_register( $wp_customize ) {
	$wp_customize->add_section(
		'pfx_options',
		array( 'title' => __( 'Theme Options', 'my-theme' ), 'priority' => 130 )
	);
	$wp_customize->add_setting(
		'pfx_show_author',
		array( 'default' => true, 'sanitize_callback' => 'pfx_sanitize_checkbox', 'transport' => 'refresh' )
	);
	$wp_customize->add_control(
		'pfx_show_author',
		array( 'type' => 'checkbox', 'section' => 'pfx_options', 'label' => __( 'Show author on posts', 'my-theme' ) )
	);
	// Selective refresh for site title/description.
	$wp_customize->get_setting( 'blogname' )->transport = 'postMessage';
	$wp_customize->selective_refresh->add_partial( 'blogname', array( 'selector' => '.site-title a', 'render_callback' => 'pfx_customize_partial_blogname' ) );
}
add_action( 'customize_register', 'pfx_customize_register' );
```

Read with `get_theme_mod( 'pfx_show_author', true )`; escape on output. Keep settings
few: colours, logo (core), layout toggles, footer text. Everything else is plugin
territory or a block.

---

## Page templates

`page-templates/landing.php`:
```php
<?php
/**
 * Template Name: Landing Page
 * Template Post Type: page, post
 *
 * @package My_Theme
 */
```
Keep page templates in a `page-templates/` folder (core scans one level deep). Prefer
patterns + a block-based layout for hybrids; page templates are for structurally
different pages (no header, full-width app shell).

---

## Hybrid additions

- `theme.json` (`version: 3`) with `settings` for palette, font sizes, spacing, layout,
  and `styles` for core blocks. Core then generates CSS custom properties and the editor
  matches the front end.
- `assets/css/editor.css` via `add_editor_style()`; keep front-end and editor CSS in sync
  by building both from the same source.
- `patterns/` folder auto-registers; use them for page-building components.
- Optionally `block_template_part( 'header' )` inside `header.php` so the header is
  editable in Appearance → Editor.
- `functions.php` may `remove_theme_support( 'core-block-patterns' )` and restrict
  `allowed_block_types_all` to a curated list for client sanity.

---

## Common mistakes

- `query_posts()` anywhere.
- Forgetting `wp_reset_postdata()` → wrong post data in footer.
- `get_template_directory_uri()` in a child-theme-aware context (use
  `get_theme_file_uri()` / `get_stylesheet_directory_uri()` as appropriate).
- Missing `wp_body_open()`; missing `post_class()`.
- `<title>` in `header.php` alongside `title-tag`.
- Fallback menu dumping all pages (`fallback_cb` default).
- Widget area registered but `sidebar.php` prints markup even when empty.
- Loading `comment-reply` unconditionally.
- Customizer setting without `sanitize_callback`.
- Business logic (CPTs, shortcodes) in `functions.php`.
- `include 'header.php'` instead of `get_header()`.
