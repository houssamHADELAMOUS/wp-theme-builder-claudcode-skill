# WordPress Theme Builder — a Claude Code skill

A [Claude Code skill](https://code.claude.com/docs/en/skills) that makes Claude build,
audit and extend custom WordPress themes the way a senior WordPress developer does.

It encodes:

- **WordPress core rules**: template hierarchy, required hooks and functions, block theme
  structure, `theme.json` v3, WordPress 7.0 additions
- **Security**: escaping, sanitizing, nonces, capabilities, `$wpdb->prepare()`, prefixing,
  forbidden functions, Customizer and REST/AJAX patterns
- **WordPress Coding Standards** (PHPCS `WordPress` ruleset), i18n, DocBlocks
- **WordPress.org Theme Review requirements** as a checklist, applied to private client
  themes too
- **Plugin territory**: what never goes in a theme and the companion-plugin pattern
- **Accessibility** (accessibility-ready + WCAG 2.2 AA) and **performance** (Core Web
  Vitals, enqueue strategy, fonts, images)
- **Tooling**: PHPCS + WPCS, Theme Check, Theme Unit Test data, wp-env, wp-scripts
- **Client hand-off**: versioning, docs, client-proofing the editor, deployment

Plus three zero-dependency Node scripts: a **theme scaffolder** (block, classic, hybrid,
with companion plugin and dev configs), a **heuristic audit** (escaping, input handling,
prefixes, plugin territory, deprecated functions, i18n, block markup, review rules), and a
**tool detector**.

## Install

Requires Claude Code. Node 18+ is needed for the scripts; PHP + Composer for real PHPCS;
Docker for wp-env.

**Windows (PowerShell)**

```powershell
git clone https://github.com/<you>/wordpress-theme-builder-skill.git
cd wordpress-theme-builder-skill
.\install.ps1            # symlinks skill/ -> %USERPROFILE%\.claude\skills\wordpress-theme-builder
.\install.ps1 -Copy      # or copy instead of symlink
```

**macOS / Linux**

```bash
git clone https://github.com/<you>/wordpress-theme-builder-skill.git
cd wordpress-theme-builder-skill
./install.sh             # symlinks skill/ -> ~/.claude/skills/wordpress-theme-builder
./install.sh --copy      # or copy instead of symlink
```

**Project-only install**: copy or symlink `skill/` to `<repo>/.claude/skills/wordpress-theme-builder`
inside the WordPress project and commit it so the whole team gets it.

Restart Claude Code (or start a new session). The skill appears as
`/wordpress-theme-builder` and also triggers automatically when you talk about building
or reviewing a WordPress theme.

## Usage

Just talk to Claude:

- "Build me a custom WordPress theme for a bakery client. They will edit content
  themselves." → discovery questions, theme-type decision, scaffold, build, audit.
- "Is the theme in `wp-content/themes/acme` secure and WordPress-compliant?" → audit mode.
- "Add a testimonials pattern and a projects archive template to my theme." → extend mode.
- "Create a child theme of Twenty Twenty-Six for this client." → child-theme guidance.

Or invoke explicitly:

```
/wordpress-theme-builder new acme-theme
/wordpress-theme-builder audit
```

The scripts can also be run by hand:

```bash
node ~/.claude/skills/wordpress-theme-builder/scripts/check-tools.js
node ~/.claude/skills/wordpress-theme-builder/scripts/scaffold-theme.js --type block --slug acme --name "Acme" --prefix acme --author "Agency" --out ./wp-content/themes/acme --with-plugin
node ~/.claude/skills/wordpress-theme-builder/scripts/audit-theme.js ./wp-content/themes/acme
```

## What the scaffold produces

| Type | Contents |
| --- | --- |
| `block` | `style.css`, `theme.json` v3 (curated palette, fluid type, spacing scale, button/link states), `templates/` (index, home, single, page, page-landing, archive, search, 404), `parts/` (header, footer), `patterns/` (hero, features, cta, post-card, no-results, 404, footer-columns), `styles/dark.json`, `functions.php` + `inc/`, per-block CSS, `readme.txt`, placeholder `screenshot.png` |
| `classic` | `style.css`, settings-only `theme.json`, `index/single/page/archive/search/404/header/footer/sidebar/comments/searchform.php`, `template-parts/content/*`, `inc/` (setup, enqueue, template-tags, template-functions, customizer), accessible mobile navigation JS, `assets/css/main.css` using theme.json variables, `readme.txt`, `screenshot.png` |
| `hybrid` | classic + full `theme.json` (styles), `patterns/`, block styles, pattern categories, remote-pattern opt-out |
| `--with-plugin` | `<slug>-core` plugin: CPT + taxonomy + meta examples, auto block registration, block category, editor block allow-list |
| configs | `.phpcs.xml.dist`, `composer.json` (WPCS 3, PHPCompatibilityWP), `package.json` (wp-scripts, wp-env), `.wp-env.json`, `.editorconfig`, `.gitignore`, `.gitattributes` |

## Verification status

Checked on 2026-09-12 against a fresh scaffold of each type (WordPress 7.1, PHP 8.2 in
wp-env, WPCS 3.x):

| Check | block | classic | hybrid | companion plugin |
| --- | --- | --- | --- | --- |
| `scripts/audit-theme.js` | 0 errors | 0 errors | 0 errors | n/a |
| PHPCS `WordPress` + `PHPCompatibilityWP` | 0 errors, 0 warnings | 0 / 0 | 0 / 0 | 0 / 0 |
| `php -l` | ok | ok | ok | ok |
| `theme.json` / `styles/*.json` vs official schema | valid | valid | valid | n/a |
| Theme Check plugin (headless) | PASS, 0 required/warning | PASS | PASS | n/a |
| Home / single / page / archive / search / 404 rendered with `WP_DEBUG` | no notices | no notices | no notices | CPT single + archive render |

The audit script was also run against the core default themes: Twenty Twenty-Five reports
only the expected "Twenty" naming rule; older classic defaults report the same spots
PHPCS flags.

## Repository layout

```
skill/                     the installable skill
├── SKILL.md               workflow + non-negotiable rules (loaded when triggered)
├── references/            deep rules, loaded on demand
├── scripts/               scaffold-theme.js, audit-theme.js, check-tools.js
└── assets/
    ├── templates/         block/, classic/, hybrid/ (token-based)
    ├── companion-plugin/  <slug>-core plugin skeleton
    ├── configs/           phpcs, composer, package.json, wp-env, editorconfig, gitignore
    └── checklists/        discovery-questions.md, pre-launch.md
install.ps1 / install.sh   symlink or copy skill/ into ~/.claude/skills
```

## Evaluation scenarios

Use these to check the skill after changes (see the skill authoring guide's advice to
build evaluations first):

1. **New block theme**: "Build a block theme for a photography portfolio; the client is not
   technical." Expected: discovery questions, recommends block theme, runs the scaffold,
   creates a projects CPT in the companion plugin (not the theme), builds patterns,
   runs the audit and PHPCS, reports the checklist.
2. **Audit a classic theme**: point it at a theme with `echo $_GET['x']`, unprefixed
   functions and `register_post_type()` in `functions.php`. Expected: each issue found
   with file:line and a concrete fix; no false "passed" claims.
3. **Extend**: "Add a pricing pattern and a `single-event` template to this existing hybrid
   theme." Expected: matches the theme's prefix/text domain, uses `theme.json` presets,
   adds the pattern with a proper header, re-runs the audit.
4. **Negative**: "Write a React component for a dashboard." Expected: skill does not trigger.

## Updating the references

The references reflect WordPress 7.0 (May 2026), `theme.json` v3, WPCS 3.x. When a new
WordPress version changes theme APIs, update `references/theme-json.md`,
`references/block-theme.md`, the `Tested up to` values in `assets/templates/*/style.css`
and `readme.txt`, and the scaffold defaults in `scripts/scaffold-theme.js`.

## Sources

- [Theme Handbook](https://developer.wordpress.org/themes/)
- [Theme Review: Required](https://make.wordpress.org/themes/handbook/review/required/)
- [Security: Escaping](https://developer.wordpress.org/apis/security/escaping/),
  [Sanitizing](https://developer.wordpress.org/apis/security/sanitizing/),
  [Nonces](https://developer.wordpress.org/apis/security/nonces/)
- [WordPress Coding Standards](https://github.com/WordPress/WordPress-Coding-Standards)
- [theme.json version 3](https://make.wordpress.org/core/2024/06/19/theme-json-version-3/)
- [WordPress 7.0 source of truth](https://gutenbergtimes.com/wordpress-7-0-source-of-truth/)
- [Claude Code skills](https://code.claude.com/docs/en/skills) and
  [skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

## License

MIT. Generated themes are yours; WordPress themes are typically distributed under GPLv2+.
