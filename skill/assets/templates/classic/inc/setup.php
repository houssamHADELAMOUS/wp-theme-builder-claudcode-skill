<?php
/**
 * Theme setup: supports, menus, image sizes, widget areas.
 *
 * @package {{PACKAGE}}
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( '{{PREFIX}}_setup' ) ) :
	/**
	 * Sets up theme defaults and registers support for various WordPress features.
	 *
	 * Runs on after_setup_theme, which is before the init hook.
	 */
	function {{PREFIX}}_setup() {
		load_theme_textdomain( '{{TEXTDOMAIN}}', get_template_directory() . '/languages' );

		add_theme_support( 'automatic-feed-links' );
		add_theme_support( 'title-tag' );
		add_theme_support( 'post-thumbnails' );
		set_post_thumbnail_size( 1200, 9999 );
		add_image_size( '{{PREFIX}}-card', 800, 500, true );

		register_nav_menus(
			array(
				'primary' => esc_html__( 'Primary Menu', '{{TEXTDOMAIN}}' ),
				'footer'  => esc_html__( 'Footer Menu', '{{TEXTDOMAIN}}' ),
			)
		);

		add_theme_support(
			'html5',
			array(
				'search-form',
				'comment-form',
				'comment-list',
				'gallery',
				'caption',
				'style',
				'script',
				'navigation-widgets',
			)
		);

		add_theme_support(
			'custom-logo',
			array(
				'height'      => 80,
				'width'       => 240,
				'flex-width'  => true,
				'flex-height' => true,
			)
		);

		add_theme_support( 'customize-selective-refresh-widgets' );
		add_theme_support( 'responsive-embeds' );

		// Block editor.
		add_theme_support( 'align-wide' );
		add_theme_support( 'editor-styles' );
		add_editor_style( 'assets/css/editor.css' );
		add_theme_support( 'wp-block-styles' );
		add_theme_support( 'custom-spacing' );
		add_theme_support( 'custom-line-height' );
		add_theme_support( 'appearance-tools' );
	}
endif;
add_action( 'after_setup_theme', '{{PREFIX}}_setup' );

/**
 * Set the content width in pixels, based on the theme's design and stylesheet.
 *
 * Priority 0 to make it available to lower priority callbacks.
 *
 * @global int $content_width
 */
function {{PREFIX}}_content_width() {
	$GLOBALS['content_width'] = apply_filters( '{{PREFIX}}_content_width', 800 ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Core global.
}
add_action( 'after_setup_theme', '{{PREFIX}}_content_width', 0 );

/**
 * Register widget areas.
 */
function {{PREFIX}}_widgets_init() {
	register_sidebar(
		array(
			'name'          => esc_html__( 'Sidebar', '{{TEXTDOMAIN}}' ),
			'id'            => 'sidebar-1',
			'description'   => esc_html__( 'Add widgets here to appear in the sidebar.', '{{TEXTDOMAIN}}' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="widget-title">',
			'after_title'   => '</h2>',
		)
	);
	register_sidebar(
		array(
			'name'          => esc_html__( 'Footer', '{{TEXTDOMAIN}}' ),
			'id'            => 'footer-1',
			'description'   => esc_html__( 'Add widgets here to appear in the footer.', '{{TEXTDOMAIN}}' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="widget-title">',
			'after_title'   => '</h2>',
		)
	);
}
add_action( 'widgets_init', '{{PREFIX}}_widgets_init' );

/**
 * Expose custom image sizes in the editor.
 *
 * @param string[] $sizes Registered size names.
 * @return string[]
 */
function {{PREFIX}}_image_size_names( $sizes ) {
	return array_merge(
		$sizes,
		array(
			'{{PREFIX}}-card' => __( 'Card', '{{TEXTDOMAIN}}' ),
		)
	);
}
add_filter( 'image_size_names_choose', '{{PREFIX}}_image_size_names' );
