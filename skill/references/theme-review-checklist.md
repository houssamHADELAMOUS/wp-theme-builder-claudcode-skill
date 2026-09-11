# WordPress.org Theme Review Requirements (as a checklist)

This is the bar for **every** theme, including private client themes. Copy the relevant
sections into your response and tick them off. Source:
[Theme Review Required](https://make.wordpress.org/themes/handbook/review/required/).

## Contents

1. Licensing and copyright
2. Privacy
3. Naming and trademarks
4. Accessibility
5. Security and code quality
6. Functionality and features
7. Plugins
8. Internationalisation
9. Files and resources
10. style.css headers
11. readme.txt
12. Screenshot
13. Stylesheets and scripts
14. Classic theme required functions
15. Block theme required files
16. Theme settings and onboarding
17. Selling, credits, spam
18. Extra checks that senior developers add

---

## 1. Licensing and copyright

- [ ] Theme is GPL-compatible (GPLv2 or later recommended); `License` and `License URI`
      in `style.css`
- [ ] Every bundled third-party resource (fonts, images, icons, JS libs, CSS frameworks)
      is GPL-compatible and listed in `readme.txt` under `== Resources ==` with name,
      author, license, source URL
- [ ] Images in screenshot/patterns are CC0/GPL-compatible (no stock photos with
      restrictive licences, no client photos in a public theme)
- [ ] Theme copyright line `Copyright (C) YEAR Author` in `readme.txt`
- [ ] Front-end copyright shows the **site owner's** name, never the theme author's
- [ ] Original work; not a clone of another theme's design

## 2. Privacy

- [ ] No tracking, analytics, or data collection by default
- [ ] Any opt-in data collection is documented in `readme.txt`
- [ ] No remote requests on the front end without explicit user consent (fonts
      self-hosted or Google Fonts only, and preferably self-hosted for GDPR)
- [ ] No third-party embeds (maps, chat, social widgets) baked into the theme

## 3. Naming and trademarks

- [ ] Theme name does not contain "WordPress", "Theme", or "Twenty *"
- [ ] "WordPress" spelled with capital W and P wherever used
- [ ] No trademarked names/logos (including the WordPress logo) in name, screenshot, or
      assets
- [ ] Theme slug (folder) = text domain = lowercase-hyphen name

## 4. Accessibility

- [ ] Skip link is the first focusable element and targets `<main>` (classic: add it;
      block: core adds it automatically to `<main>`)
- [ ] All controls and links reachable and operable by keyboard
- [ ] Visible focus indicator on links, buttons, form fields, menu items
- [ ] See [accessibility.md](accessibility.md) for the full accessibility-ready list

## 5. Security and code quality

- [ ] All untrusted data sanitized/validated before storage
- [ ] All untrusted data escaped on output
- [ ] Nonce + capability check on every state change
- [ ] No PHP errors, warnings, notices, or deprecations with `WP_DEBUG` on
- [ ] No JS console errors
- [ ] No deprecated WordPress functions or constants
- [ ] Unique prefix (≥4 chars) on all functions, classes, constants, globals, options,
      transients, handles, image sizes, custom slugs
- [ ] No `eval`, `base64_decode`, obfuscated code
- [ ] See [security.md](security.md)

## 6. Functionality and features

- [ ] No core features behind a paywall
- [ ] Admin bar never removed or hidden
- [ ] No redirect on theme activation
- [ ] No removal of non-presentational hooks (`wp_generator`, `feed_links`,
      `feed_links_extra`, `wp_resource_hints`, `adjacent_posts_rel_link_wp_head`,
      `wp_shortlink_wp_head`, `_admin_bar_bump_cb`, `rsd_link`, `rest_output_link_wp_head`,
      `wp_oembed_add_discovery_links`, `wp_oembed_add_host_js`, `rel_canonical`)
- [ ] Admin notices use `admin_notices`, are dismissible, and follow core styling
- [ ] Theme does NOT register: custom post types, taxonomies, custom blocks, shortcodes,
      custom roles/capabilities, custom user contact methods, custom mime types
- [ ] No non-design functionality (SEO, analytics, forms, caching, social sharing)
- [ ] See [plugin-territory.md](plugin-territory.md)

## 7. Plugins

- [ ] Only recommends plugins hosted on WordPress.org
- [ ] Plugins installed only by explicit user action (a link/notice), never
      automatically, never bundled as zip
- [ ] Theme works (degrades gracefully) without the recommended plugins
- [ ] `function_exists()` / `class_exists()` / `post_type_exists()` guards around
      plugin-dependent code

## 8. Internationalisation

- [ ] Every user-facing string wrapped in a gettext function
- [ ] Text domain = theme slug, as a literal string
- [ ] At most two text domains if a framework is bundled
- [ ] `translators:` comments on all placeholder strings
- [ ] `.pot` file in `languages/`
- [ ] RTL support (`rtl.css` or logical CSS properties)

## 9. Files and resources

- [ ] Removed: `.git`, `.svn`, `.hg`, `.bzr`, `node_modules`, `vendor` (unless required
      at runtime), IDE folders (`.idea`, `.vscode`), `__MACOSX`, `.DS_Store`, `thumbs.db`,
      `desktop.ini`, `error_log`, `php.ini`, `web.config`, `.sql`, `.zip`, `.dat`,
      `.wie`, `.lubith`, `dwsync.xml`, favicons, hidden files
- [ ] Allowed XML only: `wpml-config.xml`, `loco.xml`, `phpcs.xml` / `.phpcs.xml.dist`
- [ ] Consistent line endings (LF) via `.editorconfig`
- [ ] Complete theme; no "pro" code paths that are disabled
- [ ] Original (unminified) sources shipped next to any minified file

## 10. style.css headers (required fields)

```
/*
Theme Name:        My Theme
Theme URI:         https://example.com/my-theme          (optional; must be about the theme)
Author:            Author Name
Author URI:        https://example.com                   (optional)
Description:       One or two sentences.
Version:           1.0.0                                 (X.X or X.X.X)
Requires at least: 6.7                                   (X.X)
Tested up to:      7.0                                   (major version only)
Requires PHP:      7.4                                   (X.X)
License:           GNU General Public License v2 or later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html
Text Domain:       my-theme
Tags:              blog, one-column, custom-colors, ...  (only tags from the official list)
Template:          parent-slug                           (child themes only)
*/
```

- [ ] All required fields present, correctly formatted
- [ ] Tags only from the [official tag list](https://make.wordpress.org/themes/handbook/review/required/theme-tags/)
- [ ] `Text Domain` matches the folder slug

## 11. readme.txt

```
=== My Theme ===
Contributors: wporguser
Requires at least: 6.7
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Tags: blog, one-column

Short description.

== Description ==
...

== Installation ==
...

== Frequently Asked Questions ==
...

== Changelog ==
= 1.0.0 =
* Initial release

== Upgrade Notice ==
...

== Resources ==
* Font Name - Author - License - URL
* Image name - Source - License - URL

== Copyright ==
My Theme WordPress Theme, (C) 2026 Author
My Theme is distributed under the terms of the GNU GPL.
```

- [ ] Present, valid, sections above filled

## 12. Screenshot

- [ ] `screenshot.png` (or `.jpg`) present
- [ ] 1200×900 px (4:3), under ~1 MB
- [ ] Shows the actual theme, not an advertisement, no trademarked logos

## 13. Stylesheets and scripts

- [ ] All CSS/JS loaded through `wp_enqueue_style()` / `wp_enqueue_script()` on
      `wp_enqueue_scripts` (front), `admin_enqueue_scripts` (admin, with `$hook_suffix`
      check), `enqueue_block_editor_assets` / `enqueue_block_assets` (editor)
- [ ] No hard-coded `<script>` / `<link rel="stylesheet">` in templates
- [ ] Core-bundled libraries (jQuery, jQuery UI, Underscore, Backbone, React, lodash,
      Masonry, etc.) are used from core, never bundled or deregistered
- [ ] Versioned with the theme version; dependencies declared

## 14. Classic theme required functions

- [ ] `<!DOCTYPE html>` and `language_attributes()`
- [ ] `wp_head()` right before `</head>`
- [ ] `wp_body_open()` right after `<body>`
- [ ] `body_class()` on `<body>`
- [ ] `wp_footer()` right before `</body>`
- [ ] `post_class()` on the article wrapper
- [ ] `wp_link_pages()` after `the_content()` in single/page templates
- [ ] `add_theme_support( 'title-tag' )`; no `<title>` tag in header
- [ ] `add_theme_support( 'automatic-feed-links' )`
- [ ] `get_header()`, `get_footer()`, `get_sidebar()`, `get_search_form()`,
      `comments_template()`, `get_template_part()` / `locate_template()` used to load
      templates, never `include`
- [ ] Capability checks use `edit_theme_options`, not role names
- [ ] Front page displays correctly for both "latest posts" and "static page" settings
      (`front-page.php` handles both or is absent)
- [ ] `index.php` exists (the only required template)
- [ ] Comments work (`comments.php` + `comment_form()` + `wp_list_comments()`)
- [ ] Widget areas registered on `widgets_init` with `register_sidebar()`
- [ ] Nav menu registered with `register_nav_menus()`; falls back gracefully when no
      menu assigned

## 15. Block theme required files

- [ ] `style.css` (headers)
- [ ] `templates/index.html`
- [ ] `theme.json` (`"version": 3`, `$schema`)
- [ ] `readme.txt`
- [ ] Every template complete: all blocks closed, no missing/incorrect closing comments
- [ ] Template parts have an `area` in `theme.json` `templateParts`
- [ ] No hard-coded user-visible text in `templates/` and `parts/` that should be
      editable/translatable; use patterns

## 16. Theme settings and onboarding

- [ ] Any admin page is a sub-page under Appearance, uses core UI components
- [ ] Admin assets enqueued only on the theme's own page (`$hook_suffix` check)
- [ ] `current_user_can( 'edit_theme_options' )` on the page and on save
- [ ] Single option (array) via Settings API, prefixed with slug, sanitized on save
- [ ] No demo import, external calls, or affiliate links in onboarding
- [ ] Modifying core options that affect the front end requires notification and consent

## 17. Selling, credits, spam

- [ ] At most one front-end credit link (Theme URI or Author URI) plus optionally one to
      WordPress.org
- [ ] No front-end upselling; no obtrusive admin upselling
- [ ] Affiliates disclosed; no keyword spam in description/readme/translations

## 18. Extra checks that senior developers add

- [ ] Passes Theme Check plugin with no required/warning items
- [ ] Passes PHPCS `WordPress` + `WordPress-Extra` + `WordPress-Docs` +
      `PHPCompatibilityWP` for the declared PHP range
- [ ] Tested with Theme Unit Test data: every post format, long titles, no-title posts,
      nested comments, images with captions, wide/full alignments, sticky posts, password
      protected, private, scheduled, paginated posts, 404, search with no results,
      author archive, date archives, empty widget areas, no menu assigned
- [ ] Tested logged-in and logged-out, admin bar on and off
- [ ] Tested at 320px, 768px, 1024px, 1440px, 1920px; no horizontal scroll
- [ ] Tested in the block editor: editor styles match front end
- [ ] Core Web Vitals in Lighthouse mobile: LCP < 2.5 s, INP < 200 ms, CLS < 0.1 on
      home, single, archive
- [ ] `WP_DEBUG`, `WP_DEBUG_LOG`, `SCRIPT_DEBUG` on during dev: zero notices
- [ ] Query Monitor shows no duplicate queries from theme code, no slow queries
- [ ] Works with the previous major WordPress version declared in `Requires at least`
- [ ] Works with common plugins the client uses (WooCommerce, ACF, Yoast, forms) if in
      scope, with `function_exists` guards
- [ ] `git` clean: build artefacts ignored, `dist/` or built files committed if the host
      does not build
- [ ] CHANGELOG updated, version bumped in `style.css`, `readme.txt`, `package.json`,
      `PFX_VERSION`
