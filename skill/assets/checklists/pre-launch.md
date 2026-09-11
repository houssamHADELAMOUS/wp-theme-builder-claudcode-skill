# Pre-launch Checklist

Copy into your response and tick items as you verify them. Every item must be checked
by actually running the tool or opening the page, not by assumption.

```
Theme: ____________  Version: ______  Type: block | classic | hybrid

Automated
- [ ] node scripts/audit-theme.js <theme>  → 0 errors
- [ ] vendor/bin/phpcs → 0 errors (warnings reviewed)
- [ ] php -l on every PHP file
- [ ] Theme Check plugin → no REQUIRED / WARNING
- [ ] theme.json validates against $schema (block/hybrid)
- [ ] npm run lint:js / lint:css (if build exists)
- [ ] WP_DEBUG on: debug.log empty after visiting all template types
- [ ] Browser console clean on all template types

Structure and metadata
- [ ] style.css headers complete (Theme Name, Author, Description, Version, Requires at least, Tested up to, Requires PHP, License, License URI, Text Domain)
- [ ] readme.txt complete with Resources and Copyright
- [ ] screenshot.png 1200x900
- [ ] No forbidden files (.git, node_modules, vendor unless needed, .DS_Store, zips, logs)
- [ ] languages/<slug>.pot generated
- [ ] Companion plugin present for any CPT/taxonomy/block; theme guards its absence

Security
- [ ] All output escaped; all input sanitized; nonces + capabilities on writes
- [ ] All globals prefixed; Customizer settings have sanitize_callback
- [ ] No forbidden functions; no remote assets without consent

Templates (Theme Unit Test data imported)
- [ ] Home (posts) and Front page (static) both correct
- [ ] Single post, all post formats, sticky, password-protected, paginated (<!--nextpage-->)
- [ ] Page, page with children, custom templates
- [ ] Category / tag / author / date / CPT archives, pagination works
- [ ] Search with results and with no results
- [ ] 404
- [ ] Comments: list, nested, form, closed, paginated
- [ ] Images: alignments, captions, galleries, wide/full, very large, very small
- [ ] Long titles, no title, long words/URLs do not break layout
- [ ] Menus: assigned, not assigned, nested 3 levels, mobile toggle
- [ ] Widget areas / template parts: filled and empty
- [ ] Logged in with admin bar: nothing hidden behind it; skip link still first

Editor
- [ ] Editor matches front end (colours, fonts, spacing, widths)
- [ ] All patterns insert without validation errors
- [ ] Style variations switch cleanly (block)
- [ ] Editor-role user cannot break the layout (locks/restrictions applied)

Accessibility
- [ ] Keyboard-only pass on every template type; visible focus everywhere
- [ ] Skip link works; landmarks and heading order correct
- [ ] Contrast checked for every palette pair and variation
- [ ] axe/Lighthouse a11y: no violations
- [ ] Zoom 200% / 320px width: no horizontal scroll
- [ ] prefers-reduced-motion respected

Performance (Lighthouse mobile, no page cache)
- [ ] Home / single / archive: LCP < 2.5 s, INP < 200 ms, CLS < 0.1
- [ ] Theme JS deferred; only needed assets per page
- [ ] LCP image eager + fetchpriority=high; other images lazy
- [ ] Fonts self-hosted, WOFF2, swap, preloaded (max 2)
- [ ] Query Monitor: no duplicate/slow queries from theme

Cross-browser / devices
- [ ] Chrome, Firefox, Safari (macOS + iOS), Edge; Android Chrome
- [ ] 320 / 375 / 768 / 1024 / 1440 / 1920 widths

Hand-off
- [ ] CHANGELOG, version bumped everywhere
- [ ] README.md for developers; editor guide for the client
- [ ] Zip built from clean export and installed on a clean site successfully
```
