<?php
/**
 * Post meta registration.
 *
 * Registering meta with show_in_rest makes it available to the block editor and
 * Block Bindings. Every meta key needs a sanitize and an auth callback.
 *
 * @package {{PACKAGE}}_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Authorise meta edits: anyone who can edit posts.
 *
 * @return bool
 */
function {{PREFIX}}c_meta_auth() {
	return current_user_can( 'edit_posts' );
}

/**
 * Register post meta.
 */
function {{PREFIX}}c_register_meta() {
	register_post_meta(
		'{{PREFIX}}_project',
		'_{{PREFIX}}_client_name',
		array(
			'type'              => 'string',
			'single'            => true,
			'default'           => '',
			'show_in_rest'      => true,
			'sanitize_callback' => 'sanitize_text_field',
			'auth_callback'     => '{{PREFIX}}c_meta_auth',
		)
	);

	register_post_meta(
		'{{PREFIX}}_project',
		'_{{PREFIX}}_project_url',
		array(
			'type'              => 'string',
			'single'            => true,
			'default'           => '',
			'show_in_rest'      => true,
			'sanitize_callback' => 'sanitize_url',
			'auth_callback'     => '{{PREFIX}}c_meta_auth',
		)
	);
}
add_action( 'init', '{{PREFIX}}c_register_meta' );
