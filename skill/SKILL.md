---
name: wordpress-theme-builder
description: >-
  Build, audit, or extend custom WordPress themes (block/FSE, classic, or
  hybrid) the way a senior WordPress developer does: WordPress core rules,
  WordPress.org Theme Review requirements, security (escaping, sanitizing,
  nonces, capabilities, prefixing), WordPress Coding Standards, theme.json v3,
  accessibility, i18n and Core Web Vitals. Use when the user wants to create a
  theme for a client or themselves, scaffold a starter theme, write theme.json,
  templates, patterns, template parts or functions.php, convert a design to a
  theme, add a feature to an existing theme, or asks whether a theme is secure,
  compliant or "done right".
argument-hint: "[new|audit|extend] [theme-slug]"
---

# WordPress Theme Builder

Work like a senior WordPress theme developer delivering to a paying client.
Presentation lives in the theme, content structure lives in a companion plugin,
every line passes PHPCS, and the WordPress.org Theme Review rules are the quality
bar even for private themes.

Scripts live in `${CLAUDE_SKILL_DIR}/scripts`; templates and configs in
`${CLAUDE_SKILL_DIR}/assets`. Deep rules are in `references/`; read the file that
matches the current step instead of guessing.

## Principles (always on)

1. **Theme = presentation.** CPTs, taxonomies, custom blocks, shortcodes, SEO,
   analytics, forms, roles: companion plugin. See [plugin-territory.md](references/plugin-territory.md).
2. **Security is not optional.** Escape late, sanitize early, nonce + capability
   on every write, prefix everything. See [security.md](references/security.md).
3. **Code must pass PHPCS `WordPress` standard** with zero errors. Do not ship code
   you have not linted (real PHPCS if available, the bundled audit script otherwise).
4. **Block theme by default for new sites**, hybrid when the project needs PHP
   control or a page builder/ACF, classic only for legacy constraints.
   See [theme-types.md](references/theme-types.md).
5. **Accessible and fast by construction**: skip link, focus styles, landmarks,
   contrast; deferred JS, self-hosted fonts, conditional assets.
6. **Never invent WordPress APIs.** If unsure a function/hook exists, check the
   references or say so; do not guess a name.

## Mode selection

| User wants | Mode | Start at |
| --- | --- | --- |
| A new theme (client or personal) | **new** | Step 0 |
| "Is my theme secure / compliant / good?" or review an existing theme | **audit** | Step 4 with the existing folder |
| Add a template, pattern, feature, style to an existing theme | **extend** | Read the theme's `style.css`, `functions.php`, `theme.json`; match its type and prefix; then Step 3 rules apply to every new line; finish with Step 4 |
| Customise a purchased/third-party theme | **child theme** | [child-themes.md](references/child-themes.md), then Step 3/4 |

## Step 0: Discovery (new mode)

Ask only what is not already known, in one short message, with defaults offered.
Full list: [discovery-questions.md](assets/checklists/discovery-questions.md).
Minimum you need before scaffolding:

- Client vs personal; who edits content after launch and how technical they are
- Site type and required page types; any custom content (projects, team, events)
- Design source (Figma/screenshots) or "propose a layout"
- WordPress and PHP versions on the host (default 7.0 / 8.1+; declare 6.7 / 7.4 minimums)
- Plugins that must be supported (WooCommerce, ACF, page builder, forms)
- Theme name, slug, prefix (≥4 letters), author

## Step 1: Choose the theme type

Apply the decision matrix in [theme-types.md](references/theme-types.md). State
the choice and the one-paragraph reason. Respect an explicit user choice; note
trade-offs briefly.

## Step 2: Scaffold

```bash
node "${CLAUDE_SKILL_DIR}/scripts/check-tools.js"
node "${CLAUDE_SKILL_DIR}/scripts/scaffold-theme.js" --type block --slug my-theme --name "My Theme" --prefix mytm --author "Agency" --out ./wp-content/themes/my-theme --with-plugin
```

- `--type block|classic|hybrid`; `--with-plugin` creates `../my-theme-core` for
  content types; `--no-configs` skips PHPCS/Composer/npm/wp-env configs; `--dry-run`
  previews.
- The scaffold ships: valid `style.css` headers, `theme.json` v3, templates/parts/
  patterns (block) or PHP templates + `inc/` split (classic/hybrid), companion plugin
  skeleton, `.phpcs.xml.dist`, `composer.json`, `package.json`, `.wp-env.json`,
  placeholder `screenshot.png`, `readme.txt`. It passes PHPCS and the audit as
  generated.
- Then build the real design on top of it. Do not hand-write a skeleton from scratch
  when the scaffold exists.

For the details of each architecture while building:
[block-theme.md](references/block-theme.md) ·
[classic-theme.md](references/classic-theme.md) ·
[theme-json.md](references/theme-json.md)

## Step 3: Build rules (non-negotiable while writing any theme code)

Security
- Every `echo`/`print`/`printf`/`<?=` prints through `esc_html()`, `esc_attr()`,
  `esc_url()`, `wp_kses_post()`, `wp_json_encode()` or a core function that
  self-escapes (`the_title()`, `the_permalink()`, `body_class()`, `wp_nav_menu()`).
- `__()` / `_e()` are not escaped: use `esc_html__()`, `esc_html_e()`, `esc_attr__()`,
  `esc_html_x()`; wrap `_n()` in `esc_html()`.
- Superglobals: `isset()` → `wp_unslash()` → `sanitize_*()` → validate. Never raw.
- Any state change: `wp_verify_nonce()`/`check_admin_referer()`/`check_ajax_referer()`
  **and** `current_user_can( 'edit_theme_options' )` (capabilities, never roles).
- `$wpdb` only with `$wpdb->prepare()`; prefer `WP_Query`/`get_posts()`.
- Customizer `add_setting()` always has `sanitize_callback` and `capability`.
- Never: `eval`, `base64_decode`, `extract`, `query_posts`, `curl_*`,
  `file_get_contents( url )`, filesystem writes, `header('Location')`, `ini_set`,
  bundling/deregistering jQuery, hiding the admin bar, activation redirects.
- Includes start with `defined( 'ABSPATH' ) || exit;`.

Structure and standards
- Prefix (≥4 chars) on every function, class, constant, global, option, transient,
  theme mod, script/style handle, image size, hook name, pattern slug (`slug/name`).
- Text domain = theme slug, literal string, on every user-facing string; `translators:`
  comment above every placeholder string; no concatenated fragments.
- `functions.php` holds constants + `require`s only; logic split into `inc/` by concern.
- WPCS formatting: tabs, spaces inside parens, Yoda conditions, `array()`, strict
  comparisons, braces always, DocBlocks on every function/file.
  See [coding-standards.md](references/coding-standards.md).
- Templates loaded only via `get_header()`, `get_footer()`, `get_template_part()`,
  `comments_template()`, `get_search_form()`; never `include`.
- Classic/hybrid required: `language_attributes()`, `wp_head()`, `wp_body_open()`,
  `body_class()`, `post_class()`, `wp_footer()`, `wp_link_pages()`, `title-tag` and
  `automatic-feed-links` supports, no `<title>`.
- Block: `templates/index.html`, `theme.json` `"version": 3` with `$schema`, template
  parts declared with `area`, `"inherit":true` on archive Query Loops, no literal text in
  `templates/`/`parts/` that must be translatable (use patterns), valid block delimiters.

Assets and performance
- All CSS/JS via `wp_enqueue_*` on the right hook, versioned with the theme version,
  `array( 'strategy' => 'defer' )` for theme JS, conditional per template/block,
  `wp_enqueue_block_style()` for per-block CSS. No hard-coded `<script>`/`<link>`.
- Core-bundled libraries (jQuery, React, lodash) used from core as dependencies.
- Fonts self-hosted WOFF2 with `font-display: swap` (theme.json `fontFace`); no Google
  Fonts `<link>`; preload at most two files.
- Images through `wp_get_attachment_image()`/`the_post_thumbnail()`; LCP image
  `loading="eager"` + `fetchpriority="high"`; prefixed `add_image_size()` only for sizes used.
- Design tokens in `theme.json`; CSS references `var(--wp--preset--*)`, never duplicates
  literal values. See [assets-performance.md](references/assets-performance.md).

Accessibility
- Skip link first focusable (classic adds it; block gets it from core with a `<main>`),
  exactly one `<main>` and one `<h1>`, `aria-label` on every `<nav>`, visible
  `:focus-visible` outline, 4.5:1 contrast for every palette pair, labels on inputs,
  `prefers-reduced-motion` respected. See [accessibility.md](references/accessibility.md).

Content and hand-off
- Nothing content-structural in the theme; guard plugin-provided things with
  `post_type_exists()` / `function_exists()` / `class_exists()`.
- Client-proof the editor: curated palette (`custom: false`, `defaultPalette: false`),
  `templateLock`, curated patterns, restricted blocks (plugin).
- No tracking, no remote calls, no upsells, no bundled plugin zips, no forbidden files.

## Step 4: Audit loop (every mode, before saying "done")

1. `node "${CLAUDE_SKILL_DIR}/scripts/audit-theme.js" <theme-dir>` → fix every
   ERROR, review every WARNING. Pass `--prefix pfx` if detection is wrong. This is a
   heuristic; it does not replace PHPCS.
2. If PHP + Composer exist: `composer install` in the theme (config from the scaffold
   or copy `assets/configs/composer.json` + `phpcs.xml.dist`), then `vendor/bin/phpcs`
   → zero errors. `vendor/bin/phpcbf` auto-fixes formatting. Run `php -l` on each file.
3. theme.json / style variations: validate against the `$schema`
   (`npx ajv-cli@5 validate -s <schema.json> -d theme.json --spec=draft7 --strict=false`).
4. If Docker + Node exist: `npx @wordpress/env start` with the scaffolded `.wp-env.json`
   (installs Theme Check + Query Monitor), activate the theme
   (`npx @wordpress/env run cli wp theme activate <slug>`), `curl` home/single/page/
   archive/search/404 and grep for `Fatal|Warning:|Notice:`, check `wp-content/debug.log`
   is empty, then run Theme Check headlessly with `scripts/theme-check.php`
   (see [tooling.md](references/tooling.md)); fix REQUIRED/WARNING.
5. Walk [theme-review-checklist.md](references/theme-review-checklist.md) for the
   sections that apply and [pre-launch.md](assets/checklists/pre-launch.md) before
   release. Copy the relevant checklist into the response and tick what you verified;
   never tick an item you did not actually check.
6. Repeat until clean. Report remaining warnings with a one-line justification each.

Tool setup details: [tooling.md](references/tooling.md).

## Step 5: Hand-off (client work)

Deliver `readme.txt`, developer `README.md`, `CHANGELOG.md`, versioned zip from a clean
export, editor guide, plugin list with licences, accessibility/performance statement,
and a "do not touch" list. Version bump in `style.css`, `readme.txt`, `package.json`.
See [client-handoff.md](references/client-handoff.md).

## Quick reference

Escaping by output context

| Context | Function |
| --- | --- |
| Text between tags | `esc_html()` / `esc_html__()` / `esc_html_e()` |
| Attribute value | `esc_attr()` / `esc_attr__()` / `esc_attr_e()` |
| `href` / `src` / any URL | `esc_url()` (storage/redirect: `esc_url_raw()`) |
| Textarea content | `esc_textarea()` |
| HTML that must keep tags | `wp_kses_post()` / `wp_kses( $html, $allowed )` |
| Data for JS | `wp_json_encode()` via `wp_add_inline_script()` |
| Inline JS string (avoid) | `esc_js()` |
| Integer | `absint()` / `(int)` |

Sanitizing by input type

| Input | Function |
| --- | --- |
| Text line / paragraph | `sanitize_text_field()` / `sanitize_textarea_field()` |
| Email / URL | `sanitize_email()` + `is_email()` / `sanitize_url()` |
| ID / number | `absint()` / `intval()` / `floatval()` |
| Slug / key / class / colour | `sanitize_key()` / `sanitize_title()` / `sanitize_html_class()` / `sanitize_hex_color()` |
| One of N choices | `in_array( $v, $allowed, true ) ? $v : $default` |
| Rich HTML | `wp_kses_post()` |
| Checkbox | `isset( $v ) && true === (bool) $v` |

Required `style.css` headers: Theme Name, Author, Description, Version (X.X.X),
Requires at least (X.X), Tested up to (X.X), Requires PHP (X.X), License,
License URI, Text Domain (= slug). Child themes add `Template: parent-slug`.

## Reference index

- [theme-types.md](references/theme-types.md): block vs classic vs hybrid decision matrix, structures, migrations
- [security.md](references/security.md): escaping, sanitizing, nonces, capabilities, `$wpdb`, Customizer, AJAX/REST, forbidden functions, before/after examples
- [coding-standards.md](references/coding-standards.md): WPCS PHP/JS/CSS/HTML, naming, file organisation, i18n, DocBlocks, namespaces
- [theme-json.md](references/theme-json.md): v3 settings/styles, presets, variations, WordPress 7.0 additions, gotchas
- [block-theme.md](references/block-theme.md): templates, parts, patterns, block markup, functions.php, locking
- [classic-theme.md](references/classic-theme.md): template hierarchy, required hooks, loops, menus, widgets, comments, Customizer, hybrid additions
- [assets-performance.md](references/assets-performance.md): enqueue rules, defer/async, conditional loading, fonts, images, CWV, build pipeline
- [accessibility.md](references/accessibility.md): accessibility-ready criteria, landmarks, focus, contrast, forms, testing
- [plugin-territory.md](references/plugin-territory.md): what never goes in a theme, companion plugin pattern, grey areas
- [theme-review-checklist.md](references/theme-review-checklist.md): WordPress.org required rules as checkboxes
- [child-themes.md](references/child-themes.md): when, minimum files, style loading, overrides, load order
- [tooling.md](references/tooling.md): PHPCS+WPCS setup, Theme Check, Unit Test data, wp-env, wp-scripts, CI, packaging
- [client-handoff.md](references/client-handoff.md): deliverables, versioning, client-proofing, docs, deployment, training
- [discovery-questions.md](assets/checklists/discovery-questions.md) · [pre-launch.md](assets/checklists/pre-launch.md)

## Scripts

- `scripts/scaffold-theme.js`: generate a block/classic/hybrid theme (+ companion plugin, configs). Run it; do not read it.
- `scripts/audit-theme.js <dir> [--prefix p] [--json] [--quiet]`: heuristic security/standards/review audit. Exit 1 on errors.
- `scripts/check-tools.js`: detect php/composer/node/npm/docker/wp-cli and say which real checks can run.
- `scripts/theme-check.php`: run the Theme Check plugin headlessly via `wp eval-file`; exit 1 on REQUIRED/WARNING.

## Response style

- Before scaffolding: one short discovery message, then the type decision with reason.
- While building: show the files you create with full content; explain non-obvious
  choices in one line each; never paste large reference material into the reply.
- After auditing: the checklist with verified ticks, the exact commands run and their
  results, remaining warnings with justification, and the next steps for the user.
- Never claim PHPCS/Theme Check passed unless you ran it and saw the output.
