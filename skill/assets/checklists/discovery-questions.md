# Discovery Questions

Ask these before scaffolding. Skip any the user already answered. Group them; do not
fire 20 questions at once. Offer sensible defaults so a short answer is enough.

## 1. Who is it for

- Client project or your own site?
- Who will edit content after launch, and how technical are they?
- Should editors be able to change layout/header/footer, or only page content?

## 2. Scope and design

- Is there a design (Figma/XD/screenshots) or should I propose a layout?
- Site type: blog, business/brochure, portfolio, e-commerce (WooCommerce), magazine,
  landing pages, documentation, other?
- Required page types: home, about, services, blog, single post, contact, 404, search,
  pricing, team, projects/case studies, events, FAQ?
- Content structures beyond posts/pages (projects, team members, testimonials, events,
  products)? → these go in a companion plugin.
- Multilingual / RTL languages?

## 3. Technical constraints

- WordPress version on the host (default: assume latest, 7.0) and PHP version (default:
  8.1+)?
- Existing site being redesigned, or a new install?
- Plugins already in use that the theme must support (ACF, WooCommerce, Yoast, page
  builder, forms, membership)?
- Any page builder requirement (Elementor, Bricks, Divi)? If yes, block theme is out.
- Hosting: managed WP host, shared, VPS? Node/Composer available in deploy?

## 4. Theme type preference

- Block (FSE), classic, or hybrid? If unsure, I recommend based on the answers above
  (see references/theme-types.md).
- Naming: theme name, slug (lowercase-hyphen), function prefix (≥4 letters), author.

## 5. Non-functional requirements

- Accessibility target (WCAG 2.2 AA recommended; legal requirement in the EU)?
- Performance targets (Core Web Vitals pass on mobile is the default)?
- Privacy: any tracking/fonts/embeds that need consent? Self-hosted fonts by default.
- Dark mode / multiple brand variations?
- Will it be submitted to WordPress.org or sold (stricter rules), or private?

## 6. Delivery

- Timeline and what "done" means (staging URL, zip, repo)?
- Do you want a companion plugin scaffolded now for content types?
- Do you want a local environment set up (wp-env with Docker) for testing?
