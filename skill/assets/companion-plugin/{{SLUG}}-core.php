<?php
/**
 * Plugin Name:       {{NAME}} Core
 * Plugin URI:        {{THEME_URI}}
 * Description:       Content types, taxonomies, blocks and site functionality for the {{NAME}} site. Keep this plugin active even if the theme changes.
 * Version:           1.0.0
 * Requires at least: {{WP_MIN}}
 * Requires PHP:      {{PHP_MIN}}
 * Author:            {{AUTHOR}}
 * Author URI:        {{AUTHOR_URI}}
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       {{SLUG}}-core
 * Domain Path:       /languages
 *
 * @package {{PACKAGE}}_Core
 */

defined( 'ABSPATH' ) || exit;

define( '{{PREFIX_UPPER}}C_VERSION', '1.0.0' );
define( '{{PREFIX_UPPER}}C_PATH', plugin_dir_path( __FILE__ ) );
define( '{{PREFIX_UPPER}}C_URL', plugin_dir_url( __FILE__ ) );

require {{PREFIX_UPPER}}C_PATH . 'inc/post-types.php';
require {{PREFIX_UPPER}}C_PATH . 'inc/taxonomies.php';
require {{PREFIX_UPPER}}C_PATH . 'inc/meta.php';
require {{PREFIX_UPPER}}C_PATH . 'inc/blocks.php';
require {{PREFIX_UPPER}}C_PATH . 'inc/editor.php';

/**
 * Register post types and flush rewrite rules on activation.
 */
function {{PREFIX}}c_activate() {
	{{PREFIX}}c_register_post_types();
	{{PREFIX}}c_register_taxonomies();
	flush_rewrite_rules();
}
register_activation_hook( __FILE__, '{{PREFIX}}c_activate' );

/**
 * Flush rewrite rules on deactivation.
 */
function {{PREFIX}}c_deactivate() {
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, '{{PREFIX}}c_deactivate' );
