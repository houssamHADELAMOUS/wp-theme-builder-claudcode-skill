<?php
/**
 * Run the Theme Check plugin headlessly against a theme and print the results.
 *
 * Requires the theme-check plugin to be installed (active or not) on the site.
 *
 * Usage (WP-CLI on the site, or inside wp-env):
 *   wp eval-file theme-check.php <theme-slug>
 *   npx @wordpress/env run cli wp eval-file /var/www/html/wp-content/themes/<slug>/theme-check.php <slug>
 *
 * Exit code 1 when REQUIRED or WARNING items are found.
 *
 * @package WordPress_Theme_Builder_Skill
 */

$wtb_slug = isset( $args[0] ) ? $args[0] : get_stylesheet();

$wtb_checkbase = WP_PLUGIN_DIR . '/theme-check/checkbase.php';
if ( ! file_exists( $wtb_checkbase ) ) {
	fwrite( STDERR, "Theme Check plugin not found. Install it: wp plugin install theme-check\n" );
	exit( 2 );
}
require_once $wtb_checkbase;
if ( function_exists( 'tc_load_checks' ) ) {
	tc_load_checks();
}

$wtb_theme = wp_get_theme( $wtb_slug );
if ( ! $wtb_theme->exists() ) {
	fwrite( STDERR, "Theme '{$wtb_slug}' not found.\n" );
	exit( 2 );
}

$wtb_ok = run_themechecks_against_theme( $wtb_theme, $wtb_slug );

global $themechecks;
$wtb_rows = array();
foreach ( $themechecks as $wtb_check ) {
	if ( ! $wtb_check instanceof themecheck ) {
		continue;
	}
	$wtb_errors = $wtb_check->getError();
	if ( empty( $wtb_errors ) ) {
		continue;
	}
	foreach ( (array) $wtb_errors as $wtb_e ) {
		$wtb_rows[] = preg_replace( '/\s+/', ' ', wp_strip_all_tags( html_entity_decode( $wtb_e ) ) );
	}
}

$wtb_bad = 0;
foreach ( $wtb_rows as $wtb_r ) {
	if ( preg_match( '/^(REQUIRED|WARNING)/', $wtb_r ) ) {
		$wtb_bad++;
	}
}

echo 'Theme Check: ' . $wtb_theme->get( 'Name' ) . " ({$wtb_slug})\n";
echo ( $wtb_ok && 0 === $wtb_bad ) ? "RESULT: PASS\n" : "RESULT: FAIL\n";
echo count( $wtb_rows ) . " message(s), {$wtb_bad} required/warning\n\n";
foreach ( $wtb_rows as $wtb_r ) {
	echo $wtb_r, "\n";
}

exit( $wtb_bad > 0 ? 1 : 0 );
