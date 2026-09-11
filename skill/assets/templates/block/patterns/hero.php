<?php
/**
 * Title: Hero
 * Slug: {{SLUG}}/hero
 * Categories: {{SLUG}}, banner
 * Keywords: hero, intro, banner, cta
 * Block Types: core/post-content
 * Post Types: page, wp_template
 * Viewport Width: 1400
 * Description: Full-width introduction with heading, text and two buttons.
 *
 * @package {{PACKAGE}}
 */

?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70"}}},"backgroundColor":"secondary","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-secondary-background-color has-background" style="padding-top:var(--wp--preset--spacing--70);padding-bottom:var(--wp--preset--spacing--70)">
	<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|30"}},"layout":{"type":"constrained","contentSize":"800px"}} -->
	<div class="wp-block-group">
		<!-- wp:heading {"textAlign":"center","level":1,"fontSize":"xx-large"} -->
		<h1 class="wp-block-heading has-text-align-center has-xx-large-font-size"><?php esc_html_e( 'A clear headline that says what you do', '{{TEXTDOMAIN}}' ); ?></h1>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"align":"center","fontSize":"large"} -->
		<p class="has-text-align-center has-large-font-size"><?php esc_html_e( 'One or two sentences that explain the benefit for the visitor and why they should keep reading.', '{{TEXTDOMAIN}}' ); ?></p>
		<!-- /wp:paragraph -->

		<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
		<div class="wp-block-buttons">
			<!-- wp:button -->
			<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#"><?php esc_html_e( 'Get started', '{{TEXTDOMAIN}}' ); ?></a></div>
			<!-- /wp:button -->

			<!-- wp:button {"className":"is-style-outline"} -->
			<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" href="#"><?php esc_html_e( 'Learn more', '{{TEXTDOMAIN}}' ); ?></a></div>
			<!-- /wp:button -->
		</div>
		<!-- /wp:buttons -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
