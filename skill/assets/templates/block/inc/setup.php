<?php
/**
 * Theme setup.
 *
 * @package {{PACKAGE}}
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( '{{PREFIX}}_setup' ) ) :
	/**
	 * Register theme supports that theme.json does not cover.
	 */
	function {{PREFIX}}_setup() {
		// Editor stylesheet for anything theme.json cannot express.
		add_theme_support( 'editor-styles' );
		add_editor_style( 'assets/css/editor.css' );

		// Opinionated core block styles (optional; remove if you style every block).
		add_theme_support( 'wp-block-styles' );

		add_theme_support( 'responsive-embeds' );
		add_theme_support( 'post-thumbnails' );

		add_theme_support(
			'html5',
			array(
				'comment-list',
				'comment-form',
				'search-form',
				'gallery',
				'caption',
				'style',
				'script',
				'navigation-widgets',
			)
		);

		// Image sizes used by patterns and templates.
		add_image_size( '{{PREFIX}}-card', 800, 500, true );
	}
endif;
add_action( 'after_setup_theme', '{{PREFIX}}_setup' );

/**
 * Keep only the theme's own patterns in the inserter.
 *
 * Remove these two lines if the client wants the wordpress.org pattern library.
 */
function {{PREFIX}}_disable_remote_patterns() {
	remove_theme_support( 'core-block-patterns' );
}
add_action( 'after_setup_theme', '{{PREFIX}}_disable_remote_patterns', 11 );
add_filter( 'should_load_remote_block_patterns', '__return_false' );

/**
 * Expose custom image sizes in the editor.
 *
 * @param string[] $sizes Registered size names.
 * @return string[]
 */
function {{PREFIX}}_image_size_names( $sizes ) {
	return array_merge(
		$sizes,
		array(
			'{{PREFIX}}-card' => __( 'Card', '{{TEXTDOMAIN}}' ),
		)
	);
}
add_filter( 'image_size_names_choose', '{{PREFIX}}_image_size_names' );
