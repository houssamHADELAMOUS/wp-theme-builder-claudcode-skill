<?php
/**
 * Template part for displaying a single post.
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package {{PACKAGE}}
 */

?>

<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
	<header class="entry-header">
		<?php the_title( '<h1 class="entry-title">', '</h1>' ); ?>

		<div class="entry-meta">
			<?php
			{{PREFIX}}_posted_on();
			if ( get_theme_mod( '{{PREFIX}}_show_author', true ) ) {
				{{PREFIX}}_posted_by();
			}
			?>
		</div><!-- .entry-meta -->
	</header><!-- .entry-header -->

	<?php {{PREFIX}}_post_thumbnail(); ?>

	<div class="entry-content">
		<?php
		the_content(
			sprintf(
				wp_kses(
					/* translators: %s: Name of current post. Only visible to screen readers. */
					__( 'Continue reading<span class="screen-reader-text"> "%s"</span>', '{{TEXTDOMAIN}}' ),
					array( 'span' => array( 'class' => array() ) )
				),
				wp_kses_post( get_the_title() )
			)
		);

		wp_link_pages(
			array(
				'before' => '<div class="page-links">' . esc_html__( 'Pages:', '{{TEXTDOMAIN}}' ),
				'after'  => '</div>',
			)
		);
		?>
	</div><!-- .entry-content -->

	<footer class="entry-footer">
		<?php {{PREFIX}}_entry_footer(); ?>
	</footer><!-- .entry-footer -->
</article><!-- #post-<?php the_ID(); ?> -->
