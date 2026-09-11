# Plugin Territory: What Never Goes in a Theme

A theme controls **presentation**. Anything that would be lost or broken when the site
owner switches themes is **content/functionality** and belongs in a plugin. This is a
hard WordPress.org rule and, more importantly, professional practice: clients keep
their data when the design changes.

## Contents

- The prohibited list
- The companion plugin pattern
- mu-plugin vs regular plugin
- How theme and plugin talk to each other
- Recommending plugins
- Grey areas and how to decide

---

## The prohibited list

Never in the theme:

| Category | Examples | Where it goes |
| --- | --- | --- |
| Content structures | `register_post_type()`, `register_taxonomy()`, `register_post_meta()`, custom fields definitions (ACF field groups in PHP/JSON) | companion plugin |
| Custom blocks | `register_block_type()`, `block.json`, block editor JS | companion plugin |
| Shortcodes | `add_shortcode()` | companion plugin (or a block) |
| Users & roles | `add_role()`, `add_cap()`, custom contact methods (`user_contactmethods`), login customisation, registration flows | plugin |
| SEO | meta tags, Open Graph, schema.org JSON-LD, sitemaps, robots, canonical tweaks | SEO plugin |
| Analytics / tracking | GA/GTM snippets, pixels, cookie banners, heatmaps | plugin (with consent) |
| Forms | contact forms, newsletter signup handling, form processing via `admin-post` | forms plugin |
| Email | `wp_mail()` customisation, SMTP, notifications | plugin |
| Caching / performance behaviour | object cache, page cache, minification, CDN rewriting, lazy-load overrides beyond CSS | plugin/host |
| Security behaviour | login limits, hiding wp-admin, disabling XML-RPC, headers | plugin/host |
| Social | share buttons with tracking, social feeds fetched remotely | plugin |
| E-commerce logic | cart, checkout, pricing, WooCommerce hooks that change behaviour | plugin (WooCommerce template overrides for **markup** are fine) |
| Admin changes | removing admin bar, dashboard widgets, admin menu items, activation redirects, custom login page | plugin |
| Data | writing files, creating DB tables, cron jobs (`wp_schedule_event`), remote API syncs | plugin |
| Mime types, uploads | `upload_mimes` (SVG enabling), upload handling | plugin |
| Removing non-presentational hooks | `wp_generator`, `rsd_link`, `feed_links`, `rest_output_link_wp_head`, `wp_oembed_*`, `rel_canonical`, `wp_shortlink_wp_head`, emoji scripts are borderline: acceptable for performance in client themes but not on wp.org | plugin |
| Block editor restrictions | `allowed_block_types_all` | grey; see below |
| Bundled plugins | zip files, auto-installers | never; recommend instead |

Also not allowed: hiding core features behind a paywall, "pro" upsells on the front end,
demo content importers, remote calls on activation.

---

## The companion plugin pattern

Every client project ships two things:

1. `wp-content/themes/{slug}/` — the theme (design)
2. `wp-content/plugins/{slug}-core/` — the companion plugin (data + behaviour)

Skeleton lives in this skill at `assets/companion-plugin/`. Structure:

```
{slug}-core/
├── {slug}-core.php          # plugin header, ABSPATH guard, constants, requires
├── inc/
│   ├── post-types.php       # register_post_type on init
│   ├── taxonomies.php
│   ├── meta.php             # register_post_meta with show_in_rest + sanitize/auth callbacks
│   ├── blocks.php           # register_block_type from build/
│   ├── shortcodes.php       # only if a client insists
│   └── editor.php           # allowed_block_types_all, block categories
├── blocks/                  # source for custom blocks (block.json apiVersion 3, src/, build/)
├── languages/
├── readme.txt
└── uninstall.php            # optional cleanup
```

Plugin header:
```php
<?php
/**
 * Plugin Name:       My Theme Core
 * Description:       Content types, blocks and site functionality for the My Theme site. Keep active when changing themes.
 * Version:           1.0.0
 * Requires at least: 6.7
 * Requires PHP:      7.4
 * Author:            Agency
 * License:           GPL-2.0-or-later
 * Text Domain:       my-theme-core
 *
 * @package My_Theme_Core
 */

defined( 'ABSPATH' ) || exit;
```

CPT registration example:
```php
function pfxc_register_post_types() {
	register_post_type(
		'pfx_project',
		array(
			'labels'       => array(
				'name'          => _x( 'Projects', 'post type general name', 'my-theme-core' ),
				'singular_name' => _x( 'Project', 'post type singular name', 'my-theme-core' ),
				'add_new_item'  => __( 'Add New Project', 'my-theme-core' ),
				'edit_item'     => __( 'Edit Project', 'my-theme-core' ),
			),
			'public'       => true,
			'show_in_rest' => true, // block editor + REST
			'has_archive'  => 'projects',
			'rewrite'      => array( 'slug' => 'projects', 'with_front' => false ),
			'menu_icon'    => 'dashicons-portfolio',
			'supports'     => array( 'title', 'editor', 'thumbnail', 'excerpt', 'revisions', 'custom-fields' ),
			'template'     => array( array( 'core/paragraph', array( 'placeholder' => 'Describe the project…' ) ) ),
		)
	);
}
add_action( 'init', 'pfxc_register_post_types' );

register_activation_hook( __FILE__, function () { pfxc_register_post_types(); flush_rewrite_rules(); } );
register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );
```

- Post type keys ≤ 20 chars, prefixed, lowercase.
- `show_in_rest => true` or the block editor will not open it.
- Flush rewrite rules on activation only, never on `init`.
- The plugin uses its own prefix (`pfxc_`) and text domain.

---

## mu-plugin vs regular plugin

| | Regular plugin (`plugins/`) | Must-use plugin (`mu-plugins/`) |
| --- | --- | --- |
| Can be deactivated by client | yes | no |
| Auto-updates / wp.org hosting | possible | no |
| Subfolders | yes | only a loader file at root (`mu-plugins/{slug}-core.php` that `require`s the folder) |
| Activation hooks | yes | no (no activation; flush rewrites another way) |
| Best for | agency default; client sees it and the description says "keep active" | sites where the client must not be able to disable it |

Default to a regular plugin with a clear description. Use an mu-plugin loader when the
client environment is locked down or the site would break without it.

---

## How theme and plugin talk to each other

- **Theme depends on plugin, never the reverse.** The plugin must work with Twenty
  Twenty-Six active.
- Theme guards everything plugin-provided:
  ```php
  if ( post_type_exists( 'pfx_project' ) ) { /* render projects */ }
  if ( function_exists( 'get_field' ) ) { $hero = get_field( 'hero' ); }
  if ( class_exists( 'WooCommerce' ) ) { /* woo templates */ }
  ```
- Theme provides templates for plugin content: `single-pfx_project.php` /
  `templates/single-pfx_project.html`, `archive-pfx_project.*`.
- Plugin exposes hooks (`do_action( 'pfxc_after_project_meta' )`) that the theme can
  use; the theme exposes hooks (`pfx_after_header`) that the plugin can use.
- Shared design tokens: plugin CSS uses `var(--wp--preset--*)` from the theme's
  `theme.json`, with sensible fallbacks.
- Custom blocks: registered by the plugin, styled by the theme in `theme.json`
  `styles.blocks["pfx/card"]`.
- Show a dismissible admin notice from the theme if the companion plugin is missing,
  with a link to install it (from wp.org or an internal repo), never auto-install.

---

## Recommending plugins

- Only recommend plugins hosted on WordPress.org (review rule); for client projects,
  premium plugins are fine but document licences.
- Use a plain admin notice or `readme.txt`; TGM Plugin Activation is permitted but
  bulky. Never bundle zips.
- Keep the theme functional without them.
- Typical client stack to recommend (design-agnostic): SEO plugin, forms plugin,
  caching (host-level preferred), backups, security, image optimisation, ACF (if hybrid).

---

## Grey areas and how to decide

Ask: **"If the client switches to Twenty Twenty-Six tomorrow, should this keep working?"**

| Feature | Decision |
| --- | --- |
| Restricting blocks in the editor (`allowed_block_types_all`) | Plugin for wp.org themes. For client work, either is accepted; prefer the plugin since it is editorial policy, not design |
| Disabling emojis / oEmbed scripts for performance | Plugin for wp.org themes; acceptable in private client themes if documented |
| Custom image sizes | Theme (presentation) |
| Excerpt length / read-more text | Theme (presentation) |
| Custom `body_class` / `post_class` | Theme |
| Breadcrumbs markup | Theme if purely from core data; plugin if it needs settings/schema |
| Related posts query | Theme (query + markup) unless it needs settings/caching logic |
| Custom login logo/colours | Plugin (admin), though harmless in a client theme |
| Google Fonts loader | Theme, self-hosted only |
| Cookie consent | Plugin |
| Schema.org markup | Plugin (SEO) |
| `pre_get_posts` tweaks | Theme if it only affects what the theme displays (posts per page on home); plugin if it changes site behaviour (excluding a CPT from search) |
| Menu locations, widget areas, theme supports | Theme |
| Custom REST endpoint for "load more" | Theme is tolerated; plugin is cleaner |
