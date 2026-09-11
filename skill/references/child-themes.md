# Child Themes

## Contents

- When a child theme is the right answer
- Minimum files
- Loading parent and child styles
- Overriding templates, parts, patterns, theme.json
- functions.php load order and overridable functions
- Child-theme-aware functions
- Pitfalls

---

## When a child theme is the right answer

| Situation | Answer |
| --- | --- |
| Customising a purchased/third-party theme that receives updates | Child theme (never edit the parent) |
| Small tweaks to a default theme (Twenty Twenty-Six) for a quick site | Child theme |
| Custom design for a client | Custom theme, not a child of a framework, unless the agency has its own maintained parent |
| Multi-site with shared base design and per-site variations | Parent (agency base) + child per site, or one block theme with style variations |
| Block theme: only colours/fonts differ | Style variation, not a child |
| "I need to add a CPT" | Companion plugin, never a child theme |

---

## Minimum files

```
my-child/
├── style.css        # headers with Template: parent-slug
├── functions.php    # enqueue, overrides (optional but nearly always present)
├── screenshot.png
└── (theme.json, templates/, parts/, patterns/, template-parts/ … only what you override)
```

`style.css`:
```css
/*
Theme Name:        Parent Name Child
Theme URI:         https://example.com/
Description:       Child theme of Parent Name for Client.
Author:            Agency
Author URI:        https://example.com/
Template:          parent-slug
Version:           1.0.0
Requires at least: 6.7
Tested up to:      7.0
Requires PHP:      7.4
License:           GNU General Public License v2 or later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html
Text Domain:       parent-slug-child
*/
```

`Template` must equal the parent's **folder name**.

---

## Loading parent and child styles

WordPress does not auto-load the parent stylesheet. Enqueue both, in order, with the
child depending on the parent:

```php
function pfxc_enqueue_styles() {
	$parent = wp_get_theme( get_template() );
	$child  = wp_get_theme();

	wp_enqueue_style(
		'parent-style',
		get_template_directory_uri() . '/style.css',
		array(),
		$parent->get( 'Version' )
	);
	wp_enqueue_style(
		'pfxc-child-style',
		get_stylesheet_uri(),
		array( 'parent-style' ),
		$child->get( 'Version' )
	);
}
add_action( 'wp_enqueue_scripts', 'pfxc_enqueue_styles' );
```

Check the parent first: many parents enqueue `style.css` themselves or load CSS from
`assets/`. Match the parent's handle so you can add a dependency and avoid loading the
parent CSS twice. Default themes vary; read the parent's `functions.php`.

Block-theme parents often have an empty `style.css`; then only enqueue the child's.

---

## Overriding templates, parts, patterns, theme.json

| What | How |
| --- | --- |
| Classic template (`single.php`, `header.php`) | Copy to the child with the same path; the child's file wins entirely |
| Template part loaded with `get_template_part()` | Same path in the child (`template-parts/content.php`) |
| Block template / part | Same file in `templates/` or `parts/` of the child; replaces the parent's |
| Pattern | Same `Slug` registered later overrides; or add new patterns; child `patterns/` folder is auto-registered too |
| `theme.json` | Child `theme.json` **merges** over the parent's (settings and styles deep-merge; arrays like `palette` replace by slug) |
| Style variations | Child `styles/*.json` are added; parent variations remain available |
| Parent function wrapped in `if ( ! function_exists() )` | Define it in the child; the child's `functions.php` runs first |
| Parent hook callback | `remove_action()` / `remove_filter()` in the child on a later hook (e.g. `after_setup_theme` priority 11) |
| Parent theme support | `remove_theme_support()` in `after_setup_theme` at priority 11+ |
| Images/fonts | Same relative path in the child when the parent uses `get_theme_file_uri()` |

Never copy the parent's `functions.php` into the child; both are loaded.

---

## functions.php load order and overridable functions

1. Child `functions.php` runs **first**.
2. Parent `functions.php` runs second.
3. Then `after_setup_theme`, `init`, etc.

Consequences:
- Parent functions wrapped in `if ( ! function_exists( 'pfx_x' ) )` can be replaced by
  defining `pfx_x()` in the child.
- To alter parent `add_action` registrations, hook later:
  ```php
  function pfxc_tweak_parent() {
  	remove_action( 'wp_head', 'pfx_preload_fonts', 1 );
  	remove_theme_support( 'custom-header' );
  }
  add_action( 'after_setup_theme', 'pfxc_tweak_parent', 11 );
  ```
- The child gets its own prefix (`pfxc_`) and text domain, and loads its own
  translations with `load_child_theme_textdomain()`.

---

## Child-theme-aware functions

| Parent-only (template) | Child-aware (stylesheet) | Prefer |
| --- | --- | --- |
| `get_template_directory()` | `get_stylesheet_directory()` | `get_theme_file_path( 'x' )` (child first, then parent) |
| `get_template_directory_uri()` | `get_stylesheet_directory_uri()` | `get_theme_file_uri( 'x' )` |
| `get_template()` | `get_stylesheet()` | |
| | `get_stylesheet_uri()` = child `style.css` | |

When writing a **parent** that others may child, use `get_theme_file_*()` for assets and
`locate_template()`/`get_template_part()` for includes so children can override. Wrap
template tags in `function_exists()`. Provide hooks (`do_action( 'pfx_before_footer' )`).

When writing a **child**, use `get_stylesheet_directory_uri()` for child assets and
`get_template_directory_uri()` for parent assets explicitly.

---

## Pitfalls

- `Template:` typo → child does not appear or shows "broken theme".
- Enqueuing `style.css` twice (parent already does it) → double CSS.
- Editing the parent "just this once" → lost on update.
- Copying whole parent templates for a one-line change → maintenance burden; prefer
  hooks/filters if the parent exposes them, or override a smaller template part.
- Child `theme.json` `version` must match the parent's (3).
- Child theme of a block theme with a classic `header.php` → ignored; block parents use
  `parts/header.html`.
- Forgetting `screenshot.png` → generic placeholder in the admin.
- Registering CPTs in the child → still plugin territory.
