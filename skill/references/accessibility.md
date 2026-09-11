# Accessibility (accessibility-ready and WCAG 2.2 AA)

Accessibility is a legal requirement in the EU (EAA, since June 2025), many US
contexts (ADA), and the WordPress.org `accessibility-ready` tag. Build it in; retrofitting
costs more.

## Contents

- Accessibility-ready requirements (WordPress.org)
- Landmarks and structure
- Skip link
- Keyboard and focus
- Navigation menus
- Colour and contrast
- Typography and zoom
- Images and media
- Forms
- Motion
- Block editor considerations
- Testing routine

---

## Accessibility-ready requirements (WordPress.org)

Required to use the `accessibility-ready` tag; treat as required for every client theme:

- [ ] Skip link to main content, first focusable element, visible on focus
- [ ] All functionality reachable and operable with keyboard alone
- [ ] Visible focus style on every focusable element (never removed without replacement)
- [ ] Logical heading hierarchy, one `<h1>` per page (the post/page title on singular)
- [ ] ARIA landmark roles or HTML5 sectioning elements for all regions
- [ ] Link text meaningful (no bare "click here" / "read more" without context)
- [ ] Contrast: 4.5:1 for text, 3:1 for large text and UI components, 3:1 between link
      colour and surrounding text when links are not underlined
- [ ] No content conveyed by colour alone
- [ ] Form fields have programmatic labels; errors are described in text
- [ ] Images: decorative images have empty `alt`; theme-provided images have meaningful
      `alt`; no text in images
- [ ] No positive `tabindex`; no keyboard traps; no auto-playing media with sound
- [ ] Dropdown/sub-menus operable by keyboard (Tab/Enter/Escape) and screen reader
- [ ] Controls have accessible names (`aria-label` on icon-only buttons)
- [ ] `screen-reader-text` class implemented correctly

---

## Landmarks and structure

```html
<header class="site-header">            <!-- banner -->
	<nav aria-label="Primary">…</nav>     <!-- navigation; label each nav -->
</header>
<main id="primary" class="site-main">   <!-- main: exactly one -->
	<article>…</article>
</main>
<aside class="widget-area" aria-label="Sidebar">…</aside>   <!-- complementary -->
<footer class="site-footer">            <!-- contentinfo -->
	<nav aria-label="Footer">…</nav>
</footer>
```

- Multiple `<nav>` elements need distinct `aria-label`s. Block Navigation: set
  `"ariaLabel"` attribute.
- Search form: `<form role="search">` (core `get_search_form()` does this).
- Headings: site title is `<p>` (or `h1` only on the front page in classic themes),
  post title `<h1>` on singular, `<h2>` in lists. Widget titles `<h2>`. Do not skip
  levels for styling; use classes/`theme.json` font sizes.
- `<article>` for posts, `<time datetime="">` for dates, `<figure>/<figcaption>` for
  captions, lists as `<ul>/<ol>`.
- Block themes: `tagName` on template parts (`header`, `footer`) and groups (`main`,
  `aside`, `section`) provides landmarks.

---

## Skip link

Classic (must add manually, first thing inside `<body>` after `wp_body_open()`):
```php
<a class="skip-link screen-reader-text" href="#primary"><?php esc_html_e( 'Skip to content', 'my-theme' ); ?></a>
```
CSS (core's Twenty* pattern):
```css
.screen-reader-text {
	border: 0;
	clip: rect(1px, 1px, 1px, 1px);
	clip-path: inset(50%);
	height: 1px;
	margin: -1px;
	overflow: hidden;
	padding: 0;
	position: absolute !important;
	width: 1px;
	word-wrap: normal !important;
}
.screen-reader-text:focus {
	background-color: var(--wp--preset--color--base, #fff);
	clip: auto !important;
	clip-path: none;
	color: var(--wp--preset--color--contrast, #000);
	display: block;
	font-size: 1rem;
	height: auto;
	left: 5px;
	line-height: normal;
	padding: 15px 23px 14px;
	text-decoration: none;
	top: 5px;
	width: auto;
	z-index: 100000;
}
```
Block themes: core injects the skip link automatically when the template has a `<main>`
element; do not add a second one. Ensure `main` has `tagName` set.

---

## Keyboard and focus

- Never `outline: none` / `outline: 0` without an equally visible replacement.
  Recommended:
  ```css
  :focus-visible { outline: 2px solid var(--wp--preset--color--accent); outline-offset: 2px; }
  :focus:not(:focus-visible) { outline: none; }
  ```
  In `theme.json`: `styles.elements.link[":focus"].outline` and `button[":focus-visible"]`.
- Focus order follows DOM order; do not reorder visually with CSS `order` in a way that
  breaks logic.
- Custom widgets (accordions, tabs, modals, sliders): follow WAI-ARIA Authoring
  Practices patterns; trap focus inside modals and restore on close; Escape closes.
- Slider/carousel: pause button, keyboard arrows, no auto-advance by default, or use
  a static grid instead. Carousels are usually a bad idea.
- Hover-only interactions must also work on focus and touch.
- Links vs buttons: links navigate (`<a href>`), buttons act (`<button>`). Never
  `<a href="#">` or `<div onclick>`.
- Minimum target size 24×24 CSS px (WCAG 2.2 2.5.8); 44×44 recommended on touch.

---

## Navigation menus

Classic theme mobile menu:
```html
<nav id="site-navigation" class="main-navigation" aria-label="Primary">
	<button class="menu-toggle" aria-controls="primary-menu" aria-expanded="false">
		<span class="screen-reader-text">Menu</span>
		<svg aria-hidden="true" focusable="false">…</svg>
	</button>
	<ul id="primary-menu" class="menu">…</ul>
</nav>
```
`navigation.js` toggles `aria-expanded`, adds `.toggled`, closes on Escape, and adds
`.focus` on `li` when a child link is focused so sub-menus open on keyboard (the
Underscores pattern). Sub-menu toggle buttons with `aria-expanded` are better than
hover-only dropdowns.

Block themes: the Navigation block already does this. Set `"overlayMenu":"mobile"` and
an `ariaLabel`.

---

## Colour and contrast

- Body text on background: ≥ 4.5:1. Large text (≥ 24px or ≥ 18.66px bold): ≥ 3:1. UI
  components and focus indicators: ≥ 3:1 against adjacent colours.
- Links without underline: 3:1 against surrounding text **and** a non-colour cue on
  hover/focus. Simplest: underline links in content.
- Check every palette pair you offer in `theme.json`: if editors can pick text `accent`
  on background `secondary`, that pair should pass or `custom` colours should be off and
  the palette curated.
- Placeholder text, disabled states, and captions still need contrast (placeholder is
  often too light).
- Dark style variations: recheck everything.
- Tools: WebAIM contrast checker, the editor's own contrast warning (appears when a user
  picks a failing pair), axe DevTools.

---

## Typography and zoom

- Base font size ≥ 16px; line-height ≥ 1.5 for body; paragraph width ≤ ~75 characters
  (`contentSize` around 640–760px).
- Use `rem`/`em`; text must reflow at 200% zoom and 320px width without horizontal
  scroll (WCAG 1.4.10).
- Fluid type must clamp at a readable minimum (do not go below 1rem for body).
- Do not justify text; avoid all-caps for long strings (screen readers may spell out).
- Respect user font-size preferences (no `html { font-size: 62.5% }` tricks that break
  with browser minimums; prefer `100%`).

---

## Images and media

- Theme-provided decorative images/icons: `alt=""` and `aria-hidden="true"` on inline
  SVG, `focusable="false"`.
- Featured images as links: the link text comes from the post title; add
  `aria-hidden="true" tabindex="-1"` on the image link if the title link is adjacent
  (core's `the_post_thumbnail()` handles `alt` from media library).
- Never put text inside images for headings/CTAs.
- Video: no autoplay with sound; captions track; controls visible.
- Cover blocks with background video: provide a pause control (core does).
- Icon fonts: avoid; use inline SVG with `aria-hidden`.

---

## Forms

- Every input has a `<label for>` (visible preferred; `screen-reader-text` acceptable
  for search).
- Required fields indicated in text, not only colour or `*`.
- Error messages tied to inputs with `aria-describedby`; focus moves to first error.
- Core search form and comment form are accessible when `html5` support is declared.
- Buttons have text (`<button>Search</button>` with icon `aria-hidden`).
- Autocomplete attributes on personal fields (`autocomplete="email"`).

---

## Motion

```css
@media (prefers-reduced-motion: reduce) {
	*, *::before, *::after {
		animation-duration: 0.01ms !important;
		animation-iteration-count: 1 !important;
		transition-duration: 0.01ms !important;
		scroll-behavior: auto !important;
	}
}
```
- No parallax/auto-scrolling content without a way to stop.
- Nothing flashes more than three times per second.

---

## Block editor considerations

- Editor styles (`add_editor_style` / `theme.json`) must keep the same contrast so
  authors see accessible defaults.
- Patterns ship with proper heading levels and `alt` text placeholders; hero pattern
  heading is `h1` only when meant for the front page/page top, else `h2`.
- Do not disable core's contrast checker; do not offer palette pairs that fail.
- Query Loop post titles as links: core handles `aria-current` for pagination.
- Navigation block: keep `openSubmenusOnClick` true for keyboard users when submenus
  exist, or ensure hover menus also open on focus.

---

## Testing routine

1. **Keyboard only**: Tab through home, single, archive, search, 404. Every interactive
   element reachable, visible focus, Escape closes overlays, no traps, skip link works.
2. **Screen reader**: NVDA (Windows) / VoiceOver (macOS): landmarks list, headings list,
   links list make sense; menus announce expanded/collapsed.
3. **Zoom**: 200% and 400% browser zoom; 320px viewport; no horizontal scroll, no
   clipped content.
4. **Automated**: axe DevTools or Lighthouse accessibility audit on each template type;
   fix all violations, review all "needs review" items.
5. **Contrast**: check every palette pair and all style variations.
6. **Reduced motion**: enable OS setting; animations stop.
7. **Content stress**: Theme Unit Test data (long titles, no title, nested lists,
   tables, wide images) with a screen reader.
8. Document the results in the hand-off (see [client-handoff.md](client-handoff.md)).
