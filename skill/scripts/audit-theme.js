#!/usr/bin/env node
/**
 * audit-theme.js
 *
 * Heuristic static audit of a WordPress theme against security, coding-standard
 * and Theme Review rules. It is a FALLBACK for environments without PHP/Composer;
 * always also run PHPCS with the WordPress standard and the Theme Check plugin.
 *
 * Zero dependencies. Node 18+.
 *
 * Usage:
 *   node audit-theme.js <theme-dir> [--prefix pfx[,pfx2]] [--textdomain slug] [--json] [--quiet]
 *
 * Exit code: 1 when errors were found, 0 otherwise.
 *
 * Checks:
 *   structure   style.css headers, readme.txt, screenshot, required files, forbidden files
 *   escaping    echo/print/printf of unescaped values, raw __()/_e()
 *   input       $_GET/$_POST/... without wp_unslash + sanitize; writes without nonce
 *   prefix      unprefixed functions, classes, constants, handles, image sizes, options, globals
 *   assets      hard-coded <script>/<link>, remote CDN/Google Fonts, bundled jQuery
 *   forbidden   dangerous, deprecated and disallowed functions
 *   territory   plugin-territory features inside the theme
 *   hooks       required classic hooks/functions (wp_head, wp_footer, body_class...)
 *   block       theme.json version/schema, templates/index.html, block delimiter balance
 *   i18n        text-domain mismatches, missing domain, missing translators comments
 *   customizer  add_setting without sanitize_callback
 *   database    $wpdb calls without prepare()
 *   debug       var_dump/print_r/console.log leftovers
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );

// ---------------------------------------------------------------- args

function parseArgs( argv ) {
	const args = { _: [] };
	for ( let i = 0; i < argv.length; i++ ) {
		const a = argv[ i ];
		if ( a.startsWith( '--' ) ) {
			const key = a.slice( 2 );
			const next = argv[ i + 1 ];
			if ( next === undefined || next.startsWith( '--' ) ) {
				args[ key ] = true;
			} else {
				args[ key ] = next;
				i++;
			}
		} else {
			args._.push( a );
		}
	}
	return args;
}

// ---------------------------------------------------------------- findings

const findings = [];
function add( severity, rule, file, line, message ) {
	findings.push( { severity, rule, file: file.replace( /\\/g, '/' ), line, message } );
}
const err = ( ...a ) => add( 'error', ...a );
const warn = ( ...a ) => add( 'warning', ...a );
const info = ( ...a ) => add( 'info', ...a );

// ---------------------------------------------------------------- file walking

const SKIP_DIRS = new Set( [ 'node_modules', 'vendor', '.git', '.svn', '.hg', 'build', 'dist' ] );

function walk( dir, base = dir, out = [] ) {
	for ( const entry of fs.readdirSync( dir, { withFileTypes: true } ) ) {
		const full = path.join( dir, entry.name );
		const rel = path.relative( base, full ).replace( /\\/g, '/' );
		if ( entry.isDirectory() ) {
			out.push( { rel, dir: true } );
			if ( ! SKIP_DIRS.has( entry.name ) ) {
				walk( full, base, out );
			}
		} else {
			out.push( { rel, dir: false, size: entry.isFile() ? fs.statSync( full ).size : 0 } );
		}
	}
	return out;
}

function lineOf( text, index ) {
	let n = 1;
	for ( let i = 0; i < index && i < text.length; i++ ) {
		if ( text.charCodeAt( i ) === 10 ) {
			n++;
		}
	}
	return n;
}

// ---------------------------------------------------------------- PHP lexer

/**
 * Split a PHP file into:
 *   php        PHP code with comments blanked and strings kept (newlines preserved)
 *   phpNoStr   PHP code with comments blanked and string contents replaced:
 *              '...' -> '', "..." -> "" or "$" when interpolated
 *   html       inline HTML only (PHP blanked)
 *   comments   the raw source (for translators: comment lookups)
 * All variants have the same length/line positions as the source.
 */
function lexPhp( src ) {
	const n = src.length;
	const php = new Array( n ).fill( ' ' );
	const phpNoStr = new Array( n ).fill( ' ' );
	const html = new Array( n ).fill( ' ' );

	let i = 0;
	let inPhp = false;

	const keepNl = ( arr, idx ) => {
		if ( src[ idx ] === '\n' ) {
			arr[ idx ] = '\n';
		}
	};

	while ( i < n ) {
		if ( ! inPhp ) {
			const open = src.indexOf( '<?', i );
			const end = open === -1 ? n : open;
			for ( let k = i; k < end; k++ ) {
				html[ k ] = src[ k ];
				keepNl( php, k );
				keepNl( phpNoStr, k );
			}
			if ( open === -1 ) {
				break;
			}
			// "<?php" or "<?=" ; ignore "<?xml".
			if ( src.startsWith( '<?php', open ) || /^<\?\s/.test( src.slice( open, open + 3 ) ) ) {
				i = open + ( src.startsWith( '<?php', open ) ? 5 : 2 );
				inPhp = true;
			} else if ( src.startsWith( '<?=', open ) ) {
				// Short echo: positions stay aligned; the audit re-scans src for "<?=".
				i = open + 3;
				inPhp = true;
			} else {
				html[ open ] = '<';
				html[ open + 1 ] = '?';
				i = open + 2;
			}
			continue;
		}

		const c = src[ i ];
		const c2 = src.slice( i, i + 2 );

		// Close tag.
		if ( c2 === '?>' ) {
			php[ i ] = ';';
			phpNoStr[ i ] = ';';
			i += 2;
			inPhp = false;
			continue;
		}

		// Comments.
		if ( c2 === '//' || c === '#' ) {
			while ( i < n && src[ i ] !== '\n' && src.slice( i, i + 2 ) !== '?>' ) {
				i++;
			}
			continue;
		}
		if ( c2 === '/*' ) {
			const close = src.indexOf( '*/', i + 2 );
			const end = close === -1 ? n : close + 2;
			for ( let k = i; k < end; k++ ) {
				keepNl( php, k );
				keepNl( phpNoStr, k );
			}
			i = end;
			continue;
		}

		// Heredoc / nowdoc.
		if ( src.startsWith( '<<<', i ) ) {
			const m = /^<<<\s*(['"]?)([A-Za-z_]\w*)\1\r?\n/.exec( src.slice( i ) );
			if ( m ) {
				const id = m[ 2 ];
				const start = i + m[ 0 ].length;
				const re = new RegExp( '^\\s*' + id + '\\b', 'm' );
				const rest = src.slice( start );
				const mm = re.exec( rest );
				const end = mm ? start + mm.index + mm[ 0 ].length : n;
				for ( let k = i; k < end; k++ ) {
					php[ k ] = src[ k ];
					keepNl( phpNoStr, k );
				}
				phpNoStr[ i ] = '"';
				phpNoStr[ i + 1 ] = m[ 1 ] === "'" ? '"' : '$';
				phpNoStr[ i + 2 ] = '"';
				i = end;
				continue;
			}
		}

		// Strings.
		if ( c === "'" || c === '"' ) {
			const q = c;
			let j = i + 1;
			let interpolated = false;
			while ( j < n ) {
				if ( src[ j ] === '\\' ) {
					j += 2;
					continue;
				}
				if ( src[ j ] === q ) {
					break;
				}
				if ( q === '"' && src[ j ] === '$' ) {
					interpolated = true;
				}
				j++;
			}
			const end = Math.min( j + 1, n );
			for ( let k = i; k < end; k++ ) {
				php[ k ] = src[ k ];
				keepNl( phpNoStr, k );
			}
			phpNoStr[ i ] = q;
			if ( interpolated ) {
				phpNoStr[ i + 1 ] = '$';
				phpNoStr[ end - 1 ] = q;
			} else if ( end - 1 > i ) {
				phpNoStr[ end - 1 ] = q;
			}
			i = end;
			continue;
		}

		php[ i ] = c;
		phpNoStr[ i ] = c;
		i++;
	}

	return {
		php: php.join( '' ),
		phpNoStr: phpNoStr.join( '' ),
		html: html.join( '' ),
		src,
	};
}

// ---------------------------------------------------------------- expression helpers

/** Read from idx until a top-level ';' (strings already neutralised). Returns [expr, endIdx]. */
function readStatement( code, idx ) {
	let depth = 0;
	let j = idx;
	while ( j < code.length ) {
		const ch = code[ j ];
		if ( ch === '(' || ch === '[' || ch === '{' ) {
			depth++;
		} else if ( ch === ')' || ch === ']' || ch === '}' ) {
			depth--;
			if ( depth < 0 ) {
				break;
			}
		} else if ( ch === ';' && depth === 0 ) {
			break;
		}
		j++;
	}
	return [ code.slice( idx, j ), j ];
}

/** Split on a top-level operator character sequence. */
function splitTopLevel( expr, sep ) {
	const parts = [];
	let depth = 0;
	let last = 0;
	for ( let j = 0; j < expr.length; j++ ) {
		const ch = expr[ j ];
		if ( ch === '(' || ch === '[' || ch === '{' ) {
			depth++;
		} else if ( ch === ')' || ch === ']' || ch === '}' ) {
			depth--;
		} else if ( depth === 0 && expr.startsWith( sep, j ) ) {
			// Avoid splitting "->" on "." or "=>" ; sep is '.', ',', '?' or ':'.
			if ( sep === ':' && ( expr[ j + 1 ] === ':' || expr[ j - 1 ] === ':' ) ) {
				continue; // static call ::
			}
			if ( sep === '?' && expr[ j + 1 ] === '?' ) {
				j++;
				continue; // null coalesce ??
			}
			parts.push( expr.slice( last, j ) );
			last = j + sep.length;
		}
	}
	parts.push( expr.slice( last ) );
	return parts;
}

function stripOuterParens( s ) {
	s = s.trim();
	while ( s.startsWith( '(' ) && s.endsWith( ')' ) ) {
		// Ensure the opening paren matches the closing one.
		let depth = 0;
		let matches = true;
		for ( let j = 0; j < s.length; j++ ) {
			if ( s[ j ] === '(' ) {
				depth++;
			} else if ( s[ j ] === ')' ) {
				depth--;
				if ( depth === 0 && j !== s.length - 1 ) {
					matches = false;
					break;
				}
			}
		}
		if ( ! matches ) {
			break;
		}
		s = s.slice( 1, -1 ).trim();
	}
	return s;
}

const ESCAPING_FUNCTIONS = new Set( [
	'esc_html', 'esc_attr', 'esc_url', 'esc_url_raw', 'esc_js', 'esc_textarea', 'esc_xml', 'esc_sql',
	'esc_html__', 'esc_html_e', 'esc_html_x', 'esc_attr__', 'esc_attr_e', 'esc_attr_x',
	'wp_kses', 'wp_kses_post', 'wp_kses_data', 'wp_kses_allowed_html', 'wp_json_encode', 'json_encode',
	'absint', 'intval', 'floatval', 'boolval', 'number_format', 'number_format_i18n', 'count', 'rawurlencode', 'urlencode', 'urlencode_deep',
	'sanitize_text_field', 'sanitize_textarea_field', 'sanitize_email', 'sanitize_key', 'sanitize_title', 'sanitize_title_with_dashes',
	'sanitize_title_for_query', 'sanitize_user', 'sanitize_file_name', 'sanitize_html_class', 'sanitize_hex_color', 'sanitize_hex_color_no_hash',
	'sanitize_mime_type', 'sanitize_option', 'sanitize_sql_orderby', 'sanitize_term', 'sanitize_term_field', 'sanitize_meta', 'sanitize_url',
	'tag_escape', 'wp_strip_all_tags', 'strip_tags', 'htmlspecialchars', 'htmlentities', 'wp_spaces_regexp', 'like_escape', 'filter_var', 'filter_input',
	'wp_nonce_field', 'wp_create_nonce', 'wp_nonce_url', 'checked', 'selected', 'disabled', 'readonly',
] );

const AUTO_ESCAPED_FUNCTIONS = new Set( [
	'bloginfo', 'body_class', 'post_class', 'comment_class', 'get_search_form', 'get_search_query', 'get_the_ID', 'get_the_id', 'get_the_date',
	'get_the_time', 'get_the_modified_date', 'the_title_attribute', 'get_the_author', 'get_the_author_link', 'get_avatar', 'get_calendar',
	'get_the_post_thumbnail', 'wp_get_attachment_image', 'wp_get_attachment_link', 'get_the_term_list', 'paginate_links', 'paginate_comments_links',
	'wp_nav_menu', 'wp_list_categories', 'wp_list_comments', 'wp_list_pages', 'wp_link_pages', 'wp_tag_cloud', 'wp_login_form', 'wp_loginout',
	'wp_dropdown_categories', 'wp_dropdown_users', 'wp_get_archives', 'get_archives_link', 'get_attachment_link', 'get_comment_author_link',
	'get_delete_post_link', 'get_edit_post_link', 'get_the_category_list', 'get_the_tag_list', 'get_the_password_form', 'get_the_posts_pagination',
	'get_the_post_navigation', 'get_the_posts_navigation', 'get_comments_number', 'get_comment_text', 'get_the_title_rss', 'do_shortcode',
	'the_title', 'the_content', 'the_excerpt', 'the_permalink', 'the_ID', 'the_date', 'the_time', 'the_author', 'the_post_thumbnail', 'the_archive_title',
	'the_archive_description', 'get_the_archive_title', 'get_the_archive_description', 'single_post_title', 'single_cat_title', 'single_tag_title',
	'single_term_title', 'post_type_archive_title', 'category_description', 'tag_description', 'term_description', 'wp_title', 'get_bloginfo_rss',
	'wp_get_attachment_image_srcset', 'wp_get_attachment_image_sizes', 'get_custom_logo', 'the_custom_logo', 'wp_body_open', 'wp_head', 'wp_footer',
	'language_attributes', 'get_language_attributes', 'wp_unique_id', 'wp_get_theme', 'comment_form', 'comments_template', 'get_post_format',
	'get_post_type', 'get_query_var', 'has_post_thumbnail', 'wp_kses_post', 'implode', 'join', 'array_map',
] );

const CORE_HANDLES = new Set( [
	'jquery', 'jquery-core', 'jquery-migrate', 'jquery-ui-core', 'jquery-ui-widget', 'jquery-ui-mouse', 'jquery-ui-accordion', 'jquery-ui-autocomplete',
	'jquery-ui-button', 'jquery-ui-datepicker', 'jquery-ui-dialog', 'jquery-ui-draggable', 'jquery-ui-droppable', 'jquery-ui-menu', 'jquery-ui-progressbar',
	'jquery-ui-resizable', 'jquery-ui-selectable', 'jquery-ui-slider', 'jquery-ui-sortable', 'jquery-ui-spinner', 'jquery-ui-tabs', 'jquery-ui-tooltip',
	'jquery-form', 'jquery-color', 'jquery-masonry', 'masonry', 'imagesloaded', 'comment-reply', 'thickbox', 'underscore', 'backbone', 'wp-util', 'wp-api-fetch',
	'wp-i18n', 'wp-hooks', 'wp-element', 'wp-components', 'wp-blocks', 'wp-block-editor', 'wp-editor', 'wp-data', 'wp-compose', 'wp-dom-ready', 'wp-a11y',
	'wp-mediaelement', 'mediaelement', 'customize-preview', 'customize-controls', 'wp-color-picker', 'media-upload', 'media-views', 'hoverIntent', 'hoverintent-js',
	'wp-block-library', 'wp-block-library-theme', 'classic-theme-styles', 'global-styles', 'dashicons', 'editor-buttons', 'wp-edit-blocks', 'wp-edit-post',
	'react', 'react-dom', 'lodash', 'moment', 'wp-polyfill', 'wp-embed', 'wp-emoji', 'wp-emoji-release', 'twemoji', 'swfobject', 'plupload', 'wp-plupload',
	'wp-lists', 'wp-ajax-response', 'wp-pointer', 'suggest', 'password-strength-meter', 'zxcvbn-async', 'common', 'admin-bar', 'utils', 'wp-auth-check',
	'wp-interactivity', 'wp-interactivity-router', 'wp-script-modules', 'wp-admin', 'login', 'install', 'buttons', 'forms', 'l10n', 'wp-jquery-ui-dialog',
] );

/**
 * Decide whether an output expression is safe.
 * Returns { safe: bool, reason: string }.
 */
function isSafeExpr( raw, depth = 0 ) {
	if ( depth > 12 ) {
		return { safe: false, reason: 'expression too deep to analyse' };
	}
	let expr = stripOuterParens( raw );
	if ( expr === '' ) {
		return { safe: true };
	}

	// Ternary.
	const q = splitTopLevel( expr, '?' );
	if ( q.length > 1 ) {
		const branches = splitTopLevel( q.slice( 1 ).join( '?' ), ':' );
		const cands = branches.filter( ( b ) => b.trim() !== '' );
		if ( q.slice( 1 ).join( '?' ).trim().startsWith( ':' ) ) {
			cands.push( q[ 0 ] ); // shorthand ?: returns the condition itself
		}
		for ( const b of cands ) {
			const r = isSafeExpr( b, depth + 1 );
			if ( ! r.safe ) {
				return r;
			}
		}
		return { safe: true };
	}

	// Concatenation.
	const parts = splitTopLevel( expr, '.' ).filter( ( p ) => p.trim() !== '' );
	if ( parts.length > 1 ) {
		for ( const p of parts ) {
			const r = isSafeExpr( p, depth + 1 );
			if ( ! r.safe ) {
				return r;
			}
		}
		return { safe: true };
	}

	// Literals.
	if ( /^'[^']*'$/.test( expr ) || /^"[^"]*"$/.test( expr ) ) {
		return expr === '"$"' ? { safe: false, reason: 'double-quoted string with interpolated variable' } : { safe: true };
	}
	if ( /^-?\d+(\.\d+)?$/.test( expr ) || /^(true|false|null)$/i.test( expr ) ) {
		return { safe: true };
	}
	if ( /^[A-Z_][A-Z0-9_]*$/.test( expr ) || /^__[A-Z]+__$/.test( expr ) ) {
		return { safe: true }; // constant
	}

	// Casts.
	if ( /^\(\s*(int|integer|float|double|bool|boolean)\s*\)/i.test( expr ) ) {
		return { safe: true };
	}

	// Variables with a "this was escaped" suffix.
	if ( /^\$[a-z_]\w*(_escaped|_safe|_clean|_html)$/i.test( expr ) ) {
		return { safe: true, soft: true };
	}
	if ( /^\$/.test( expr ) ) {
		return { safe: false, reason: `variable ${ expr.split( /[\s\[\-]/ )[ 0 ] } printed without escaping` };
	}

	// Function calls.
	const m = /^(\\?[A-Za-z_][\w\\]*)\s*\(([\s\S]*)\)$/.exec( expr );
	if ( m ) {
		const fn = m[ 1 ].replace( /^\\/, '' );
		const argStr = m[ 2 ];
		if ( ESCAPING_FUNCTIONS.has( fn ) ) {
			return { safe: true };
		}
		if ( AUTO_ESCAPED_FUNCTIONS.has( fn ) ) {
			if ( fn === 'implode' || fn === 'join' ) {
				return /array_map\s*\(\s*'(esc_|wp_kses|sanitize_|absint|intval)/.test( argStr ) || /^\s*'[^']*'\s*,\s*array_map/.test( argStr )
					? { safe: true }
					: { safe: false, reason: 'implode() of values that are not visibly escaped' };
			}
			if ( fn === 'array_map' ) {
				return /^\s*'(esc_|wp_kses|sanitize_|absint|intval)/.test( argStr ) ? { safe: true } : { safe: false, reason: 'array_map() with a non-escaping callback' };
			}
			return { safe: true };
		}
		if ( fn === 'sprintf' || fn === 'vsprintf' || fn === 'printf' ) {
			const args = splitTopLevel( argStr, ',' );
			for ( const a of args ) {
				if ( a.trim() === '' ) {
					continue;
				}
				const r = isSafeExpr( a, depth + 1 );
				if ( ! r.safe ) {
					return { safe: false, reason: `${ fn }() argument not escaped: ${ r.reason }` };
				}
			}
			return { safe: true };
		}
		if ( fn === '__' || fn === '_x' || fn === '_n' || fn === '_nx' || fn === 'translate' ) {
			return { safe: false, reason: `${ fn }() output is not escaped; use esc_html${ fn === '__' ? '__' : fn }() or wrap in esc_html()/wp_kses_post()` };
		}
		if ( /^(get_|wp_|the_)/.test( fn ) || true ) {
			return { safe: false, reason: `${ fn }() return value printed without escaping` };
		}
	}

	// Method calls / array access on variables.
	if ( /^\$/.test( expr ) || /->/.test( expr ) || /::/.test( expr ) ) {
		return { safe: false, reason: 'value printed without escaping' };
	}

	return { safe: false, reason: 'could not verify escaping' };
}

// ---------------------------------------------------------------- style.css

function parseStyleHeaders( css ) {
	const headers = {};
	const block = /\/\*([\s\S]*?)\*\//.exec( css );
	if ( ! block ) {
		return headers;
	}
	for ( const line of block[ 1 ].split( /\r?\n/ ) ) {
		const m = /^\s*\*?\s*([A-Za-z][A-Za-z ]+?):\s*(.+?)\s*$/.exec( line );
		if ( m ) {
			headers[ m[ 1 ].trim() ] = m[ 2 ].trim();
		}
	}
	return headers;
}

function pngDimensions( buf ) {
	if ( buf.length > 24 && buf[ 0 ] === 0x89 && buf.toString( 'ascii', 1, 4 ) === 'PNG' ) {
		return { w: buf.readUInt32BE( 16 ), h: buf.readUInt32BE( 20 ) };
	}
	// JPEG: scan for SOF marker.
	if ( buf[ 0 ] === 0xff && buf[ 1 ] === 0xd8 ) {
		let i = 2;
		while ( i < buf.length ) {
			if ( buf[ i ] !== 0xff ) {
				i++;
				continue;
			}
			const marker = buf[ i + 1 ];
			if ( marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc ) {
				return { h: buf.readUInt16BE( i + 5 ), w: buf.readUInt16BE( i + 7 ) };
			}
			i += 2 + buf.readUInt16BE( i + 2 );
		}
	}
	return null;
}

// ---------------------------------------------------------------- checks

const FORBIDDEN = [
	// [regex, severity, message]
	[ /\beval\s*\(/, 'error', 'eval() is never allowed in a theme.' ],
	[ /\bcreate_function\s*\(/, 'error', 'create_function() is removed in PHP 8; use closures.' ],
	[ /\bbase64_decode\s*\(/, 'error', 'base64_decode() on code/strings is rejected by Theme Review (obfuscation).' ],
	[ /\bextract\s*\(/, 'error', 'extract() injects variables; assign explicitly.' ],
	[ /\bunserialize\s*\(/, 'warning', 'unserialize() on untrusted data allows object injection; prefer json_decode().' ],
	[ /\bquery_posts\s*\(/, 'error', 'query_posts() breaks the main query and pagination; use pre_get_posts or new WP_Query.' ],
	[ /\bmysqli?_[a-z_]+\s*\(/, 'error', 'Direct mysql/mysqli calls bypass $wpdb; use $wpdb->prepare().' ],
	[ /\bnew\s+PDO\s*\(/, 'error', 'PDO bypasses $wpdb.' ],
	[ /\bcurl_[a-z_]+\s*\(/, 'error', 'curl_* is not allowed; use wp_remote_get()/wp_remote_post().' ],
	[ /\bfile_get_contents\s*\(\s*['"]https?:/, 'error', 'file_get_contents() on a URL is not allowed; use wp_remote_get().' ],
	[ /\bfopen\s*\(\s*['"]https?:/, 'error', 'fopen() on a URL is not allowed; use wp_remote_get().' ],
	[ /\b(file_put_contents|fwrite|unlink|mkdir|rmdir|rename|copy|chmod|touch)\s*\(/, 'error', 'Themes must not write to the filesystem; that is plugin territory (WP_Filesystem).' ],
	[ /\bmove_uploaded_file\s*\(/, 'error', 'Upload handling belongs in a plugin (wp_handle_upload()).' ],
	[ /\bheader\s*\(\s*['"]Location:/i, 'error', 'Use wp_safe_redirect() + exit instead of header( "Location" ).' ],
	[ /\bwp_redirect\s*\(/, 'warning', 'Prefer wp_safe_redirect() and always exit after redirecting.' ],
	[ /\b(ini_set|set_time_limit|error_reporting|ini_alter|ini_restore)\s*\(/, 'error', 'Environment tampering is not allowed in a theme.' ],
	[ /\bwp_deregister_script\s*\(\s*['"]jquery['"]/, 'error', 'Never deregister core jQuery.' ],
	[ /\bwp_(register|enqueue)_script\s*\(\s*['"]jquery['"]\s*,\s*['"]?\S/, 'error', 'Never bundle or replace core jQuery; declare it as a dependency instead.' ],
	[ /\bshow_admin_bar\s*\(\s*false|add_filter\s*\(\s*['"]show_admin_bar['"]\s*,\s*['"]__return_false/, 'error', 'Hiding the admin bar is not allowed (plugin territory).' ],
	[ /\bremove_action\s*\(\s*['"]wp_head['"]\s*,\s*['"](wp_generator|feed_links|feed_links_extra|wp_resource_hints|adjacent_posts_rel_link_wp_head|wp_shortlink_wp_head|rsd_link|rest_output_link_wp_head|wp_oembed_add_discovery_links|rel_canonical|wlwmanifest_link)['"]/, 'warning', 'Removing non-presentational wp_head hooks is plugin territory (Theme Review reject; tolerated in private client themes if documented).' ],
	[ /\bremove_action\s*\(\s*['"]wp_head['"]\s*,\s*['"](print_emoji_detection_script)['"]/, 'info', 'Removing emoji scripts is plugin territory for wp.org themes; acceptable in private themes if documented.' ],
	[ /\badd_filter\s*\(\s*['"]upload_mimes['"]/, 'error', 'Enabling mime types (e.g. SVG upload) is plugin territory and a security risk.' ],
	[ /\bdefine\s*\(\s*['"](WP_DEBUG|WP_MEMORY_LIMIT|DISALLOW_FILE_EDIT|WP_CACHE)['"]/, 'error', 'wp-config constants must not be defined by a theme.' ],
	[ /\bob_start\s*\(/, 'warning', 'Output buffering around core output is brittle; prefer filters.' ],
	[ /\bstrip_tags\s*\(/, 'warning', 'strip_tags() is not a security function; use wp_kses()/wp_strip_all_tags().' ],
	[ /\b(rand|mt_rand)\s*\(/, 'info', 'rand()/mt_rand() are predictable; use wp_rand() or random_int() for anything security related.' ],
	[ /\bdate\s*\(\s*['"]/, 'info', 'date() ignores the site timezone; use wp_date() or get_the_date().' ],
	[ /\b(var_dump|print_r|var_export|error_log|debug_print_backtrace)\s*\(/, 'warning', 'Debug output left in theme code.' ],
	[ /\$wpdb\s*->\s*query\s*\(\s*['"]\s*(CREATE|ALTER|DROP)\s+TABLE/i, 'error', 'Themes must not create or alter database tables.' ],
	[ /\bdbDelta\s*\(/, 'error', 'Themes must not create database tables (dbDelta).' ],
	[ /\bwp_schedule_event\s*\(/, 'error', 'Cron jobs are plugin territory.' ],
	[ /\bwp_mail\s*\(/, 'warning', 'Sending email from a theme is plugin territory.' ],
	[ /\bwp_remote_(get|post|request)\s*\(/, 'warning', 'Remote requests from a theme need user consent and are usually plugin territory.' ],
	[ /\bwp_safe_remote_(get|post|request)\s*\(/, 'warning', 'Remote requests from a theme need user consent and are usually plugin territory.' ],
	[ /\bload_plugin_textdomain\s*\(/, 'warning', 'Themes use load_theme_textdomain(), not load_plugin_textdomain().' ],
	[ /\bwp_deregister_style\s*\(\s*['"](wp-block-library)['"]/, 'warning', 'Deregistering wp-block-library breaks core block styling on the front end.' ],
	[ /\@\s*(\$wpdb|file_get_contents|unlink|mkdir|fopen|include|require)/, 'warning', 'The @ error-suppression operator hides bugs.' ],
];

const DEPRECATED = [
	'get_currentuserinfo', 'get_theme_data', 'get_current_theme', 'wp_get_http', 'get_shortcut_link', 'get_the_author_email', 'get_the_author_login',
	'get_the_author_url', 'get_the_author_description', 'get_the_author_ID', 'the_author_email', 'the_author_login', 'the_author_url', 'the_author_ID',
	'attribute_escape', 'wp_specialchars', 'clean_url', 'js_escape', 'get_settings', 'get_page', 'wp_get_sites', 'screen_icon', 'get_screen_icon',
	'the_meta', 'get_the_meta', 'wp_title_rss', 'get_bloginfo_rss', 'get_links', 'get_linksbyname', 'wp_get_links', 'get_postdata', 'start_wp',
	'the_category_ID', 'the_category_head', 'previous_post', 'next_post', 'user_can_create_post', 'user_can_edit_post', 'get_the_category_by_ID',
	'get_category_children', 'get_all_category_ids', 'wp_get_post_categories', 'is_taxonomy', 'is_term', 'get_the_attachment_link',
	'get_attachment_icon_src', 'get_attachment_icon', 'get_attachment_innerHTML', 'wp_load_image', 'image_resize', 'wp_get_single_post',
	'get_all_page_ids', 'wp_richedit_pre', 'wp_htmledit_pre', 'add_custom_image_header', 'remove_custom_image_header', 'add_custom_background',
	'remove_custom_background', 'get_themes', 'get_theme', 'get_broken_themes', 'current_theme_info', 'add_option_whitelist', 'remove_option_whitelist',
	'wp_get_theme_data', 'twentyten_setup', 'get_user_option_default', 'wpmu_admin_do_redirect', 'get_current_site_name', 'wpmu_current_site',
	'wp_get_referer_after_login', 'set_current_user', 'wp_login', 'get_userdatabylogin', 'get_userdata_by_email', 'get_profile', 'get_usernumposts',
	'get_users_of_blog', 'get_user_by_email', 'user_pass_ok', 'wp_setcookie', 'wp_clearcookie', 'get_the_author_msn', 'the_author_msn',
	'the_author_aim', 'the_author_yim', 'get_the_author_aim', 'get_the_author_yim', 'get_the_author_icq', 'the_author_icq', 'get_alloptions',
	'wp_convert_bytes_to_hr', 'wp_convert_hr_to_bytes', 'wp_get_sidebars_widgets_deprecated', 'get_option_sidebars', 'wp_no_robots',
	'_wp_json_sanity_check', 'wp_make_content_images_responsive', 'wp_get_current_user_id', 'is_email_address_unsafe_deprecated',
];

const PLUGIN_TERRITORY = [
	[ /\bregister_post_type\s*\(/, 'error', 'register_post_type() belongs in the companion plugin, not the theme (content is lost on theme switch).' ],
	[ /\bregister_taxonomy\s*\(/, 'error', 'register_taxonomy() belongs in the companion plugin, not the theme.' ],
	[ /\bregister_post_meta\s*\(|\bregister_meta\s*\(/, 'warning', 'Meta registration usually belongs in the companion plugin.' ],
	[ /\badd_shortcode\s*\(/, 'error', 'Shortcodes are plugin territory; ship them in the companion plugin or as a block.' ],
	[ /\bregister_block_type(_from_metadata)?\s*\(/, 'error', 'Custom blocks belong in the companion plugin.' ],
	[ /\badd_role\s*\(|\bremove_role\s*\(|->add_cap\s*\(/, 'error', 'Roles and capabilities are plugin territory.' ],
	[ /\badd_filter\s*\(\s*['"]user_contactmethods['"]/, 'error', 'Custom user contact methods are plugin territory.' ],
	[ /\badd_action\s*\(\s*['"]after_switch_theme['"][\s\S]{0,200}?wp_(safe_)?redirect/, 'error', 'Redirecting on theme activation is not allowed.' ],
	[ /\badd_action\s*\(\s*['"](admin_menu|admin_init)['"]/, 'info', 'Admin pages: keep them under Appearance, gate with edit_theme_options, enqueue assets only on your page.' ],
	[ /\badd_menu_page\s*\(/, 'warning', 'Theme admin pages must be sub-pages under Appearance (add_theme_page), not top-level menus.' ],
	[ /\bregister_rest_route\s*\(/, 'info', 'REST routes are tolerated in themes for presentation (load more); cleaner in the companion plugin. Ensure permission_callback.' ],
	[ /\bwp_ajax_nopriv_/, 'info', 'Logged-out AJAX endpoint: ensure check_ajax_referer() and sanitised input.' ],
	[ /\b(google-analytics\.com|googletagmanager\.com|gtag\(|fbq\(|connect\.facebook\.net|hotjar|clarity\.ms)/i, 'error', 'Analytics/tracking is plugin territory and needs consent.' ],
	[ /\b(schema\.org|application\/ld\+json)/i, 'warning', 'Structured data (schema.org) is SEO/plugin territory.' ],
	[ /<meta\s+(name|property)=["'](description|og:|twitter:)/i, 'warning', 'SEO/social meta tags are plugin territory.' ],
	[ /\bwp_login_form\s*\(|\bwp_signon\s*\(|\bwp_create_user\s*\(/, 'warning', 'Login/registration logic is plugin territory.' ],
];

const REMOTE_RESOURCE = /https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com|stackpath\.bootstrapcdn\.com|cdn\.bootcss\.com|code\.jquery\.com|ajax\.googleapis\.com|use\.fontawesome\.com|kit\.fontawesome\.com|fonts\.bunny\.net|use\.typekit\.net)/i;

const SANITIZERS = /\b(sanitize_[a-z_]+|absint|intval|floatval|boolval|wp_kses(_post|_data)?|esc_url_raw|rest_sanitize_[a-z_]+|filter_var|filter_input|wp_verify_nonce|check_admin_referer|check_ajax_referer|is_email|wp_parse_id_list|array_map\s*\(\s*['"](sanitize_|absint|intval))|\(\s*(int|float|bool)\s*\)/;

const I18N = {
	__: 2, _e: 2, _x: 3, _ex: 3, _n: 4, _nx: 5, _n_noop: 3, _nx_noop: 4,
	esc_html__: 2, esc_html_e: 2, esc_html_x: 3, esc_attr__: 2, esc_attr_e: 2, esc_attr_x: 3,
};

// ---------------------------------------------------------------- per-file PHP audit

function auditPhpFile( file, src, ctx ) {
	const lx = lexPhp( src );
	const { php, phpNoStr, html } = lx;
	const rel = file;
	const hasIgnore = ( line, sniff ) => {
		const l = src.split( /\r?\n/ )[ line - 1 ] || '';
		return /phpcs:(ignore|disable)/.test( l ) && ( ! sniff || l.includes( sniff ) || ! /phpcs:(ignore|disable)\s+\S/.test( l ) );
	};
	const hasIgnoreRange = ( from, to, sniff ) => {
		for ( let ln = from; ln <= to; ln++ ) {
			if ( hasIgnore( ln, sniff ) ) {
				return true;
			}
		}
		return false;
	};

	// ---- Escaping: echo / print / short echo / printf.
	{
		const re = /(?<![\w$>])(echo|print)\b(?!\s*\()|(?<![\w$>])(echo|print)\s*\(|(?<![\w$>])(printf|vprintf)\s*\(/g;
		let m;
		const noStr = phpNoStr;
		// Short echo tags: positions in noStr align with src, so scan src for '<?='.
		const shortEchoIdx = [];
		let se = src.indexOf( '<?=' );
		while ( se !== -1 ) {
			shortEchoIdx.push( se + 3 );
			se = src.indexOf( '<?=', se + 3 );
		}
		const starts = [];
		while ( ( m = re.exec( noStr ) ) !== null ) {
			const kw = m[ 1 ] || m[ 2 ] || m[ 3 ];
			if ( ! kw ) {
				continue;
			}
			starts.push( { idx: m.index + kw.length, kind: kw, at: m.index } );
		}
		for ( const s of shortEchoIdx ) {
			starts.push( { idx: s, kind: 'echo', at: s - 3 } );
		}
		for ( const s of starts ) {
			const line = lineOf( noStr, s.at );
			let [ expr, endIdx ] = readStatement( noStr, s.idx );
			if ( hasIgnoreRange( line, lineOf( noStr, endIdx ), 'EscapeOutput' ) ) {
				continue;
			}
			expr = expr.trim();
			if ( s.kind === 'printf' || s.kind === 'vprintf' ) {
				// expr is "( args )" possibly followed by nothing.
				const inner = stripOuterParens( expr );
				const args = splitTopLevel( inner, ',' );
				for ( const a of args ) {
					if ( a.trim() === '' ) {
						continue;
					}
					const r = isSafeExpr( a );
					if ( ! r.safe ) {
						err( 'escaping', rel, line, `${ s.kind }() argument not escaped: ${ r.reason }` );
						break;
					}
				}
				continue;
			}
			// echo a, b, c;
			const items = splitTopLevel( expr, ',' );
			for ( const it of items ) {
				if ( it.trim() === '' ) {
					continue;
				}
				const r = isSafeExpr( it );
				if ( ! r.safe ) {
					err( 'escaping', rel, line, `Unescaped output: ${ r.reason }.` );
					break;
				} else if ( r.soft ) {
					info( 'escaping', rel, line, 'Variable named *_escaped/_safe printed; PHPCS will still flag it without a phpcs:ignore comment.' );
				}
			}
		}
	}

	// ---- Raw _e() / _ex() (never escaped).
	{
		const re = /(?<![\w$])_(e|ex)\s*\(/g;
		let m;
		while ( ( m = re.exec( phpNoStr ) ) !== null ) {
			const line = lineOf( phpNoStr, m.index );
			if ( ! hasIgnore( line, 'EscapeOutput' ) ) {
				warn( 'escaping', rel, line, `_${ m[ 1 ] }() prints translated text without escaping; use esc_html_e()/esc_attr_e()/esc_html_x().` );
			}
		}
	}

	// ---- Superglobals.
	{
		const re = /\$_(GET|POST|REQUEST|COOKIE|SERVER|FILES)\s*\[/g;
		let m;
		const seenLines = new Set();
		while ( ( m = re.exec( phpNoStr ) ) !== null ) {
			const line = lineOf( phpNoStr, m.index );
			if ( seenLines.has( line + m[ 1 ] ) ) {
				continue;
			}
			seenLines.add( line + m[ 1 ] );
			if ( hasIgnore( line ) ) {
				continue;
			}
			// Find the statement containing this usage.
			let start = m.index;
			while ( start > 0 && phpNoStr[ start ] !== ';' && phpNoStr[ start ] !== '{' && phpNoStr[ start ] !== '}' ) {
				start--;
			}
			const [ stmt ] = readStatement( phpNoStr, start + 1 );
			const before = phpNoStr.slice( Math.max( 0, m.index - 40 ), m.index );
			const inIsset = /\b(isset|empty|array_key_exists)\s*\(\s*$/.test( before ) || /\b(isset|empty)\s*\([^)]*$/.test( before );
			if ( inIsset ) {
				continue;
			}
			const sg = m[ 1 ];
			if ( sg === 'FILES' ) {
				err( 'input', rel, line, '$_FILES handling belongs in a plugin (wp_handle_upload()).' );
				continue;
			}
			if ( ! SANITIZERS.test( stmt ) ) {
				err( 'input', rel, line, `$_${ sg } used without a sanitizing/validating function in the same statement.` );
			} else if ( ! /\bwp_unslash\s*\(/.test( stmt ) && sg !== 'FILES' ) {
				warn( 'input', rel, line, `$_${ sg } used without wp_unslash() before sanitizing.` );
			}
		}
		const hasPost = /\$_(POST|REQUEST)\s*\[/.test( phpNoStr );
		const hasNonce = /\b(wp_verify_nonce|check_admin_referer|check_ajax_referer)\s*\(/.test( phpNoStr );
		if ( hasPost && ! hasNonce ) {
			err( 'input', rel, lineOf( phpNoStr, phpNoStr.search( /\$_(POST|REQUEST)\s*\[/ ) ), '$_POST/$_REQUEST read without any nonce verification in this file.' );
		}
		const hasGet = /\$_GET\s*\[/.test( phpNoStr );
		if ( hasGet && ! hasNonce && ! /phpcs:ignore\s+\S*NonceVerification/.test( src ) ) {
			info( 'input', rel, lineOf( phpNoStr, phpNoStr.search( /\$_GET\s*\[/ ) ), '$_GET read without nonce verification (fine for read-only filters; add a phpcs:ignore comment with a reason).' );
		}
	}

	// ---- Prefixes.
	if ( ctx.prefixes.length ) {
		const okPrefix = ( name ) => {
			const n = name.toLowerCase();
			return ctx.prefixes.some( ( p ) => n.startsWith( p.toLowerCase() ) || n.startsWith( p.toLowerCase().replace( /_/g, '-' ) ) );
		};
		// Functions (skip methods: preceded by visibility/static keyword).
		const fre = /(?<![\w$>:])function\s+&?\s*([A-Za-z_]\w*)\s*\(/g;
		let m;
		while ( ( m = fre.exec( phpNoStr ) ) !== null ) {
			const before = phpNoStr.slice( Math.max( 0, m.index - 40 ), m.index );
			if ( /\b(public|private|protected|static|abstract|final)\s+$/.test( before ) ) {
				continue;
			}
			// Inside a class body? Heuristic: a "class " declaration earlier and unmatched braces.
			const name = m[ 1 ];
			if ( name.startsWith( '__' ) || okPrefix( name ) ) {
				continue;
			}
			const line = lineOf( phpNoStr, m.index );
			if ( ! hasIgnore( line, 'PrefixAllGlobals' ) && ! /\bclass\s+\w+/.test( phpNoStr.slice( 0, m.index ) ) ) {
				err( 'prefix', rel, line, `Function ${ name }() is not prefixed (expected one of: ${ ctx.prefixes.join( ', ' ) }).` );
			} else if ( ! hasIgnore( line, 'PrefixAllGlobals' ) ) {
				warn( 'prefix', rel, line, `Function ${ name }() may be an unprefixed global (or a class method; verify).` );
			}
		}
		// Classes / interfaces / traits.
		const cre = /(?<![\w$>:])(class|interface|trait|enum)\s+([A-Za-z_]\w*)/g;
		while ( ( m = cre.exec( phpNoStr ) ) !== null ) {
			if ( ! okPrefix( m[ 2 ] ) && ! /\bnamespace\s+[\w\\]+/.test( phpNoStr ) ) {
				err( 'prefix', rel, lineOf( phpNoStr, m.index ), `${ m[ 1 ] } ${ m[ 2 ] } is not prefixed.` );
			}
		}
		// Namespace.
		const nre = /(?<![\w$>:])namespace\s+([A-Za-z_][\w\\]*)/g;
		while ( ( m = nre.exec( phpNoStr ) ) !== null ) {
			if ( ! okPrefix( m[ 1 ].split( '\\' )[ 0 ] ) ) {
				err( 'prefix', rel, lineOf( phpNoStr, m.index ), `Namespace ${ m[ 1 ] } is not prefixed.` );
			}
		}
		// Constants.
		const dre = /\bdefine\s*\(\s*'([A-Za-z_][\w]*)'/g;
		while ( ( m = dre.exec( php ) ) !== null ) {
			if ( ! okPrefix( m[ 1 ] ) ) {
				err( 'prefix', rel, lineOf( php, m.index ), `Constant ${ m[ 1 ] } is not prefixed.` );
			}
		}
		// Handles, image sizes, options, transients, theme mods, sidebars? (sidebar/menu ids are exempt).
		const hre = /\b(wp_enqueue_script|wp_enqueue_style|wp_register_script|wp_register_style|wp_enqueue_script_module|wp_register_script_module|add_image_size|set_transient|set_site_transient|update_option|add_option|set_theme_mod|register_block_style|register_block_pattern_category|register_block_pattern)\s*\(\s*'([^']+)'/g;
		while ( ( m = hre.exec( php ) ) !== null ) {
			const fn = m[ 1 ];
			const val = m[ 2 ];
			if ( fn === 'register_block_style' ) {
				continue; // first arg is the block name
			}
			if ( ( fn.startsWith( 'wp_enqueue' ) || fn.startsWith( 'wp_register' ) ) ) {
				if ( CORE_HANDLES.has( val ) ) {
					// Enqueue of a core handle with no src is fine; registering it with a src was caught above.
					continue;
				}
				// Third-party library handles are exempt; only flag when the src is inside the theme directory.
				const [ stmt ] = readStatement( php, m.index );
				const themeSrc = /get_(theme_file_uri|template_directory_uri|stylesheet_directory_uri|stylesheet_uri|parent_theme_file_uri)\s*\(/.test( stmt );
				if ( ! okPrefix( val ) && themeSrc ) {
					err( 'prefix', rel, lineOf( php, m.index ), `${ fn }() handle "${ val }" is not prefixed.` );
				} else if ( ! okPrefix( val ) && ! themeSrc && stmt.includes( ',' ) ) {
					info( 'prefix', rel, lineOf( php, m.index ), `${ fn }() handle "${ val }" is not prefixed; fine only if it is a third-party library handle.` );
				}
				continue;
			}
			if ( fn === 'register_block_pattern_category' || fn === 'register_block_pattern' ) {
				if ( ! okPrefix( val ) && ! val.includes( '/' ) ) {
					warn( 'prefix', rel, lineOf( php, m.index ), `${ fn }() slug "${ val }" should be prefixed with the theme slug.` );
				}
				continue;
			}
			if ( ! okPrefix( val ) && ! val.startsWith( '_' ) ) {
				err( 'prefix', rel, lineOf( php, m.index ), `${ fn }() name "${ val }" is not prefixed.` );
			}
		}
		// Hooks fired by the theme.
		const are = /\b(do_action|apply_filters)\s*\(\s*'([^']+)'/g;
		while ( ( m = are.exec( php ) ) !== null ) {
			if ( ! okPrefix( m[ 2 ] ) ) {
				warn( 'prefix', rel, lineOf( php, m.index ), `${ m[ 1 ] }() hook "${ m[ 2 ] }" is not prefixed.` );
			}
		}
		// Global variables at brace depth 0 (template scope).
		{
			let depth = 0;
			const lines = phpNoStr.split( '\n' );
			const coreGlobals = new Set( [ '$wp_customize', '$args', '$content_width', '$post', '$wp_query', '$wpdb', '$wp', '$comment', '$this', '$GLOBALS', '$posts', '$authordata', '$page', '$pages', '$numpages', '$multipage', '$more', '$wp_rewrite', '$wp_version', '$wp_scripts', '$wp_styles', '$currentday', '$previousday', '$id', '$withcomments', '$paged', '$is_IE', '$wp_locale', '$wp_did_header', '$_wp_theme_features', '$hook_suffix', '$pagenow', '$typenow', '$taxnow', '$current_user', '$wp_admin_bar', '$wp_registered_sidebars', '$wp_widget_factory', '$allowedposttags', '$allowedtags' ] );
			for ( let li = 0; li < lines.length; li++ ) {
				const l = lines[ li ];
				if ( depth === 0 ) {
					const vm = /^\s*(\$[A-Za-z_]\w*)\s*(?:\[[^\]]*\])?\s*=(?!=|>)/.exec( l );
					if ( vm && ! coreGlobals.has( vm[ 1 ] ) && ! okPrefix( vm[ 1 ].slice( 1 ) ) ) {
						if ( ! /phpcs:ignore/.test( src.split( /\r?\n/ )[ li ] || '' ) ) {
							warn( 'prefix', rel, li + 1, `Global variable ${ vm[ 1 ] } in template/file scope is not prefixed.` );
						}
					}
				}
				for ( const ch of l ) {
					if ( ch === '{' ) {
						depth++;
					} else if ( ch === '}' ) {
						depth = Math.max( 0, depth - 1 );
					}
				}
			}
		}
	}

	// ---- Hard-coded assets and remote resources.
	{
		const combined = src;
		const re = /<script[^>]+src\s*=|<link[^>]+rel\s*=\s*["']?stylesheet/gi;
		let m;
		while ( ( m = re.exec( combined ) ) !== null ) {
			const line = lineOf( combined, m.index );
			const l = ( src.split( /\r?\n/ )[ line - 1 ] || '' );
			if ( /rel=["']?preload|rel=["']?preconnect|rel=["']?dns-prefetch/i.test( l ) ) {
				continue;
			}
			err( 'assets', rel, line, 'Hard-coded <script>/<link> tag; use wp_enqueue_script()/wp_enqueue_style().' );
		}
		const rm = REMOTE_RESOURCE.exec( src );
		if ( rm ) {
			warn( 'assets', rel, lineOf( src, rm.index ), `Remote resource ${ rm[ 1 ] }: not allowed without user consent (self-host fonts/libraries).` );
		}
		if ( /<title>/i.test( html ) ) {
			err( 'hooks', rel, lineOf( html, html.search( /<title>/i ) ), 'Hard-coded <title>; use add_theme_support( "title-tag" ) and remove it.' );
		}
		if ( /<meta\s+name=["']generator/i.test( html ) ) {
			warn( 'hooks', rel, lineOf( html, html.search( /<meta\s+name=["']generator/i ) ), 'Do not hard-code a generator meta tag.' );
		}
	}

	// ---- Forbidden / deprecated.
	for ( const [ re, sev, msg ] of FORBIDDEN ) {
		const g = new RegExp( re.source, re.flags.includes( 'g' ) ? re.flags : re.flags + 'g' );
		let m;
		// Patterns that look inside string literals must run on the string-preserving version.
		const hay = /['"]|\'|"/.test( re.source ) ? php : phpNoStr;
		while ( ( m = g.exec( hay ) ) !== null ) {
			const line = lineOf( hay, m.index );
			if ( sev === 'error' && hasIgnore( line ) ) {
				continue;
			}
			add( sev, 'forbidden', rel, line, msg );
		}
	}
	{
		const re = new RegExp( '(?<![\\w$>])(' + DEPRECATED.join( '|' ) + ')\\s*\\(', 'g' );
		let m;
		while ( ( m = re.exec( phpNoStr ) ) !== null ) {
			err( 'forbidden', rel, lineOf( phpNoStr, m.index ), `${ m[ 1 ] }() is deprecated.` );
		}
		const bre = /get_bloginfo\s*\(\s*'(url|wpurl|home|siteurl|template_url|template_directory|stylesheet_directory|text_direction)'/g;
		while ( ( m = bre.exec( php ) ) !== null ) {
			warn( 'forbidden', rel, lineOf( php, m.index ), `get_bloginfo( '${ m[ 1 ] }' ) is deprecated; use home_url()/site_url()/get_template_directory_uri()/is_rtl().` );
		}
		if ( /\bwp_title\s*\(/.test( phpNoStr ) && /<title>/.test( html ) ) {
			err( 'forbidden', rel, lineOf( phpNoStr, phpNoStr.search( /\bwp_title\s*\(/ ) ), 'wp_title() inside <title> is deprecated; use title-tag support.' );
		}
	}

	// ---- Plugin territory.
	for ( const [ re, sev, msg ] of PLUGIN_TERRITORY ) {
		const g = new RegExp( re.source, re.flags.includes( 'g' ) ? re.flags : re.flags + 'g' );
		let m;
		const hay = /application|schema|<meta|google|fbq|hotjar|clarity/.test( re.source ) ? src : ( /['"]/.test( re.source ) ? php : phpNoStr );
		while ( ( m = g.exec( hay ) ) !== null ) {
			add( sev, 'territory', rel, lineOf( hay, m.index ), msg );
		}
	}

	// ---- i18n.
	{
		const names = Object.keys( I18N ).sort( ( a, b ) => b.length - a.length ).map( ( n ) => n.replace( /[$]/g, '\\$' ) );
		const re = new RegExp( '(?<![\\w$>])(' + names.join( '|' ) + ')\\s*\\(', 'g' );
		let m;
		while ( ( m = re.exec( php ) ) !== null ) {
			const fn = m[ 1 ];
			const need = I18N[ fn ];
			const open = m.index + m[ 0 ].length - 1;
			// Read balanced args.
			let depth = 0;
			let j = open;
			for ( ; j < php.length; j++ ) {
				if ( php[ j ] === '(' ) {
					depth++;
				} else if ( php[ j ] === ')' ) {
					depth--;
					if ( depth === 0 ) {
						break;
					}
				}
			}
			const inner = php.slice( open + 1, j );
			// Use the no-string version for splitting to avoid commas inside strings.
			const innerNoStr = phpNoStr.slice( open + 1, j );
			const argsNoStr = splitTopLevel( innerNoStr, ',' );
			const line = lineOf( php, m.index );
			if ( argsNoStr.length < need ) {
				err( 'i18n', rel, line, `${ fn }() is missing its text domain argument.` );
				continue;
			}
			// Map back the domain arg using offsets.
			let offset = 0;
			const argsRaw = [];
			for ( const a of argsNoStr ) {
				argsRaw.push( inner.slice( offset, offset + a.length ) );
				offset += a.length + 1;
			}
			const domainRaw = argsRaw[ need - 1 ].trim();
			const dm = /^'([^']*)'$|^"([^"]*)"$/.exec( domainRaw );
			if ( ! dm ) {
				err( 'i18n', rel, line, `${ fn }() text domain must be a literal string, got: ${ domainRaw.slice( 0, 40 ) }` );
			} else {
				const d = dm[ 1 ] !== undefined ? dm[ 1 ] : dm[ 2 ];
				ctx.domainsSeen.add( d );
				if ( ctx.textDomain && d !== ctx.textDomain ) {
					err( 'i18n', rel, line, `Text domain "${ d }" does not match style.css Text Domain "${ ctx.textDomain }".` );
				}
			}
			// Placeholders need a translators comment.
			const firstRaw = argsRaw[ 0 ].trim();
			if ( /%(\d+\$)?[sdufbcoxXeEgG]/.test( firstRaw ) && /^['"]/.test( firstRaw ) ) {
				const upto = src.slice( 0, src.split( /\r?\n/ ).slice( 0, line ).join( '\n' ).length );
				const prev = upto.split( /\r?\n/ ).slice( -6 ).join( '\n' );
				if ( ! /translators:/i.test( prev ) ) {
					warn( 'i18n', rel, line, `${ fn }() string has placeholders but no "translators:" comment above it.` );
				}
			}
			if ( ! /^['"]/.test( firstRaw ) ) {
				err( 'i18n', rel, line, `${ fn }() first argument must be a literal string (no variables/concatenation).` );
			}
		}
	}

	// ---- Customizer settings without sanitize_callback.
	{
		const re = /->add_setting\s*\(/g;
		let m;
		while ( ( m = re.exec( phpNoStr ) ) !== null ) {
			let depth = 0;
			let j = m.index + m[ 0 ].length - 1;
			for ( ; j < phpNoStr.length; j++ ) {
				if ( phpNoStr[ j ] === '(' ) {
					depth++;
				} else if ( phpNoStr[ j ] === ')' ) {
					depth--;
					if ( depth === 0 ) {
						break;
					}
				}
			}
			const call = php.slice( m.index, j + 1 );
			if ( ! /sanitize_callback/.test( call ) ) {
				err( 'customizer', rel, lineOf( phpNoStr, m.index ), 'Customizer add_setting() without sanitize_callback.' );
			}
		}
	}

	// ---- Database.
	{
		const re = /\$wpdb\s*->\s*(get_results|get_var|get_row|get_col|query)\s*\(/g;
		let m;
		while ( ( m = re.exec( phpNoStr ) ) !== null ) {
			const [ stmt ] = readStatement( phpNoStr, m.index );
			const stmtRaw = php.slice( m.index, m.index + stmt.length );
			const line = lineOf( phpNoStr, m.index );
			if ( /->\s*prepare\s*\(/.test( stmt ) ) {
				continue;
			}
			if ( /\$(?!wpdb\b)/.test( stmtRaw ) || /\{\$/.test( stmtRaw ) ) {
				err( 'database', rel, line, `$wpdb->${ m[ 1 ] }() with variables but no $wpdb->prepare().` );
			} else {
				info( 'database', rel, line, `$wpdb->${ m[ 1 ] }() without prepare(); acceptable only for fully static SQL. Prefer WP_Query/get_posts.` );
			}
		}
	}

	// ---- ABSPATH guard for includes.
	if ( /^inc\//.test( rel ) || /^includes\//.test( rel ) || /^lib\//.test( rel ) || rel === 'functions.php' ) {
		if ( ! /ABSPATH/.test( php ) ) {
			info( 'structure', rel, 1, 'No ABSPATH guard (defined( "ABSPATH" ) || exit;).' );
		}
	}

	// ---- Collect for whole-theme checks.
	ctx.allPhp += '\n' + php;
	ctx.allHtml += '\n' + html;
	ctx.allSrc += '\n' + src;

	// ---- Block markup inside patterns.
	if ( /^patterns\//.test( rel ) ) {
		checkBlockMarkup( rel, src, ctx, true );
		const head = /\/\*\*([\s\S]*?)\*\//.exec( src );
		if ( ! head || ! /Title:\s*\S/.test( head[ 1 ] ) || ! /Slug:\s*\S/.test( head[ 1 ] ) ) {
			err( 'block', rel, 1, 'Pattern file needs a header comment with at least Title: and Slug:.' );
		} else {
			const slug = /Slug:\s*(\S+)/.exec( head[ 1 ] )[ 1 ];
			if ( ctx.textDomain && ! slug.startsWith( ctx.textDomain + '/' ) ) {
				warn( 'block', rel, 1, `Pattern slug "${ slug }" should be "${ ctx.textDomain }/name".` );
			}
		}
	}
}

// ---------------------------------------------------------------- block markup

function checkBlockMarkup( rel, src, ctx, isPattern ) {
	// Remove PHP for delimiter analysis.
	const text = isPattern ? lexPhp( src ).html : src;
	const re = /<!--\s*(\/)?wp:([a-z][a-z0-9-]*\/)?([a-z][a-z0-9-]*)\s*(\{[\s\S]*?\})?\s*(\/)?-->/g;
	const stack = [];
	let m;
	let sawBlock = false;
	while ( ( m = re.exec( text ) ) !== null ) {
		sawBlock = true;
		const closing = !! m[ 1 ];
		const name = ( m[ 2 ] || 'core/' ) + m[ 3 ];
		const attrs = m[ 4 ];
		const selfClosing = !! m[ 5 ];
		const line = lineOf( text, m.index );
		if ( attrs ) {
			try {
				JSON.parse( attrs );
			} catch ( e ) {
				err( 'block', rel, line, `Invalid JSON in block attributes for ${ name }: ${ e.message }` );
			}
		}
		if ( closing ) {
			const top = stack.pop();
			if ( ! top ) {
				err( 'block', rel, line, `Closing delimiter for ${ name } without an opening one.` );
			} else if ( top.name !== name ) {
				err( 'block', rel, line, `Closing delimiter ${ name } does not match open block ${ top.name } (line ${ top.line }).` );
			}
		} else if ( ! selfClosing ) {
			stack.push( { name, line } );
		}
	}
	for ( const s of stack ) {
		err( 'block', rel, s.line, `Block ${ s.name } is never closed.` );
	}
	if ( ! isPattern && ! sawBlock ) {
		warn( 'block', rel, 1, 'No block delimiters found in a block template file.' );
	}
	// Text outside any block at root level (templates only).
	if ( ! isPattern ) {
		let depth = 0;
		let idx = 0;
		const re2 = /<!--\s*(\/)?wp:[^>]*?(\/)?-->/g;
		let mm;
		let lastEnd = 0;
		while ( ( mm = re2.exec( text ) ) !== null ) {
			if ( depth === 0 ) {
				const between = text.slice( lastEnd, mm.index );
				if ( between.trim() !== '' ) {
					warn( 'block', rel, lineOf( text, lastEnd ), 'Content outside of any block at the template root will be dropped by the editor.' );
				}
			}
			if ( mm[ 1 ] ) {
				depth = Math.max( 0, depth - 1 );
			} else if ( ! mm[ 2 ] ) {
				depth++;
			}
			lastEnd = mm.index + mm[ 0 ].length;
			idx = lastEnd;
		}
		void idx;
	}
}

// ---------------------------------------------------------------- whole-theme checks

function auditTheme( dir, opts ) {
	const files = walk( dir );
	const has = ( rel ) => files.some( ( f ) => f.rel === rel );
	const list = files.filter( ( f ) => ! f.dir );

	const isBlock = has( 'templates/index.html' );
	const isClassic = has( 'index.php' );
	const type = opts.type || ( isBlock ? 'block' : isClassic ? ( has( 'theme.json' ) && ( has( 'patterns' ) || has( 'parts' ) ) ? 'hybrid' : 'classic' ) : 'unknown' );

	const ctx = {
		prefixes: [],
		textDomain: opts.textdomain || null,
		domainsSeen: new Set(),
		allPhp: '',
		allHtml: '',
		allSrc: '',
	};

	// ---- style.css
	let headers = {};
	if ( ! has( 'style.css' ) ) {
		err( 'structure', 'style.css', 1, 'style.css is missing.' );
	} else {
		headers = parseStyleHeaders( fs.readFileSync( path.join( dir, 'style.css' ), 'utf8' ) );
		const required = [ 'Theme Name', 'Author', 'Description', 'Version', 'Requires at least', 'Tested up to', 'Requires PHP', 'License', 'License URI', 'Text Domain' ];
		for ( const h of required ) {
			if ( ! headers[ h ] ) {
				err( 'structure', 'style.css', 1, `Missing required header "${ h }".` );
			}
		}
		if ( headers.Version && ! /^\d+\.\d+(\.\d+)?$/.test( headers.Version ) ) {
			warn( 'structure', 'style.css', 1, `Version "${ headers.Version }" should be X.X or X.X.X.` );
		}
		if ( headers[ 'Tested up to' ] && ! /^\d+\.\d+$/.test( headers[ 'Tested up to' ] ) ) {
			warn( 'structure', 'style.css', 1, 'Tested up to should be a major.minor version number only.' );
		}
		if ( headers[ 'Requires PHP' ] && ! /^\d+\.\d+$/.test( headers[ 'Requires PHP' ] ) ) {
			warn( 'structure', 'style.css', 1, 'Requires PHP should be a number like 7.4.' );
		}
		if ( headers[ 'Theme Name' ] && /\b(wordpress|theme|twenty)\b/i.test( headers[ 'Theme Name' ] ) ) {
			err( 'structure', 'style.css', 1, 'Theme Name must not contain "WordPress", "Theme" or "Twenty".' );
		}
		if ( headers[ 'Text Domain' ] ) {
			ctx.textDomain = ctx.textDomain || headers[ 'Text Domain' ];
			const folder = path.basename( path.resolve( dir ) );
			if ( headers[ 'Text Domain' ] !== folder ) {
				warn( 'structure', 'style.css', 1, `Text Domain "${ headers[ 'Text Domain' ] }" differs from folder name "${ folder }".` );
			}
		}
		if ( headers.Template && ! headers.Template.match( /^[a-z0-9-]+$/ ) ) {
			warn( 'structure', 'style.css', 1, 'Template header (child theme) should be the parent folder slug.' );
		}
	}

	// ---- prefixes
	if ( opts.prefix ) {
		ctx.prefixes = String( opts.prefix ).split( ',' ).map( ( s ) => s.trim() ).filter( Boolean );
	} else {
		const xml = [ '.phpcs.xml.dist', 'phpcs.xml.dist', '.phpcs.xml', 'phpcs.xml' ].map( ( f ) => path.join( dir, f ) ).find( ( f ) => fs.existsSync( f ) );
		if ( xml ) {
			const x = fs.readFileSync( xml, 'utf8' );
			const m = /name="prefixes"[\s\S]*?<\/property>/.exec( x );
			if ( m ) {
				ctx.prefixes = [ ...m[ 0 ].matchAll( /value="([^"]+)"/g ) ].map( ( mm ) => mm[ 1 ] );
			}
		}
		if ( ! ctx.prefixes.length && ctx.textDomain ) {
			ctx.prefixes = [ ctx.textDomain.replace( /-/g, '_' ), ctx.textDomain.replace( /[^a-z0-9]/g, '' ) ];
			// Try to detect the actual prefix from function names.
			const fn = has( 'functions.php' ) ? fs.readFileSync( path.join( dir, 'functions.php' ), 'utf8' ) : '';
			const counts = {};
			for ( const mm of fn.matchAll( /function\s+([a-z][a-z0-9]{2,})_/g ) ) {
				counts[ mm[ 1 ] ] = ( counts[ mm[ 1 ] ] || 0 ) + 1;
			}
			const best = Object.entries( counts ).sort( ( a, b ) => b[ 1 ] - a[ 1 ] )[ 0 ];
			if ( best && best[ 0 ].length >= 3 ) {
				ctx.prefixes.unshift( best[ 0 ] );
			}
		}
		ctx.prefixes = [ ...new Set( ctx.prefixes ) ];
	}
	if ( ctx.prefixes.some( ( p ) => p.replace( /[^a-z0-9]/gi, '' ).length < 4 ) ) {
		warn( 'prefix', 'style.css', 1, `Prefix(es) ${ ctx.prefixes.join( ', ' ) }: Theme Review requires at least four characters.` );
	}

	// ---- required / recommended files
	if ( ! isBlock && ! isClassic ) {
		err( 'structure', '.', 1, 'Neither templates/index.html (block) nor index.php (classic) found; not a valid theme.' );
	}
	if ( ! has( 'readme.txt' ) && ! has( 'README.txt' ) ) {
		warn( 'structure', 'readme.txt', 1, 'readme.txt is missing (required for wp.org; recommended for clients).' );
	}
	const shot = [ 'screenshot.png', 'screenshot.jpg', 'screenshot.jpeg' ].find( ( s ) => has( s ) );
	if ( ! shot ) {
		warn( 'structure', 'screenshot.png', 1, 'screenshot.png is missing (1200x900 recommended).' );
	} else {
		const dim = pngDimensions( fs.readFileSync( path.join( dir, shot ) ) );
		if ( dim ) {
			if ( dim.w > 1200 || dim.h > 900 || Math.abs( dim.w / dim.h - 4 / 3 ) > 0.02 ) {
				warn( 'structure', shot, 1, `Screenshot is ${ dim.w }x${ dim.h }; should be 1200x900 (4:3).` );
			}
		}
	}
	if ( isBlock && ! has( 'theme.json' ) ) {
		err( 'block', 'theme.json', 1, 'Block theme without theme.json.' );
	}
	if ( has( 'theme.json' ) ) {
		try {
			const tj = JSON.parse( fs.readFileSync( path.join( dir, 'theme.json' ), 'utf8' ) );
			if ( tj.version !== 3 ) {
				( tj.version === 2 ? warn : err )( 'block', 'theme.json', 1, `theme.json version is ${ tj.version }; use version 3 (WP 6.6+).` );
			}
			if ( ! tj.$schema ) {
				info( 'block', 'theme.json', 1, 'Add "$schema": "https://schemas.wp.org/trunk/theme.json" for validation/autocomplete.' );
			}
			if ( isBlock ) {
				const parts = list.filter( ( f ) => /^parts\/[^/]+\.html$/.test( f.rel ) ).map( ( f ) => path.basename( f.rel, '.html' ) );
				const declared = new Set( ( tj.templateParts || [] ).map( ( p ) => p.name ) );
				for ( const p of parts ) {
					if ( ! declared.has( p ) ) {
						warn( 'block', `parts/${ p }.html`, 1, `Template part "${ p }" is not declared in theme.json templateParts (no area/landmark).` );
					}
				}
				for ( const ct of tj.customTemplates || [] ) {
					if ( ! has( `templates/${ ct.name }.html` ) ) {
						err( 'block', 'theme.json', 1, `customTemplates entry "${ ct.name }" has no templates/${ ct.name }.html.` );
					}
				}
			}
			const pal = ( ( tj.settings || {} ).color || {} ).palette || [];
			for ( const c of pal ) {
				if ( c.slug && ! /^[a-z0-9-]+$/.test( c.slug ) ) {
					warn( 'block', 'theme.json', 1, `Palette slug "${ c.slug }" should be lowercase-hyphen.` );
				}
			}
		} catch ( e ) {
			err( 'block', 'theme.json', 1, `theme.json is not valid JSON: ${ e.message }` );
		}
	}
	for ( const f of list.filter( ( x ) => /^styles\/.*\.json$/.test( x.rel ) ) ) {
		try {
			const v = JSON.parse( fs.readFileSync( path.join( dir, f.rel ), 'utf8' ) );
			if ( v.version !== 3 ) {
				warn( 'block', f.rel, 1, 'Style variation should use version 3.' );
			}
			if ( ! v.title && ! /\/(blocks|sections)\//.test( f.rel ) ) {
				warn( 'block', f.rel, 1, 'Style variation has no "title".' );
			}
		} catch ( e ) {
			err( 'block', f.rel, 1, `Invalid JSON: ${ e.message }` );
		}
	}

	// ---- forbidden files
	const badNames = /^(thumbs\.db|desktop\.ini|\.ds_store|error_log|php\.ini|web\.config|dwsync\.xml|\.htaccess|composer\.lock|package-lock\.json|yarn\.lock)$/i;
	const badExt = /\.(zip|rar|7z|tar|gz|sql|log|dat|wie|lubith|psd|ai|sketch|fig|bak|orig|swp|tmp)$/i;
	const badDirs = /^(\.git|\.svn|\.hg|\.bzr|node_modules|__MACOSX|\.idea|\.vscode|\.vs|vendor)(\/|$)/;
	for ( const f of files ) {
		const base = path.basename( f.rel );
		if ( f.dir && badDirs.test( f.rel ) ) {
			( /^(node_modules|vendor|\.git)/.test( f.rel ) ? warn : err )( 'structure', f.rel, 1, `Directory "${ f.rel }" must not ship in the theme zip (exclude via .gitattributes export-ignore).` );
			continue;
		}
		if ( f.dir ) {
			continue;
		}
		if ( badDirs.test( f.rel ) ) {
			continue;
		}
		if ( badNames.test( base ) ) {
			( /lock/.test( base ) ? info : err )( 'structure', f.rel, 1, `File "${ base }" must not ship in the theme.` );
		} else if ( badExt.test( base ) ) {
			err( 'structure', f.rel, 1, `File type of "${ base }" is not allowed in a theme.` );
		} else if ( base.startsWith( '.' ) && ! /^\.(phpcs\.xml(\.dist)?|editorconfig|gitignore|gitattributes|wp-env\.json|nvmrc|prettierrc|stylelintrc|eslintrc(\.js|\.json)?|distignore)$/.test( base ) ) {
			warn( 'structure', f.rel, 1, `Hidden file "${ base }" should not ship in the theme.` );
		} else if ( /^favicon\.(ico|png)$/i.test( base ) ) {
			err( 'structure', f.rel, 1, 'Favicons are set via the Site Icon setting, not shipped in the theme.' );
		} else if ( /\.min\.(js|css)$/.test( base ) ) {
			const unmin = f.rel.replace( /\.min\.(js|css)$/, '.$1' );
			if ( ! has( unmin ) && ! list.some( ( x ) => x.rel.startsWith( 'assets/src' ) || x.rel.startsWith( 'src/' ) ) ) {
				warn( 'structure', f.rel, 1, `Minified file without its source (${ path.basename( unmin ) } or a src/ folder).` );
			}
		} else if ( /\.xml$/i.test( base ) && ! /^(wpml-config|loco|phpcs)\.xml$/.test( base ) ) {
			err( 'structure', f.rel, 1, 'Only wpml-config.xml, loco.xml and phpcs.xml are allowed XML files.' );
		}
		if ( f.size > 2 * 1024 * 1024 && ! /\.(woff2?|ttf|otf)$/i.test( base ) ) {
			warn( 'structure', f.rel, 1, `Large file (${ ( f.size / 1024 / 1024 ).toFixed( 1 ) } MB); optimise or remove.` );
		}
	}
	if ( has( '.git' ) && ! files.some( ( f ) => f.rel === '.gitattributes' ) ) {
		info( 'structure', '.gitattributes', 1, 'Add a .gitattributes with export-ignore entries so release zips exclude dev files.' );
	}

	// ---- per-file
	for ( const f of list ) {
		if ( badDirs.test( f.rel ) ) {
			continue;
		}
		const full = path.join( dir, f.rel );
		if ( /\.php$/i.test( f.rel ) ) {
			auditPhpFile( f.rel, fs.readFileSync( full, 'utf8' ), ctx );
		} else if ( /^(templates|parts)\/.*\.html$/.test( f.rel ) ) {
			const s = fs.readFileSync( full, 'utf8' );
			checkBlockMarkup( f.rel, s, ctx, false );
			if ( /<script|<link[^>]+stylesheet/i.test( s ) ) {
				err( 'assets', f.rel, lineOf( s, s.search( /<script|<link/i ) ), 'Hard-coded script/style tag in a block template.' );
			}
			ctx.allHtml += '\n' + s;
		} else if ( /\.(js|css|html)$/i.test( f.rel ) ) {
			const s = fs.readFileSync( full, 'utf8' );
			const rm = REMOTE_RESOURCE.exec( s );
			if ( rm && ! /\.min\./.test( f.rel ) ) {
				warn( 'assets', f.rel, lineOf( s, rm.index ), `Remote resource ${ rm[ 1 ] }; self-host instead.` );
			}
			if ( /\.js$/.test( f.rel ) && ! /\.min\.js$/.test( f.rel ) ) {
				const dm = /\b(console\.(log|debug|info)|debugger\b|alert\s*\()/.exec( s );
				if ( dm ) {
					warn( 'debug', f.rel, lineOf( s, dm.index ), `Debug statement "${ dm[ 1 ] }" in shipped JS.` );
				}
				if ( /(^|\W)\$\s*\(/.test( s ) && ! /jQuery/.test( s ) ) {
					warn( 'assets', f.rel, 1, 'Uses $() without a jQuery no-conflict wrapper; wrap in ( function( $ ) { ... } )( jQuery ) or use vanilla JS.' );
				}
			}
			if ( /\.css$/.test( f.rel ) ) {
				const om = /:focus[^{]*\{[^}]*outline\s*:\s*(none|0)\s*[;}]/.exec( s );
				if ( om && ! /:focus-visible|:focus[^{]*\{[^}]*(box-shadow|outline\s*:\s*[^0n])/.test( s ) ) {
					warn( 'a11y', f.rel, lineOf( s, om.index ), 'outline: none on :focus without a visible replacement (accessibility failure).' );
				}
				const im = /@import\s+url\(\s*['"]?https?:/.exec( s );
				if ( im ) {
					warn( 'assets', f.rel, lineOf( s, im.index ), '@import of a remote stylesheet; self-host and enqueue instead.' );
				}
			}
		}
	}

	// ---- classic required hooks
	if ( isClassic && ! isBlock ) {
		const all = ctx.allPhp;
		const html = ctx.allHtml;
		const need = [
			[ /\bwp_head\s*\(/, 'wp_head() is missing (must be before </head>).' ],
			[ /\bwp_footer\s*\(/, 'wp_footer() is missing (must be before </body>).' ],
			[ /\bwp_body_open\s*\(/, 'wp_body_open() is missing (must be right after <body>).' ],
			[ /\bbody_class\s*\(/, 'body_class() is missing on the <body> tag.' ],
			[ /\bpost_class\s*\(/, 'post_class() is missing on post wrappers.' ],
			[ /\blanguage_attributes\s*\(/, 'language_attributes() is missing on the <html> tag.' ],
			[ /add_theme_support\s*\(\s*'title-tag'/, "add_theme_support( 'title-tag' ) is missing." ],
			[ /add_theme_support\s*\(\s*'automatic-feed-links'/, "add_theme_support( 'automatic-feed-links' ) is missing." ],
			[ /\bwp_link_pages\s*\(/, 'wp_link_pages() is missing after the_content() (paginated posts).' ],
			[ /\bcomments_template\s*\(/, 'comments_template() is not called anywhere.' ],
			[ /\bcomment_form\s*\(/, 'comment_form() is not called anywhere (comments.php).' ],
			[ /\bwp_list_comments\s*\(/, 'wp_list_comments() is not called anywhere (comments.php).' ],
			[ /\bget_search_form\s*\(|\bthe_widget\s*\(\s*'WP_Widget_Search'/, 'get_search_form() is not used (search.php / 404.php should offer search).' ],
		];
		for ( const [ re, msg ] of need ) {
			if ( ! re.test( all ) ) {
				( /comments|search|link_pages/.test( msg ) ? warn : err )( 'hooks', 'functions.php', 1, msg );
			}
		}
		if ( ! /<!DOCTYPE html>/i.test( html ) ) {
			err( 'hooks', 'header.php', 1, 'Missing <!DOCTYPE html>.' );
		}
		if ( ! /<meta\s+charset=/i.test( html ) ) {
			warn( 'hooks', 'header.php', 1, 'Missing <meta charset="<?php bloginfo( "charset" ); ?>">.' );
		}
		if ( ! /<meta\s+name=["']viewport["']/i.test( html ) ) {
			warn( 'hooks', 'header.php', 1, 'Missing viewport meta tag.' );
		}
		if ( ! /<main\b/i.test( html ) ) {
			warn( 'a11y', 'index.php', 1, 'No <main> landmark found.' );
		}
		if ( ! /skip-link|skip to content/i.test( ctx.allSrc ) ) {
			err( 'a11y', 'header.php', 1, 'No skip link found; classic themes must add one as the first focusable element.' );
		}
		if ( /\b(include|require)(_once)?\s*\(?\s*(get_template_directory|get_stylesheet_directory|__DIR__|dirname\s*\(\s*__FILE__\s*\))[^;]*\/(header|footer|sidebar|content[^;]*|template-parts)[^;]*\.php/.test( all ) ) {
			err( 'hooks', 'index.php', 1, 'Template files are included with include/require; use get_header()/get_footer()/get_template_part().' );
		}
		if ( ! /\bregister_nav_menus?\s*\(/.test( all ) ) {
			info( 'hooks', 'functions.php', 1, 'No navigation menu registered (register_nav_menus).' );
		}
		if ( /\bwp_nav_menu\s*\(/.test( all ) && ! /'fallback_cb'\s*=>\s*(false|'__return_false'|'__return_empty_string')/.test( all ) ) {
			info( 'hooks', 'header.php', 1, 'wp_nav_menu() without fallback_cb => false lists all pages when no menu is assigned.' );
		}
		if ( /\bcomment-reply\b/.test( all ) && ! /is_singular\s*\(\s*\)\s*&&\s*comments_open/.test( all ) ) {
			info( 'assets', 'functions.php', 1, 'comment-reply should be enqueued only when is_singular() && comments_open() && thread_comments.' );
		}
	}

	if ( isBlock ) {
		if ( ! /\bwp_enqueue_style\s*\(/.test( ctx.allPhp ) && fs.readFileSync( path.join( dir, 'style.css' ), 'utf8' ).replace( /\/\*[\s\S]*?\*\//, '' ).trim() !== '' ) {
			warn( 'assets', 'functions.php', 1, 'style.css contains CSS but the theme never enqueues it (block themes must enqueue style.css explicitly).' );
		}
		if ( /\bregister_nav_menus?\s*\(|\bregister_sidebar\s*\(/.test( ctx.allPhp ) ) {
			info( 'block', 'functions.php', 1, 'Nav menus / widget areas are registered in a block theme; usually unnecessary (Navigation block, template parts).' );
		}
	}

	// ---- i18n summary
	if ( ctx.domainsSeen.size > 2 ) {
		warn( 'i18n', 'style.css', 1, `More than two text domains used: ${ [ ...ctx.domainsSeen ].join( ', ' ) }.` );
	}
	if ( ( isClassic || isBlock ) && ! list.some( ( f ) => /^languages\/.*\.pot$/.test( f.rel ) ) ) {
		info( 'i18n', 'languages/', 1, 'No .pot file in languages/; generate with `wp i18n make-pot . languages/<slug>.pot`.' );
	}

	return { type, headers, ctx };
}

// ---------------------------------------------------------------- output

function main() {
	const args = parseArgs( process.argv.slice( 2 ) );
	const target = args._[ 0 ];
	if ( ! target || args.help ) {
		console.log( fs.readFileSync( __filename, 'utf8' ).split( '*/' )[ 0 ].replace( /^\/\*\*|^ \* ?/gm, '' ) );
		process.exit( target ? 0 : 1 );
	}
	const dir = path.resolve( target );
	if ( ! fs.existsSync( dir ) || ! fs.statSync( dir ).isDirectory() ) {
		console.error( `Not a directory: ${ dir }` );
		process.exit( 1 );
	}

	const result = auditTheme( dir, { prefix: args.prefix, textdomain: args.textdomain, type: args.type } );

	const order = { error: 0, warning: 1, info: 2 };
	findings.sort( ( a, b ) => a.file.localeCompare( b.file ) || a.line - b.line || order[ a.severity ] - order[ b.severity ] );
	const counts = { error: 0, warning: 0, info: 0 };
	findings.forEach( ( f ) => counts[ f.severity ]++ );

	if ( args.json ) {
		console.log( JSON.stringify( { dir, type: result.type, name: result.headers[ 'Theme Name' ] || null, textDomain: result.ctx.textDomain, prefixes: result.ctx.prefixes, counts, findings }, null, 2 ) );
		process.exit( counts.error ? 1 : 0 );
	}

	console.log( `\nTheme audit: ${ result.headers[ 'Theme Name' ] || path.basename( dir ) }  (${ result.type } theme)` );
	console.log( `Text domain: ${ result.ctx.textDomain || 'unknown' }   Prefixes: ${ result.ctx.prefixes.join( ', ' ) || 'none detected (pass --prefix)' }` );
	console.log( 'Heuristic audit; also run PHPCS (WordPress standard) and the Theme Check plugin.\n' );

	let currentFile = null;
	for ( const f of findings ) {
		if ( args.quiet && f.severity === 'info' ) {
			continue;
		}
		if ( f.file !== currentFile ) {
			currentFile = f.file;
			console.log( f.file );
		}
		const tag = f.severity === 'error' ? 'ERROR  ' : f.severity === 'warning' ? 'WARNING' : 'INFO   ';
		console.log( `  ${ String( f.line ).padStart( 4 ) }  ${ tag }  [${ f.rule }] ${ f.message }` );
	}

	console.log( `\n${ counts.error } error(s), ${ counts.warning } warning(s), ${ counts.info } info.` );
	console.log( counts.error ? 'FAIL: fix all errors before shipping.\n' : 'PASS (no errors). Review warnings.\n' );
	process.exit( counts.error ? 1 : 0 );
}

main();
