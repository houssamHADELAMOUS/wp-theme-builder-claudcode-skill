<?php
/**
 * Block style variations.
 *
 * Style-only variations can also be declared in styles/blocks/*.json; use PHP
 * when the variation needs a label in the editor and CSS in theme.json.
 *
 * @package {{PACKAGE}}
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register block styles.
 */
function {{PREFIX}}_register_block_styles() {
	register_block_style(
		'core/group',
		array(
			'name'  => '{{PREFIX}}-card',
			'label' => __( 'Card', '{{TEXTDOMAIN}}' ),
		)
	);
}
add_action( 'init', '{{PREFIX}}_register_block_styles' );
