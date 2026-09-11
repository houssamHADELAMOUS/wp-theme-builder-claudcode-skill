<?php
/**
 * Title: Call to action
 * Slug: {{SLUG}}/cta
 * Categories: {{SLUG}}, call-to-action
 * Keywords: cta, call to action, button
 * Block Types: core/post-content
 * Post Types: page, wp_template
 * Viewport Width: 1400
 * Description: Coloured band with a heading, supporting text and a button.
 *
 * @package {{PACKAGE}}
 */

?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"backgroundColor":"primary","textColor":"base","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-base-color has-primary-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)">
	<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
	<div class="wp-block-group alignwide">
		<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|20"}},"layout":{"type":"default"}} -->
		<div class="wp-block-group">
			<!-- wp:heading {"level":2,"textColor":"base"} -->
			<h2 class="wp-block-heading has-base-color has-text-color"><?php esc_html_e( 'Ready to start your project?', '{{TEXTDOMAIN}}' ); ?></h2>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"textColor":"base"} -->
			<p class="has-base-color has-text-color"><?php esc_html_e( 'Tell us about your goals and we will get back to you within one business day.', '{{TEXTDOMAIN}}' ); ?></p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:group -->

		<!-- wp:buttons -->
		<div class="wp-block-buttons">
			<!-- wp:button {"backgroundColor":"base","textColor":"primary"} -->
			<div class="wp-block-button"><a class="wp-block-button__link has-primary-color has-base-background-color has-text-color has-background wp-element-button" href="#"><?php esc_html_e( 'Contact us', '{{TEXTDOMAIN}}' ); ?></a></div>
			<!-- /wp:button -->
		</div>
		<!-- /wp:buttons -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
