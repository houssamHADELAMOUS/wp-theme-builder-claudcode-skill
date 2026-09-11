<?php
/**
 * Theme Customizer.
 *
 * Every setting has a sanitize_callback and uses the edit_theme_options capability.
 *
 * @package {{PACKAGE}}
 */

defined( 'ABSPATH' ) || exit;

/**
 * Add postMessage support for site title and description, plus theme options.
 *
 * @param WP_Customize_Manager $wp_customize Theme Customizer object.
 */
function {{PREFIX}}_customize_register( $wp_customize ) {
	$wp_customize->get_setting( 'blogname' )->transport        = 'postMessage';
	$wp_customize->get_setting( 'blogdescription' )->transport = 'postMessage';

	if ( isset( $wp_customize->selective_refresh ) ) {
		$wp_customize->selective_refresh->add_partial(
			'blogname',
			array(
				'selector'        => '.site-title a',
				'render_callback' => '{{PREFIX}}_customize_partial_blogname',
			)
		);
		$wp_customize->selective_refresh->add_partial(
			'blogdescription',
			array(
				'selector'        => '.site-description',
				'render_callback' => '{{PREFIX}}_customize_partial_blogdescription',
			)
		);
	}

	$wp_customize->add_section(
		'{{PREFIX}}_options',
		array(
			'title'    => __( 'Theme Options', '{{TEXTDOMAIN}}' ),
			'priority' => 130,
		)
	);

	$wp_customize->add_setting(
		'{{PREFIX}}_show_author',
		array(
			'default'           => true,
			'capability'        => 'edit_theme_options',
			'sanitize_callback' => '{{PREFIX}}_sanitize_checkbox',
			'transport'         => 'refresh',
		)
	);
	$wp_customize->add_control(
		'{{PREFIX}}_show_author',
		array(
			'type'    => 'checkbox',
			'section' => '{{PREFIX}}_options',
			'label'   => __( 'Show author name on posts', '{{TEXTDOMAIN}}' ),
		)
	);

	$wp_customize->add_setting(
		'{{PREFIX}}_footer_text',
		array(
			'default'           => '',
			'capability'        => 'edit_theme_options',
			'sanitize_callback' => 'wp_kses_post',
			'transport'         => 'refresh',
		)
	);
	$wp_customize->add_control(
		'{{PREFIX}}_footer_text',
		array(
			'type'        => 'textarea',
			'section'     => '{{PREFIX}}_options',
			'label'       => __( 'Footer text', '{{TEXTDOMAIN}}' ),
			'description' => __( 'Shown in the footer. Basic HTML allowed.', '{{TEXTDOMAIN}}' ),
		)
	);
}
add_action( 'customize_register', '{{PREFIX}}_customize_register' );

/**
 * Sanitize a checkbox value.
 *
 * @param mixed $checked Whether the checkbox is checked.
 * @return bool
 */
function {{PREFIX}}_sanitize_checkbox( $checked ) {
	return ( isset( $checked ) && true === (bool) $checked );
}

/**
 * Render the site title for the selective refresh partial.
 */
function {{PREFIX}}_customize_partial_blogname() {
	bloginfo( 'name' );
}

/**
 * Render the site tagline for the selective refresh partial.
 */
function {{PREFIX}}_customize_partial_blogdescription() {
	bloginfo( 'description' );
}

/**
 * Binds JS handlers to make Theme Customizer preview reload changes asynchronously.
 */
function {{PREFIX}}_customize_preview_js() {
	wp_enqueue_script(
		'{{PREFIX}}-customizer',
		get_theme_file_uri( 'assets/js/customizer.js' ),
		array( 'customize-preview' ),
		{{PREFIX_UPPER}}_VERSION,
		true
	);
}
add_action( 'customize_preview_init', '{{PREFIX}}_customize_preview_js' );
