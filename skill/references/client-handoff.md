# Client Hand-off and Maintenance

A theme is finished when the client can run the site without you and the next
developer can maintain it without asking questions.

## Contents

- Deliverables checklist
- Versioning and changelog
- readme.txt and internal README
- Client-proofing the editor
- Documentation for editors
- Deployment
- Update strategy
- Training session outline
- Accessibility and performance statement

---

## Deliverables checklist

- [ ] Theme zip (production build, no dev files) + git repository access
- [ ] Companion plugin zip + repo (if any)
- [ ] `readme.txt` (public) and `README.md` (developer) in the repo
- [ ] `CHANGELOG.md`
- [ ] Editor guide (PDF or a private page on the site) with screenshots
- [ ] List of required/recommended plugins with licences and renewal dates
- [ ] Third-party asset licence list (fonts, icons, images)
- [ ] Credentials handed over securely (never in email/Slack)
- [ ] Accessibility and performance statement (what was tested, results)
- [ ] Known limitations and "do not touch" list
- [ ] Support/maintenance terms

---

## Versioning and changelog

Semantic versioning: `MAJOR.MINOR.PATCH`.
- PATCH: fixes, no visual change.
- MINOR: new patterns, templates, options; backwards compatible.
- MAJOR: template restructures, removed options, breaking `theme.json` slug changes.

Version appears in: `style.css`, `readme.txt` `Stable tag`, `package.json`,
`CHANGELOG.md`. Read it in PHP with `wp_get_theme()->get( 'Version' )` so it is defined
once.

`CHANGELOG.md` (Keep a Changelog format):
```markdown
## [1.1.0] - 2026-09-15
### Added
- Testimonials pattern.
### Fixed
- Focus outline on footer links.
```

---

## readme.txt and internal README

`readme.txt`: public, WordPress format (see [theme-review-checklist.md](theme-review-checklist.md)
section 11). Even for private themes, fill Description, Installation, FAQ, Changelog,
Resources, Copyright.

`README.md` for developers:
```markdown
# My Theme
Custom block theme for Client. Companion plugin: `my-theme-core` (required).

## Requirements
WordPress 6.7+, PHP 8.1+, Node 20 (build only), Composer (lint only).

## Setup
npm ci && npm run build
composer install && composer lint

## Structure
templates/ parts/ patterns/ styles/ — block theme files
inc/ — PHP by concern
assets/src → assets/build — compiled by wp-scripts

## Design tokens
All in theme.json. Do not hard-code colours/spacing in CSS.

## Conventions
Prefix `pfx_`, text domain `my-theme`, WPCS via `.phpcs.xml.dist`.

## Deployment
Push to `main` → CI builds → deploy via <host>. Built files are committed.

## Known issues / decisions
- ...
```

---

## Client-proofing the editor

Do this before hand-off so the client cannot break the design:

- `theme.json`: `color.custom: false`, `color.defaultPalette: false`,
  `typography.customFontSize: false`, `spacing.customSpacingSize: false`,
  `layout.allowCustomContentAndWideSize: false`.
- Lock structural groups in templates/parts: `"templateLock":"contentOnly"` or `"all"`.
- Curate patterns; hide internal ones with `Inserter: no`; disable remote patterns.
- Restrict block types for editors (companion plugin, `allowed_block_types_all`, by role
  if needed).
- Give the client an **Editor** role, not Administrator, unless they truly manage the
  site. Keep one agency admin account.
- Set `DISALLOW_FILE_EDIT` true in `wp-config.php` (host/plugin territory, but
  recommend it).
- Document which template parts are editable (header, footer) and what changes are
  "developer-only".
- Test as the client's role: log in as Editor and try to break the layout.

---

## Documentation for editors

One page, task-based, with screenshots:

1. How to log in and where things are (Pages, Posts, Media, Appearance → Editor).
2. How to create a page from a pattern (which patterns exist and what they are for).
3. How to edit header/footer (block theme) or menus/widgets (classic).
4. How to change colours/fonts within the allowed presets (or "ask us").
5. Image guidelines: sizes, formats, alt text, max upload.
6. How to add a project/team member/etc. (companion plugin CPTs).
7. What not to do: install random plugins, edit theme files, change permalinks.
8. Who to contact and what the maintenance plan covers.

---

## Deployment

- Git-based deploy (host integration, GitHub Actions, or `rsync`/SFTP from CI).
  Never FTP edits on production.
- Exclude dev files with `.gitattributes export-ignore` or a build script.
- Environments: local → staging → production. Test plugin/core updates on staging.
- Cache: purge after deploy; asset versions change with the theme version so browser
  caches invalidate.
- Database changes (menus, Global Styles, template edits made in the Site Editor) live
  in the DB, not the theme. Export customised templates with Create Block Theme plugin
  ("Save changes to theme") before deploying if the design evolved in the editor.

---

## Update strategy

- **Custom theme**: you own it. Updates come from the repo; version bump + changelog.
- **Third-party parent + child**: parent updates automatically; child holds all
  customisations. Never edit the parent.
- Keep `Tested up to` current with each WordPress release; run the test routine after
  major core releases (block markup, editor changes).
- Dependencies: `npm audit`, `composer outdated` quarterly; core-shipped libraries need
  nothing.
- Maintenance checklist per visit: update core/plugins on staging, test key pages,
  Lighthouse spot check, backup verified, `debug.log` empty, security scan.

---

## Training session outline

45–60 minutes, recorded:
1. Tour of the admin (10 min).
2. Create a page from patterns, publish, edit (15 min).
3. Edit header/footer/menu (10 min).
4. Media and image sizes (5 min).
5. What to avoid and how to get help (5 min).
6. Q&A.

Send the recording + editor guide the same day.

---

## Accessibility and performance statement

One page in the hand-off:

- Standard targeted: WCAG 2.2 AA; WordPress accessibility-ready criteria.
- Tests performed: keyboard, NVDA/VoiceOver, axe, contrast, zoom 200%/400%, reduced
  motion; list of pages tested.
- Lighthouse mobile results (home, single, archive) with date and conditions.
- Known limitations (third-party embeds, client-supplied content quality).
- Content responsibilities for the client: alt text, heading order, link text, video
  captions.
