<?php
/**
 * Custom post types.
 *
 * Content structures live here, not in the theme, so content survives a theme switch.
 *
 * @package {{PACKAGE}}_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register custom post types.
 *
 * Example: "Project". Duplicate the block for each post type. Keys must be
 * lowercase, prefixed, and at most 20 characters.
 */
function {{PREFIX}}c_register_post_types() {
	register_post_type(
		'{{PREFIX}}_project',
		array(
			'labels'          => array(
				'name'                  => _x( 'Projects', 'post type general name', '{{SLUG}}-core' ),
				'singular_name'         => _x( 'Project', 'post type singular name', '{{SLUG}}-core' ),
				'menu_name'             => _x( 'Projects', 'admin menu', '{{SLUG}}-core' ),
				'name_admin_bar'        => _x( 'Project', 'add new on admin bar', '{{SLUG}}-core' ),
				'add_new'               => __( 'Add New', '{{SLUG}}-core' ),
				'add_new_item'          => __( 'Add New Project', '{{SLUG}}-core' ),
				'new_item'              => __( 'New Project', '{{SLUG}}-core' ),
				'edit_item'             => __( 'Edit Project', '{{SLUG}}-core' ),
				'view_item'             => __( 'View Project', '{{SLUG}}-core' ),
				'all_items'             => __( 'All Projects', '{{SLUG}}-core' ),
				'search_items'          => __( 'Search Projects', '{{SLUG}}-core' ),
				'not_found'             => __( 'No projects found.', '{{SLUG}}-core' ),
				'not_found_in_trash'    => __( 'No projects found in Trash.', '{{SLUG}}-core' ),
				'featured_image'        => __( 'Project Image', '{{SLUG}}-core' ),
				'set_featured_image'    => __( 'Set project image', '{{SLUG}}-core' ),
				'remove_featured_image' => __( 'Remove project image', '{{SLUG}}-core' ),
				'archives'              => __( 'Project Archives', '{{SLUG}}-core' ),
			),
			'description'     => __( 'Client projects and case studies.', '{{SLUG}}-core' ),
			'public'          => true,
			'show_in_rest'    => true,
			'has_archive'     => 'projects',
			'rewrite'         => array(
				'slug'       => 'projects',
				'with_front' => false,
			),
			'menu_position'   => 20,
			'menu_icon'       => 'dashicons-portfolio',
			'supports'        => array( 'title', 'editor', 'thumbnail', 'excerpt', 'revisions', 'custom-fields' ),
			'taxonomies'      => array( '{{PREFIX}}_project_type' ),
			'template'        => array(
				array(
					'core/paragraph',
					array( 'placeholder' => __( 'Describe the project.', '{{SLUG}}-core' ) ),
				),
			),
			'capability_type' => 'post',
			'map_meta_cap'    => true,
		)
	);
}
add_action( 'init', '{{PREFIX}}c_register_post_types' );
