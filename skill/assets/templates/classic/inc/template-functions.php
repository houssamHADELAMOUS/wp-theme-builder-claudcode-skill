<?php
/**
 * Functions which enhance the theme by hooking into WordPress.
 *
 * @package {{PACKAGE}}
 */

defined( 'ABSPATH' ) || exit;

/**
 * Adds custom classes to the array of body classes.
 *
 * @param string[] $classes Classes for the body element.
 * @return string[]
 */
function {{PREFIX}}_body_classes( $classes ) {
	if ( ! is_singular() ) {
		$classes[] = 'hfeed';
	}

	if ( ! is_active_sidebar( 'sidebar-1' ) ) {
		$classes[] = 'no-sidebar';
	}

	return $classes;
}
add_filter( 'body_class', '{{PREFIX}}_body_classes' );

/**
 * Add a pingback url auto-discovery header for single posts, pages, or attachments.
 */
function {{PREFIX}}_pingback_header() {
	if ( is_singular() && pings_open() ) {
		printf( '<link rel="pingback" href="%s">', esc_url( get_bloginfo( 'pingback_url' ) ) );
	}
}
add_action( 'wp_head', '{{PREFIX}}_pingback_header' );

/**
 * Replace the default "[...]" excerpt ending.
 *
 * @param string $more The current "more" string.
 * @return string
 */
function {{PREFIX}}_excerpt_more( $more ) {
	if ( is_admin() ) {
		return $more;
	}
	return '&hellip;';
}
add_filter( 'excerpt_more', '{{PREFIX}}_excerpt_more' );

/**
 * Tweak the main query on the front end.
 *
 * @param WP_Query $query The query object.
 */
function {{PREFIX}}_pre_get_posts( $query ) {
	if ( is_admin() || ! $query->is_main_query() ) {
		return;
	}

	if ( $query->is_search() ) {
		$query->set( 'post_type', array( 'post', 'page' ) );
	}
}
add_action( 'pre_get_posts', '{{PREFIX}}_pre_get_posts' );
