<?php
/**
 * Custom block registration.
 *
 * Blocks are built with @wordpress/scripts into blocks/build/<name>/block.json
 * (apiVersion 3). Each block folder is registered automatically.
 *
 * @package {{PACKAGE}}_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register every built block found in blocks/build.
 */
function {{PREFIX}}c_register_blocks() {
	$build_dir = {{PREFIX_UPPER}}C_PATH . 'blocks/build';
	if ( ! is_dir( $build_dir ) ) {
		return;
	}
	$block_files = glob( $build_dir . '/*/block.json' );
	if ( empty( $block_files ) ) {
		return;
	}
	foreach ( $block_files as $block_json ) {
		register_block_type( dirname( $block_json ) );
	}
}
add_action( 'init', '{{PREFIX}}c_register_blocks' );

/**
 * Add a block category for the site's own blocks.
 *
 * @param array $categories Existing categories.
 * @return array
 */
function {{PREFIX}}c_block_category( $categories ) {
	return array_merge(
		array(
			array(
				'slug'  => '{{SLUG}}',
				'title' => __( '{{NAME}}', '{{SLUG}}-core' ),
			),
		),
		$categories
	);
}
add_filter( 'block_categories_all', '{{PREFIX}}c_block_category' );
