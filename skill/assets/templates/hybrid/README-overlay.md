# Hybrid overlay

`scaffold-theme.js --type hybrid` copies `templates/classic/` first, then copies
this folder on top of it. Files here **replace** the classic versions:

- `theme.json` — full settings + styles (from the block template, minus block-only keys)
- `functions.php` — classic requires plus block styles, pattern categories, remote-pattern opt-out
- `inc/block-styles.php`, `inc/block-patterns.php`
- `patterns/*.php` — page-building patterns (hero, cta, features)

This file is not copied into the generated theme.
