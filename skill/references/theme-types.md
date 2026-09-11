# Choosing the Theme Type: Block, Classic, or Hybrid

## Contents

- The three types in one table
- Decision matrix
- Recommended defaults
- File structure of each type
- Migration paths
- What clients actually experience

---

## The three types in one table

| | Block (FSE) theme | Classic theme | Hybrid theme |
| --- | --- | --- | --- |
| Templates | `templates/*.html` block markup | `*.php` files | `*.php` files |
| Header/footer | `parts/*.html`, editable in Site Editor | `header.php` / `footer.php` | PHP, optionally with block template parts via `block_template_part()` |
| Global design | `theme.json` (colors, type, spacing, layout, block styles) | CSS + Customizer | `theme.json` for editor presets + CSS |
| Client editing | Full Site Editor: everything visual | Customizer + widgets + menus | Block editor for content, PHP for structure |
| Menus | Navigation block | `wp_nav_menu()` + Menus screen | `wp_nav_menu()` |
| Widgets | Not used (blocks) | Widget areas | Widget areas (block widgets) |
| Patterns | First-class (`patterns/`) | Optional | Yes |
| Style variations | `styles/*.json` | No | Partial (theme.json presets only) |
| PHP in templates | No (only in patterns and functions.php) | Yes | Yes |
| Page builders (Elementor, Bricks, Divi) | Poor fit | Good fit | Good fit |
| ACF-heavy layouts | Possible via ACF Blocks; awkward for full templates | Natural | Natural |
| WooCommerce | Supported (block templates for shop) | Supported (template overrides) | Supported |
| Performance ceiling | Highest (only needed block CSS loads) | Depends on you | Depends on you |
| Learning curve for dev | theme.json + block markup | PHP template hierarchy | Both |
| Direction of WordPress core | Primary | Maintained, no new features | Transitional |

---

## Decision matrix

Score each row; the column with the most marks wins. Ties go to Block for new sites.

| Question | Block | Classic | Hybrid |
| --- | --- | --- | --- |
| Client wants to change layouts/headers themselves without a developer | ✔ | | |
| Client must NOT be able to break the layout (locked design) | ✔ (with `templateLock` + limited Global Styles) | ✔ | ✔ |
| Design is a component system (design tokens, spacing scale) | ✔ | | ✔ |
| Design has bespoke per-template layouts hard to express in blocks | | ✔ | ✔ |
| Site depends on a page builder plugin | | ✔ | ✔ |
| Site depends on ACF flexible content / custom fields for layout | | ✔ | ✔ |
| Existing classic theme being redesigned incrementally | | | ✔ |
| Legacy hosting on PHP < 7.4 or WP < 6.x | | ✔ | |
| Team knows only PHP templating | | ✔ | ✔ |
| Multilingual with WPML/Polylang string translation of layout text | | ✔ | ✔ |
| Site needs many style variations (multi-brand) | ✔ | | |
| Minimal JS/CSS footprint is a hard requirement | ✔ | | |
| Long-term maintenance for 5+ years | ✔ | | ✔ |

---

## Recommended defaults

- **New site, WordPress 6.7+ / 7.0, no page builder, client edits content**: Block theme.
- **New site but the design demands PHP control or the client already uses ACF/Elementor**:
  Hybrid (classic structure + `theme.json` + patterns + block editor support).
- **Redesigning an existing classic site in stages**: Hybrid, migrating template by
  template.
- **Classic only** when locked to legacy PHP/WP versions or the brief explicitly forbids
  the block editor. Even then, add `theme.json` for editor presets; it costs nothing.

State the recommendation and the reason in one paragraph before scaffolding. If the user
already chose, respect it and note trade-offs briefly.

---

## File structure of each type

### Block theme

```
my-theme/
├── style.css               required: headers only (CSS optional)
├── theme.json              required in practice: settings, styles, templateParts, customTemplates
├── templates/
│   ├── index.html          required
│   ├── home.html  front-page.html  singular.html  single.html  page.html
│   ├── archive.html  category.html  search.html  404.html
│   └── page-{slug}.html  single-{post-type}.html  ... (full hierarchy works)
├── parts/
│   ├── header.html  footer.html  sidebar.html  comments.html
├── patterns/
│   └── hero.php  cta.php  posts-grid.php  ... (PHP with header comment)
├── styles/
│   └── dark.json  warm.json  ... (style variations)
│   └── blocks/ sections/ (block-style and section-style variations, WP 6.6+)
├── functions.php           setup, enqueue, block styles, pattern categories
├── inc/                    PHP split by concern
├── assets/  css/  js/  fonts/  images/
├── languages/
├── screenshot.png  readme.txt
```

### Classic theme

```
my-theme/
├── style.css               required: headers + optionally main CSS
├── index.php               required
├── functions.php
├── header.php  footer.php  sidebar.php
├── front-page.php  home.php  single.php  page.php  archive.php  search.php  404.php
├── singular.php  category.php  tag.php  taxonomy.php  author.php  date.php  attachment.php
├── comments.php  searchform.php
├── page-templates/ or templates/   (page templates with "Template Name:" header)
├── template-parts/
│   ├── header/  footer/  content/  (content.php, content-single.php, content-none.php)
├── inc/
│   ├── setup.php  enqueue.php  template-tags.php  template-functions.php  customizer.php
├── assets/  css/  js/  fonts/  images/
├── languages/
├── rtl.css  (or logical properties)
├── screenshot.png  readme.txt
```

### Hybrid theme

Classic structure plus:

```
├── theme.json              settings for editor: palette, font sizes, spacing, layout; styles for blocks
├── patterns/               registered automatically from the folder (WP 6.0+)
├── parts/                  optional block template parts rendered with block_template_part( 'header' )
├── assets/css/editor.css   enqueued with add_editor_style()
├── inc/block-patterns.php  inc/block-styles.php
```

`functions.php` adds: `add_theme_support( 'wp-block-styles' )` (optional),
`'editor-styles'`, `'responsive-embeds'`, `'align-wide'`, `'custom-spacing'`,
`'custom-line-height'`, `'appearance-tools'`. With `theme.json` present, most of those
supports are implied.

---

## Migration paths

**Classic → Hybrid**
1. Add `theme.json` v3 with `settings` only (palette, typography, spacing, layout).
2. Replace hard-coded colours/sizes in CSS with `var(--wp--preset--...)`.
3. Add `patterns/` for reusable sections; replace shortcodes/widgets with blocks.
4. Add `editor.css` so the editor matches the front end.
5. Optionally render header/footer with `block_template_part()` so clients can edit them
   in Appearance → Editor → Patterns → Template Parts.

**Hybrid → Block**
1. Convert `header.php`/`footer.php` to `parts/header.html`/`footer.html`.
2. Convert each PHP template to `templates/*.html`, moving dynamic PHP into patterns or
   core blocks (Query Loop, Post Template, Post Title, etc.).
3. Move `add_theme_support` calls that `theme.json` covers into `theme.json`.
4. Delete Customizer code; replace with Global Styles.
5. Move any remaining PHP logic to a plugin or keep in `functions.php`.

Never migrate content-structure code (CPTs, taxonomies) as part of a theme migration; it
should already be in a plugin (see [plugin-territory.md](plugin-territory.md)).

---

## What clients actually experience

Tell clients in plain words:

- **Block theme**: "You edit everything in one visual editor, including the header and
  footer. I can lock parts so you cannot break them."
- **Classic theme**: "You edit page content in the editor; the header, footer and
  overall layout are fixed by code. Changing those needs a developer. Settings live in
  Customizer."
- **Hybrid**: "Page content is fully editable with blocks and your custom fields; the
  structural layout is code-controlled for reliability."
