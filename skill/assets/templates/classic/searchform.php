<?php
/**
 * The search form template.
 *
 * @package {{PACKAGE}}
 */

${{PREFIX}}_unique_id = wp_unique_id( 'search-form-' );
?>
<form role="search" method="get" class="search-form" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<label for="<?php echo esc_attr( ${{PREFIX}}_unique_id ); ?>" class="screen-reader-text"><?php echo esc_html_x( 'Search for:', 'label', '{{TEXTDOMAIN}}' ); ?></label>
	<input type="search" id="<?php echo esc_attr( ${{PREFIX}}_unique_id ); ?>" class="search-field" placeholder="<?php echo esc_attr_x( 'Search&hellip;', 'placeholder', '{{TEXTDOMAIN}}' ); ?>" value="<?php echo get_search_query(); ?>" name="s">
	<button type="submit" class="search-submit"><?php echo esc_html_x( 'Search', 'submit button', '{{TEXTDOMAIN}}' ); ?></button>
</form>
