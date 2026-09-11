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
		'{{PREFIX}}-main',
		get_theme_file_uri( 'assets/css/main.css' ),
		array(),
		{{PREFIX_UPPER}}_VERSION
	);
	wp_style_add_data( '{{PREFIX}}-main', 'rtl', 'replace' );

	wp_enqueue_script(
		'{{PREFIX}}-navigation',
		get_theme_file_uri( 'assets/js/navigation.js' ),
		array(),
		{{PREFIX_UPPER}}_VERSION,
		array(
			'strategy'  => 'defer',
			'in_footer' => true,
		)
	);

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', '{{PREFIX}}_enqueue_assets' );

/**
 * Load core block styles per block instead of one big stylesheet.
 */
add_filter( 'should_load_separate_core_block_assets', '__return_true' );
