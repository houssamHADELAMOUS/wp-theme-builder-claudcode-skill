<?php
/**
 * Title: Post card
 * Slug: {{SLUG}}/post-card
 * Categories: {{SLUG}}
 * Block Types: core/post-template
 * Inserter: no
 * Description: Featured image, title, date and excerpt for use inside a Query Loop.
 *
 * @package {{PACKAGE}}
 */

?>
<!-- wp:group {"tagName":"article","style":{"spacing":{"blockGap":"var:preset|spacing|20"}},"layout":{"type":"default"}} -->
<article class="wp-block-group">
	<!-- wp:post-featured-image {"isLink":true,"aspectRatio":"16/9","sizeSlug":"{{PREFIX}}-card"} /-->

	<!-- wp:post-title {"level":2,"isLink":true} /-->

	<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|20"}},"layout":{"type":"flex","flexWrap":"wrap"}} -->
	<div class="wp-block-group">
		<!-- wp:post-date /-->
		<!-- wp:post-terms {"term":"category"} /-->
	</div>
	<!-- /wp:group -->

	<!-- wp:post-excerpt {"moreText":"<?php esc_attr_e( 'Continue reading', '{{TEXTDOMAIN}}' ); ?>","excerptLength":30} /-->
</article>
<!-- /wp:group -->
