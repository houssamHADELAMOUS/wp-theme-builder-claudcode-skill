<?php
/**
 * {{NAME}} functions and definitions.
 *
 * Hybrid theme: classic PHP templates with full block editor support
 * (theme.json presets and styles, patterns, block styles).
 *
 * Keep this file small: constants and requires only. Real work lives in inc/.
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package {{PACKAGE}}
 */

defined( 'ABSPATH' ) || exit;

define( '{{PREFIX_UPPER}}_VERSION', wp_get_theme()->get( 'Version' ) );

require get_theme_file_path( 'inc/setup.php' );
require get_theme_file_path( 'inc/enqueue.php' );
require get_theme_file_path( 'inc/template-tags.php' );
require get_theme_file_path( 'inc/template-functions.php' );
require get_theme_file_path( 'inc/customizer.php' );
require get_theme_file_path( 'inc/block-styles.php' );
require get_theme_file_path( 'inc/block-patterns.php' );

/**
 * Keep only the theme's own patterns in the inserter.
 *
 * Remove these lines if the client wants the wordpress.org pattern library.
 */
function {{PREFIX}}_disable_remote_patterns() {
	remove_theme_support( 'core-block-patterns' );
}
add_action( 'after_setup_theme', '{{PREFIX}}_disable_remote_patterns', 11 );
add_filter( 'should_load_remote_block_patterns', '__return_false' );
