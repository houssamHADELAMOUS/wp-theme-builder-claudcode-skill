<?php
/**
 * Template part for displaying posts in lists.
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package {{PACKAGE}}
 */

?>

<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
	<?php {{PREFIX}}_post_thumbnail( '{{PREFIX}}-card' ); ?>

	<header class="entry-header">
		<?php the_title( sprintf( '<h2 class="entry-title"><a href="%s" rel="bookmark">', esc_url( get_permalink() ) ), '</a></h2>' ); ?>

		<?php if ( 'post' === get_post_type() ) : ?>
			<div class="entry-meta">
				<?php
				{{PREFIX}}_posted_on();
				if ( get_theme_mod( '{{PREFIX}}_show_author', true ) ) {
					{{PREFIX}}_posted_by();
				}
				?>
			</div><!-- .entry-meta -->
		<?php endif; ?>
	</header><!-- .entry-header -->

	<div class="entry-summary">
		<?php the_excerpt(); ?>
	</div><!-- .entry-summary -->

	<footer class="entry-footer">
		<?php {{PREFIX}}_entry_footer(); ?>
	</footer><!-- .entry-footer -->
</article><!-- #post-<?php the_ID(); ?> -->
