<?php
/**
 * Title: Footer columns
 * Slug: {{SLUG}}/footer-columns
 * Categories: {{SLUG}}, footer
 * Block Types: core/template-part/footer
 * Inserter: no
 * Description: Site title, description and a navigation in three columns.
 *
 * @package {{PACKAGE}}
 */

?>
<!-- wp:columns {"align":"wide"} -->
<div class="wp-block-columns alignwide">
	<!-- wp:column {"width":"40%"} -->
	<div class="wp-block-column" style="flex-basis:40%">
		<!-- wp:site-title {"level":2,"fontSize":"large"} /-->
		<!-- wp:site-tagline /-->
	</div>
	<!-- /wp:column -->

	<!-- wp:column -->
	<div class="wp-block-column">
		<!-- wp:heading {"level":2,"fontSize":"medium"} -->
		<h2 class="wp-block-heading has-medium-font-size"><?php esc_html_e( 'Navigate', '{{TEXTDOMAIN}}' ); ?></h2>
		<!-- /wp:heading -->
		<!-- wp:navigation {"overlayMenu":"never","ariaLabel":"<?php esc_attr_e( 'Footer', '{{TEXTDOMAIN}}' ); ?>","layout":{"type":"flex","orientation":"vertical"}} /-->
	</div>
	<!-- /wp:column -->

	<!-- wp:column -->
	<div class="wp-block-column">
		<!-- wp:heading {"level":2,"fontSize":"medium"} -->
		<h2 class="wp-block-heading has-medium-font-size"><?php esc_html_e( 'Contact', '{{TEXTDOMAIN}}' ); ?></h2>
		<!-- /wp:heading -->
		<!-- wp:paragraph -->
		<p><?php esc_html_e( 'Add your address, phone number and email here.', '{{TEXTDOMAIN}}' ); ?></p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:column -->
</div>
<!-- /wp:columns -->
