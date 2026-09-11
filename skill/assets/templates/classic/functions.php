<?php
/**
 * {{NAME}} functions and definitions.
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
