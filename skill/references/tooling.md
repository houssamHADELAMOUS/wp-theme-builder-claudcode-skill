# Tooling: Linting, Testing, Local Environments

Use the real tools whenever they can run. The skill's `scripts/audit-theme.js` is a
heuristic fallback, not a replacement for PHPCS and Theme Check.

## Contents

- Detect what is available
- PHPCS with WordPress Coding Standards
- Theme Check plugin
- Theme Unit Test data
- Local environment: wp-env, Local, Docker
- @wordpress/scripts
- theme.json validation
- WP-CLI helpers
- Debugging: WP_DEBUG, Query Monitor
- Git hygiene and CI
- Release packaging

---

## Detect what is available

Run `node ${CLAUDE_SKILL_DIR}/scripts/check-tools.js`. It reports php, composer, node,
npm, wp-cli, docker and prints the install commands for whatever is missing.

Minimum for a credible audit: **php + composer** (PHPCS). Minimum for runtime testing:
**docker + node** (wp-env) or a Local/XAMPP site.

---

## PHPCS with WordPress Coding Standards

Setup once per theme (or globally):

```bash
# In the theme directory
composer init --no-interaction --name=agency/my-theme --type=wordpress-theme
composer config allow-plugins.dealerdirect/phpcodesniffer-composer-installer true
composer require --dev \
	wp-coding-standards/wpcs:^3.1 \
	phpcompatibility/phpcompatibility-wp:^2.1 \
	dealerdirect/phpcodesniffer-composer-installer:^1.0
```

Or copy the bundled `assets/configs/composer.json` and run `composer install`.

Copy `assets/configs/phpcs.xml.dist` to the theme root as `.phpcs.xml.dist` and edit
the `text_domain`, `prefixes`, `minimum_wp_version`, and `testVersion` properties.

Run:
```bash
vendor/bin/phpcs              # report
vendor/bin/phpcs --report=summary
vendor/bin/phpcbf             # auto-fix whitespace/format issues
vendor/bin/phpcs -s path/to/file.php   # show sniff names for targeted ignores
```

Rulesets in the bundled config:
- `WordPress` (Core + Docs + Extra) — formatting, security sniffs (EscapeOutput,
  ValidatedSanitizedInput, NonceVerification), PrefixAllGlobals, I18n.
- `WordPress-Extra` best practices (already included by `WordPress`).
- `PHPCompatibilityWP` with `testVersion` = declared PHP range (e.g. `7.4-`).
- `WordPress.WP.I18n` with `text_domain` property.
- `WordPress.NamingConventions.PrefixAllGlobals` with `prefixes` property.
- `WordPress.WP.DeprecatedFunctions` with `minimum_wp_version`.

Targeted ignores must state a reason:
```php
echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $html built from escaped parts above.
```
Never disable a whole security sniff file-wide.

Zero errors is the bar. Warnings should be reviewed and either fixed or justified.

---

## Theme Check plugin

Runs the WordPress.org review's automated checks (headers, required functions, deprecated
calls, hard-coded scripts, plugin territory, bad files).

- Install in the dev site: `wp plugin install theme-check --activate` or via wp-env
  `.wp-env.json` `"plugins": [ "https://downloads.wordpress.org/plugin/theme-check.zip" ]`.
- Appearance → Theme Check → select theme → Check it.
- Headless (no browser): copy `${CLAUDE_SKILL_DIR}/scripts/theme-check.php` onto the
  site and run `wp eval-file theme-check.php <theme-slug>`; in wp-env:
  ```bash
  docker cp "${CLAUDE_SKILL_DIR}/scripts/theme-check.php" <cli-container>:/var/www/html/theme-check.php
  npx @wordpress/env run cli wp eval-file /var/www/html/theme-check.php my-theme
  ```
  Prints every message and exits 1 on REQUIRED/WARNING.
- Fix every **REQUIRED** and **WARNING**; read **RECOMMENDED** and **INFO**.
- Block themes: it also validates `theme.json`, required templates, and structure.

---

## Theme Unit Test data

Import the official test content to stress every template:

```bash
curl -L -o themeunittestdata.wordpress.xml https://raw.githubusercontent.com/WPTT/theme-unit-test/master/themeunittestdata.wordpress.xml
wp plugin install wordpress-importer --activate
wp import themeunittestdata.wordpress.xml --authors=create
```

Then walk: home, every post format, "Markup: HTML Tags and Formatting", "Template:
Sticky", "Template: Comments", "Template: Paginated", "Template: Password Protected",
image alignment posts, no-title post, very long title, nested comments, empty search,
404, author/date/category archives, pages with children, block tests (gallery, table,
cover, columns, wide/full).

---

## Local environment: wp-env, Local, Docker

**wp-env** (Docker required): copy `assets/configs/.wp-env.json` next to the theme (or
into the theme root) and run:
```bash
npm install --save-dev @wordpress/env
npx wp-env start          # http://localhost:8888 (admin/password)
npx wp-env run cli wp theme activate my-theme
npx wp-env run cli wp plugin install theme-check query-monitor --activate
npx wp-env stop
npx wp-env destroy
```
`.wp-env.json` example:
```json
{
	"core": null,
	"phpVersion": "8.2",
	"themes": [ "." ],
	"plugins": [ "https://downloads.wordpress.org/plugin/theme-check.zip", "https://downloads.wordpress.org/plugin/query-monitor.zip" ],
	"config": { "WP_DEBUG": true, "WP_DEBUG_LOG": true, "WP_DEBUG_DISPLAY": false, "SCRIPT_DEBUG": true }
}
```
`"core": null` = latest release; pin `"WordPress/WordPress#7.0"` for a specific version.

**Local (localwp.com)**, **Studio (WordPress.com)**, **XAMPP/Laragon**: fine too. Point
the theme folder via symlink or work inside `wp-content/themes`.

Test on the **lowest** WP and PHP versions declared in `style.css` at least once.

---

## @wordpress/scripts

```bash
npm init -y
npm install --save-dev @wordpress/scripts
```
Copy `assets/configs/package.json` scripts. Provides `wp-scripts build/start` (webpack
with WP presets), `lint-js`, `lint-style`, `lint-md-docs`, `format`, `packages-update`,
`plugin-zip` (works for themes with a `files` field in package.json).

Only add a build step if the project needs Sass/PostCSS/JS bundling. Plain CSS + JS is
a valid professional choice for small themes.

---

## theme.json validation

- VS Code: the `$schema` key gives inline validation and autocomplete.
- CLI:
  ```bash
  npx --yes ajv-cli@5 validate -s https://schemas.wp.org/wp/7.0/theme.json -d theme.json --spec=draft7 --strict=false
  ```
  (fetch the schema to a file first if ajv cannot load URLs in your environment).
- The skill's `audit-theme.js` checks `version: 3`, presence of `$schema`, and JSON
  syntax; it does not validate the schema.

---

## WP-CLI helpers

```bash
wp theme activate my-theme
wp theme list --status=active
wp i18n make-pot . languages/my-theme.pot --domain=my-theme
wp scaffold child-theme my-child --parent_theme=my-theme
wp eval 'var_dump( wp_get_theme()->get( "Version" ) );'
wp rewrite flush
wp cache flush
wp option get stylesheet
```
Install: `composer global require wp-cli/wp-cli-bundle` or the phar from wp-cli.org.

---

## Debugging: WP_DEBUG, Query Monitor

`wp-config.php` (dev only):
```php
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );      // wp-content/debug.log
define( 'WP_DEBUG_DISPLAY', false );
define( 'SCRIPT_DEBUG', true );
define( 'WP_DISABLE_FATAL_ERROR_HANDLER', true );
```
- Zero notices/warnings/deprecations in `debug.log` from the theme.
- Query Monitor: check Queries (duplicates, slow), Hooks, Scripts/Styles (deps,
  positions), Template (which files loaded), Conditionals, PHP errors.
- Block editor: open the browser console; block validation errors appear there.

---

## Git hygiene and CI

`.gitignore` (bundled in `assets/configs/.gitignore`): `node_modules/`, `vendor/`,
`.DS_Store`, `*.log`, `.idea/`, `.vscode/`, `*.zip`; keep `build/` committed if the
host does not run Node.

Minimal GitHub Actions job:
```yaml
name: lint
on: [push, pull_request]
jobs:
  phpcs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with: { php-version: '8.2', tools: composer }
      - run: composer install --no-interaction --prefer-dist
      - run: vendor/bin/phpcs
      - run: for f in $(git ls-files '*.php'); do php -l "$f"; done
```
Add `npm ci && npm run lint:js && npm run build` when a build exists.

---

## Release packaging

- Bump version in `style.css`, `readme.txt` (`Stable tag`), `package.json`, `PFX_VERSION`
  if hard-coded (prefer reading from `wp_get_theme()`).
- Update `CHANGELOG.md` / `readme.txt` changelog.
- Build assets; run PHPCS, Theme Check, audit script.
- Create the zip excluding dev files:
  ```bash
  git archive --format=zip --prefix=my-theme/ -o my-theme-1.0.0.zip HEAD
  ```
  (with `export-ignore` entries in `.gitattributes` for `.phpcs.xml.dist`, `composer.*`,
  `package*.json`, `.github/`, `assets/src/`, tests), or `npm run plugin-zip`.
- Install the zip on a clean site to verify nothing depends on ignored files.
