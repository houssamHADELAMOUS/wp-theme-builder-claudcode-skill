<?php
/**
 * The header for the theme.
 *
 * Displays everything up to and including the opening <main>.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package {{PACKAGE}}
 */

?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div id="page" class="site">
	<a class="skip-link screen-reader-text" href="#primary"><?php esc_html_e( 'Skip to content', '{{TEXTDOMAIN}}' ); ?></a>

	<header id="masthead" class="site-header">
		<div class="site-branding">
			<?php
			the_custom_logo();
			if ( is_front_page() && is_home() ) :
				?>
				<h1 class="site-title"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a></h1>
				<?php
			else :
				?>
				<p class="site-title"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a></p>
				<?php
			endif;
			${{PREFIX}}_description = get_bloginfo( 'description', 'display' );
			if ( ${{PREFIX}}_description || is_customize_preview() ) :
				?>
				<p class="site-description"><?php echo $${{PREFIX}}_description; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Already escaped by get_bloginfo( 'display' ). ?></p>
			<?php endif; ?>
		</div><!-- .site-branding -->

		<?php if ( has_nav_menu( 'primary' ) ) : ?>
			<nav id="site-navigation" class="main-navigation" aria-label="<?php esc_attr_e( 'Primary', '{{TEXTDOMAIN}}' ); ?>">
				<button class="menu-toggle" aria-controls="primary-menu" aria-expanded="false">
					<span class="screen-reader-text"><?php esc_html_e( 'Menu', '{{TEXTDOMAIN}}' ); ?></span>
					<span class="menu-toggle-icon" aria-hidden="true"></span>
				</button>
				<?php
				wp_nav_menu(
					array(
						'theme_location' => 'primary',
						'menu_id'        => 'primary-menu',
						'menu_class'     => 'menu',
						'container'      => false,
						'fallback_cb'    => false,
						'depth'          => 2,
					)
				);
				?>
			</nav><!-- #site-navigation -->
		<?php endif; ?>
	</header><!-- #masthead -->
