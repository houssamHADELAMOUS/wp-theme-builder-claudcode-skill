<?php
/**
 * Editor policy: which blocks editors may use.
 *
 * Editorial policy is behaviour, not presentation, so it lives in the plugin.
 * Return an empty array from the filter to allow every block.
 *
 * @package {{PACKAGE}}_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Restrict the block inserter for non-administrators.
 *
 * @param bool|string[]           $allowed_block_types Current allowed blocks (true = all).
 * @param WP_Block_Editor_Context $context             Editor context.
 * @return bool|string[]
 */
function {{PREFIX}}c_allowed_block_types( $allowed_block_types, $context ) {
	// Administrators and template editing keep everything.
	if ( current_user_can( 'manage_options' ) || empty( $context->post ) ) {
		return $allowed_block_types;
	}

	$allowed = array(
		// Text.
		'core/paragraph',
		'core/heading',
		'core/list',
		'core/list-item',
		'core/quote',
		'core/table',
		'core/details',
		// Media.
		'core/image',
		'core/gallery',
		'core/video',
		'core/embed',
		'core/cover',
		// Design.
		'core/group',
		'core/columns',
		'core/column',
		'core/buttons',
		'core/button',
		'core/separator',
		'core/spacer',
		// Reusable.
		'core/block',
		'core/pattern',
	);

	/**
	 * Filter the curated block list for editors.
	 *
	 * @param string[] $allowed Block names. Return an empty array to allow all blocks.
	 */
	$allowed = apply_filters( '{{PREFIX}}c_allowed_blocks', $allowed );

	return empty( $allowed ) ? $allowed_block_types : $allowed;
}
add_filter( 'allowed_block_types_all', '{{PREFIX}}c_allowed_block_types', 10, 2 );
