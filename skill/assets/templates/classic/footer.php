<?php
/**
 * The template for displaying the footer.
 *
 * Contains the closing of the #content div and all content after.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package {{PACKAGE}}
 */

?>
	<footer id="colophon" class="site-footer">
		<?php if ( is_active_sidebar( 'footer-1' ) ) : ?>
			<div class="footer-widgets">
				<?php dynamic_sidebar( 'footer-1' ); ?>
			</div>
		<?php endif; ?>

		<?php if ( has_nav_menu( 'footer' ) ) : ?>
			<nav class="footer-navigation" aria-label="<?php esc_attr_e( 'Footer', '{{TEXTDOMAIN}}' ); ?>">
				<?php
				wp_nav_menu(
					array(
						'theme_location' => 'footer',
						'menu_class'     => 'footer-menu',
						'container'      => false,
						'fallback_cb'    => false,
						'depth'          => 1,
					)
				);
				?>
			</nav>
		<?php endif; ?>

		<div class="site-info">
			<?php
			${{PREFIX}}_footer_text = get_theme_mod( '{{PREFIX}}_footer_text', '' );
			if ( ${{PREFIX}}_footer_text ) {
				echo '<p class="footer-text">' . wp_kses_post( ${{PREFIX}}_footer_text ) . '</p>';
			}
			?>
			<p class="copyright">
				<?php
				printf(
					/* translators: 1: year, 2: site name. */
					esc_html__( '&copy; %1$s %2$s', '{{TEXTDOMAIN}}' ),
					esc_html( wp_date( 'Y' ) ),
					esc_html( get_bloginfo( 'name' ) )
				);
				?>
			</p>
		</div><!-- .site-info -->
	</footer><!-- #colophon -->
</div><!-- #page -->

<?php wp_footer(); ?>

</body>
</html>
