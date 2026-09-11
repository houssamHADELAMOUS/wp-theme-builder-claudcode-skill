<?php
/**
 * Block pattern categories.
 *
 * Patterns themselves live in /patterns and are registered automatically.
 *
 * @package {{PACKAGE}}
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register pattern categories.
 */
function {{PREFIX}}_register_pattern_categories() {
	register_block_pattern_category(
		'{{SLUG}}',
		array(
			'label'       => __( '{{NAME}}', '{{TEXTDOMAIN}}' ),
			'description' => __( 'Patterns designed for {{NAME}}.', '{{TEXTDOMAIN}}' ),
		)
	);
}
add_action( 'init', '{{PREFIX}}_register_pattern_categories' );
