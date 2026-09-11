<?php
/**
 * Uninstall routine.
 *
 * Runs only when the plugin is deleted from the admin. Content (posts) is
 * intentionally left in place; delete it manually if really wanted.
 *
 * @package {{PACKAGE}}_Core
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

// Example: delete plugin options, e.g. delete_option( '{{PREFIX}}c_settings' ).
