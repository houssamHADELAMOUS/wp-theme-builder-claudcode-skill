<?php
/**
 * Title: No results
 * Slug: {{SLUG}}/no-results
 * Categories: {{SLUG}}
 * Block Types: core/query-no-results
 * Inserter: no
 * Description: Message and search form shown when a query returns nothing.
 *
 * @package {{PACKAGE}}
 */

?>
<!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group">
	<!-- wp:paragraph -->
	<p><?php esc_html_e( 'Nothing found. Try a different search.', '{{TEXTDOMAIN}}' ); ?></p>
	<!-- /wp:paragraph -->

	<!-- wp:search {"label":"<?php esc_attr_e( 'Search', '{{TEXTDOMAIN}}' ); ?>","showLabel":false,"placeholder":"<?php esc_attr_e( 'Search', '{{TEXTDOMAIN}}' ); ?>","buttonText":"<?php esc_attr_e( 'Search', '{{TEXTDOMAIN}}' ); ?>"} /-->
</div>
<!-- /wp:group -->
