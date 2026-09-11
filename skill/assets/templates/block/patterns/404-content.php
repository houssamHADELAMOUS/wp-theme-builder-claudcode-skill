<?php
/**
 * Title: 404 content
 * Slug: {{SLUG}}/404-content
 * Categories: {{SLUG}}
 * Template Types: 404
 * Inserter: no
 * Description: Heading, explanation and search form for the 404 template.
 *
 * @package {{PACKAGE}}
 */

?>
<!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group">
	<!-- wp:heading {"level":1} -->
	<h1 class="wp-block-heading"><?php esc_html_e( 'Page not found', '{{TEXTDOMAIN}}' ); ?></h1>
	<!-- /wp:heading -->

	<!-- wp:paragraph -->
	<p><?php esc_html_e( 'The page you are looking for does not exist or has moved. Try searching, or go back to the home page.', '{{TEXTDOMAIN}}' ); ?></p>
	<!-- /wp:paragraph -->

	<!-- wp:search {"label":"<?php esc_attr_e( 'Search', '{{TEXTDOMAIN}}' ); ?>","showLabel":false,"placeholder":"<?php esc_attr_e( 'Search', '{{TEXTDOMAIN}}' ); ?>","buttonText":"<?php esc_attr_e( 'Search', '{{TEXTDOMAIN}}' ); ?>"} /-->

	<!-- wp:buttons -->
	<div class="wp-block-buttons">
		<!-- wp:button -->
		<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to home', '{{TEXTDOMAIN}}' ); ?></a></div>
		<!-- /wp:button -->
	</div>
	<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
