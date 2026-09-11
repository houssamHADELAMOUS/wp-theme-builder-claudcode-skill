<?php
/**
 * {{NAME}} functions and definitions.
 *
 * Block theme: design lives in theme.json, templates/ and parts/. PHP here is
 * limited to setup, asset loading, block styles and pattern categories.
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package {{PACKAGE}}
 */

defined( 'ABSPATH' ) || exit;

define( '{{PREFIX_UPPER}}_VERSION', wp_get_theme()->get( 'Version' ) );

require get_theme_file_path( 'inc/setup.php' );
require get_theme_file_path( 'inc/enqueue.php' );
require get_theme_file_path( 'inc/block-styles.php' );
require get_theme_file_path( 'inc/block-patterns.php' );
