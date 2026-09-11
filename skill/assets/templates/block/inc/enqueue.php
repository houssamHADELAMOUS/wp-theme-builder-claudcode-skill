<?php
/**
 * Scripts and styles.
 *
 * @package {{PACKAGE}}
 */

defined( 'ABSPATH' ) || exit;

/**
 * Front-end assets.
 */
function {{PREFIX}}_enqueue_assets() {
	wp_enqueue_style(
		'{{PREFIX}}-style',
		get_stylesheet_uri(),
		array(),
		{{PREFIX_UPPER}}_VERSION
	);
	wp_style_add_data( '{{PREFIX}}-style', 'rtl', 'replace' );
}
add_action( 'wp_enqueue_scripts', '{{PREFIX}}_enqueue_assets' );

/**
 * Per-block stylesheets, loaded only when the block renders.
 *
 * Add a file at assets/css/blocks/{block}.css and list the block here.
 */
function {{PREFIX}}_enqueue_block_styles() {
	$blocks = array(
		'core/navigation',
	);

	foreach ( $blocks as $block ) {
		$slug = str_replace( 'core/', '', $block );
		$path = get_theme_file_path( 'assets/css/blocks/' . $slug . '.css' );

		if ( ! file_exists( $path ) ) {
			continue;
		}

		wp_enqueue_block_style(
			$block,
			array(
				'handle' => '{{PREFIX}}-block-' . $slug,
				'src'    => get_theme_file_uri( 'assets/css/blocks/' . $slug . '.css' ),
				'path'   => $path,
				'ver'    => {{PREFIX_UPPER}}_VERSION,
			)
		);
	}
}
add_action( 'init', '{{PREFIX}}_enqueue_block_styles' );
