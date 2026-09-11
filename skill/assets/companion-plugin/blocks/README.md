# Custom blocks

Scaffold a block here with:

```bash
npx @wordpress/create-block@latest my-block --namespace {{PREFIX}} --no-plugin --target-dir blocks/src/my-block
```

Build into `blocks/build/` with:

```bash
npx wp-scripts build --webpack-src-dir=blocks/src --output-path=blocks/build
```

`inc/blocks.php` registers every `blocks/build/*/block.json` automatically.

Rules:

- `block.json` must use `"apiVersion": 3`.
- Namespace every block `{{PREFIX}}/name`.
- Use `theme.json` presets in block styles (`var(--wp--preset--*)`) so the theme controls the look.
- Escape everything in `render.php`; attributes are typed in `block.json` but still escape on output.
- Use the Interactivity API (`@wordpress/interactivity`) for front-end behaviour instead of ad-hoc jQuery.
