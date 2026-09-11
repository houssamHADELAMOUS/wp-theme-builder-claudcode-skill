<?php
/**
 * Custom taxonomies.
 *
 * @package {{PACKAGE}}_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register custom taxonomies.
 */
function {{PREFIX}}c_register_taxonomies() {
	register_taxonomy(
		'{{PREFIX}}_project_type',
		array( '{{PREFIX}}_project' ),
		array(
			'labels'            => array(
				'name'          => _x( 'Project Types', 'taxonomy general name', '{{SLUG}}-core' ),
				'singular_name' => _x( 'Project Type', 'taxonomy singular name', '{{SLUG}}-core' ),
				'search_items'  => __( 'Search Project Types', '{{SLUG}}-core' ),
				'all_items'     => __( 'All Project Types', '{{SLUG}}-core' ),
				'edit_item'     => __( 'Edit Project Type', '{{SLUG}}-core' ),
				'update_item'   => __( 'Update Project Type', '{{SLUG}}-core' ),
				'add_new_item'  => __( 'Add New Project Type', '{{SLUG}}-core' ),
				'new_item_name' => __( 'New Project Type Name', '{{SLUG}}-core' ),
				'menu_name'     => __( 'Project Types', '{{SLUG}}-core' ),
			),
			'hierarchical'      => true,
			'public'            => true,
			'show_in_rest'      => true,
			'show_admin_column' => true,
			'rewrite'           => array(
				'slug'       => 'project-type',
				'with_front' => false,
			),
		)
	);
}
add_action( 'init', '{{PREFIX}}c_register_taxonomies' );
