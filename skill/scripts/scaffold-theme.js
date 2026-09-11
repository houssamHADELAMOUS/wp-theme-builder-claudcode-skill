#!/usr/bin/env node
/**
 * scaffold-theme.js
 *
 * Generate a WordPress theme skeleton (block, classic, or hybrid) from the
 * templates in ../assets/templates, replacing {{TOKENS}} in file names and
 * contents. Optionally adds the companion plugin and dev configs.
 *
 * Zero dependencies. Node 18+.
 *
 * Usage:
 *   node scaffold-theme.js --type block --slug my-theme --name "My Theme" --prefix mytm --out ./wp-content/themes/my-theme
 *
 * Options:
 *   --type         block | classic | hybrid                (required)
 *   --slug         folder + text domain, lowercase-hyphen   (required)
 *   --name         human name                               (default: from slug)
 *   --prefix       function/handle prefix, >= 4 chars       (default: from slug, letters only)
 *   --out          target directory                         (default: ./<slug>)
 *   --author       author name                              (default: "Author")
 *   --author-uri   author URL                               (default: https://example.com)
 *   --theme-uri    theme URL                                (default: author-uri + /slug)
 *   --description  one sentence                             (default: generic)
 *   --wp-min       "Requires at least"                      (default: 6.7)
 *   --php-min      "Requires PHP"                           (default: 7.4)
 *   --vendor       composer vendor name                     (default: prefix)
 *   --with-plugin  also create ../<slug>-core companion plugin next to the theme
 *   --plugin-out   companion plugin directory               (default: <out>/../<slug>-core)
 *   --no-configs   skip .phpcs.xml.dist, composer.json, package.json, .wp-env.json, etc.
 *   --force        allow a non-empty output directory (files are overwritten)
 *   --dry-run      print what would be written
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const zlib = require( 'zlib' );

const SKILL_DIR = path.resolve( __dirname, '..' );
const TEMPLATES = path.join( SKILL_DIR, 'assets', 'templates' );
const CONFIGS = path.join( SKILL_DIR, 'assets', 'configs' );
const PLUGIN_TPL = path.join( SKILL_DIR, 'assets', 'companion-plugin' );

// ---------------------------------------------------------------- arg parsing

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

function fail( msg ) {
	console.error( `\nError: ${ msg }\n` );
	process.exit( 1 );
}

function usage() {
	console.log( fs.readFileSync( __filename, 'utf8' ).split( '*/' )[ 0 ].replace( /^\/\*\*|^ \* ?/gm, '' ) );
	process.exit( 0 );
}

// ---------------------------------------------------------------- helpers

function titleCase( slug ) {
	return slug
		.split( /[-_\s]+/ )
		.filter( Boolean )
		.map( ( w ) => w.charAt( 0 ).toUpperCase() + w.slice( 1 ) )
		.join( ' ' );
}

function packageName( name ) {
	return name
		.replace( /[^A-Za-z0-9\s_-]/g, '' )
		.split( /[\s_-]+/ )
		.filter( Boolean )
		.map( ( w ) => w.charAt( 0 ).toUpperCase() + w.slice( 1 ) )
		.join( '_' );
}

function defaultPrefix( slug ) {
	const letters = slug.replace( /[^a-z0-9]/g, '' );
	return letters.length >= 4 ? letters.slice( 0, 6 ) : ( letters + 'theme' ).slice( 0, 6 );
}

function walk( dir, base = dir, out = [] ) {
	for ( const entry of fs.readdirSync( dir, { withFileTypes: true } ) ) {
		const full = path.join( dir, entry.name );
		if ( entry.isDirectory() ) {
			walk( full, base, out );
		} else {
			out.push( path.relative( base, full ) );
		}
	}
	return out;
}

function replaceTokens( str, tokens ) {
	return str.replace( /\{\{([A-Z_]+)\}\}/g, ( m, key ) => ( key in tokens ? tokens[ key ] : m ) );
}

function isDirEmpty( dir ) {
	if ( ! fs.existsSync( dir ) ) {
		return true;
	}
	return fs.readdirSync( dir ).length === 0;
}

/**
 * Copy a template tree into dest, replacing tokens in paths and text content.
 */
function copyTree( srcDir, destDir, tokens, opts, skip = [] ) {
	const written = [];
	for ( const rel of walk( srcDir ) ) {
		if ( skip.includes( path.basename( rel ) ) ) {
			continue;
		}
		const destRel = replaceTokens( rel, tokens );
		const src = path.join( srcDir, rel );
		const dest = path.join( destDir, destRel );
		const buf = fs.readFileSync( src );
		const isText = ! /\.(png|jpe?g|gif|webp|woff2?|ttf|otf|ico)$/i.test( rel );
		const outBuf = isText ? Buffer.from( replaceTokens( buf.toString( 'utf8' ), tokens ), 'utf8' ) : buf;
		written.push( destRel );
		if ( opts.dryRun ) {
			continue;
		}
		fs.mkdirSync( path.dirname( dest ), { recursive: true } );
		fs.writeFileSync( dest, outBuf );
	}
	return written;
}

// ---------------------------------------------------------------- PNG placeholder

function crc32( buf ) {
	let c;
	const table = crc32.table || ( crc32.table = ( () => {
		const t = new Uint32Array( 256 );
		for ( let n = 0; n < 256; n++ ) {
			c = n;
			for ( let k = 0; k < 8; k++ ) {
				c = c & 1 ? 0xedb88320 ^ ( c >>> 1 ) : c >>> 1;
			}
			t[ n ] = c >>> 0;
		}
		return t;
	} )() );
	let crc = 0xffffffff;
	for ( let i = 0; i < buf.length; i++ ) {
		crc = table[ ( crc ^ buf[ i ] ) & 0xff ] ^ ( crc >>> 8 );
	}
	return ( crc ^ 0xffffffff ) >>> 0;
}

function pngChunk( type, data ) {
	const len = Buffer.alloc( 4 );
	len.writeUInt32BE( data.length, 0 );
	const typeBuf = Buffer.from( type, 'ascii' );
	const crc = Buffer.alloc( 4 );
	crc.writeUInt32BE( crc32( Buffer.concat( [ typeBuf, data ] ) ), 0 );
	return Buffer.concat( [ len, typeBuf, data, crc ] );
}

/**
 * Build a 1200x900 placeholder screenshot: light background, a "header" band,
 * a "hero" block and three "cards". Enough to look like a theme in the admin.
 */
function makeScreenshotPng( width = 1200, height = 900 ) {
	const base = [ 0xf2, 0xf4, 0xf7 ];
	const header = [ 0xff, 0xff, 0xff ];
	const hero = [ 0x0b, 0x57, 0xd0 ];
	const card = [ 0xff, 0xff, 0xff ];
	const rows = [];
	for ( let y = 0; y < height; y++ ) {
		const row = Buffer.alloc( 1 + width * 3 );
		row[ 0 ] = 0; // filter: none
		for ( let x = 0; x < width; x++ ) {
			let px = base;
			if ( y < 80 ) {
				px = header;
			} else if ( y >= 120 && y < 420 && x >= 80 && x < width - 80 ) {
				px = hero;
			} else if ( y >= 480 && y < 780 ) {
				const col = Math.floor( ( x - 80 ) / ( ( width - 160 ) / 3 ) );
				const inCol = x >= 80 && x < width - 80 && ( ( x - 80 ) % ( ( width - 160 ) / 3 ) ) > 20;
				if ( inCol && col >= 0 && col < 3 ) {
					px = card;
				}
			}
			row[ 1 + x * 3 ] = px[ 0 ];
			row[ 2 + x * 3 ] = px[ 1 ];
			row[ 3 + x * 3 ] = px[ 2 ];
		}
		rows.push( row );
	}
	const ihdr = Buffer.alloc( 13 );
	ihdr.writeUInt32BE( width, 0 );
	ihdr.writeUInt32BE( height, 4 );
	ihdr[ 8 ] = 8; // bit depth
	ihdr[ 9 ] = 2; // colour type RGB
	ihdr[ 10 ] = 0;
	ihdr[ 11 ] = 0;
	ihdr[ 12 ] = 0;
	const idat = zlib.deflateSync( Buffer.concat( rows ), { level: 9 } );
	return Buffer.concat( [
		Buffer.from( [ 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a ] ),
		pngChunk( 'IHDR', ihdr ),
		pngChunk( 'IDAT', idat ),
		pngChunk( 'IEND', Buffer.alloc( 0 ) ),
	] );
}

// ---------------------------------------------------------------- main

function main() {
	const args = parseArgs( process.argv.slice( 2 ) );
	if ( args.help || args.h || Object.keys( args ).length === 1 ) {
		usage();
	}

	const type = String( args.type || '' ).toLowerCase();
	if ( ! [ 'block', 'classic', 'hybrid' ].includes( type ) ) {
		fail( '--type must be block, classic, or hybrid.' );
	}

	const slug = String( args.slug || '' ).trim();
	if ( ! /^[a-z][a-z0-9-]*[a-z0-9]$/.test( slug ) ) {
		fail( '--slug must be lowercase letters, numbers and hyphens (e.g. my-theme).' );
	}
	if ( /^(wordpress|theme|twenty)/.test( slug ) ) {
		fail( 'Theme slug must not start with "wordpress", "theme" or "twenty" (Theme Review rule).' );
	}

	const name = args.name ? String( args.name ) : titleCase( slug );
	const prefix = args.prefix ? String( args.prefix ).toLowerCase() : defaultPrefix( slug );
	if ( ! /^[a-z][a-z0-9_]{3,}$/.test( prefix ) ) {
		fail( '--prefix must be at least 4 characters: a letter followed by letters, numbers or underscores.' );
	}
	if ( prefix.startsWith( 'wp_' ) || prefix === 'wp' ) {
		fail( 'Prefix must not start with "wp_" (reserved by core).' );
	}

	const out = path.resolve( args.out ? String( args.out ) : path.join( process.cwd(), slug ) );
	const opts = { dryRun: !! args[ 'dry-run' ] };

	if ( ! isDirEmpty( out ) && ! args.force ) {
		fail( `Output directory is not empty: ${ out }\nUse --force to overwrite files in it.` );
	}

	const authorUri = String( args[ 'author-uri' ] || 'https://example.com' );
	const tokens = {
		SLUG: slug,
		TEXTDOMAIN: slug,
		NAME: name,
		PACKAGE: packageName( name ),
		PREFIX: prefix,
		PREFIX_UPPER: prefix.toUpperCase(),
		AUTHOR: String( args.author || 'Author' ),
		AUTHOR_URI: authorUri,
		THEME_URI: String( args[ 'theme-uri' ] || `${ authorUri.replace( /\/$/, '' ) }/${ slug }` ),
		DESCRIPTION: String( args.description || `${ name } is a custom ${ type } WordPress theme.` ),
		YEAR: String( new Date().getFullYear() ),
		WP_MIN: String( args[ 'wp-min' ] || '6.7' ),
		PHP_MIN: String( args[ 'php-min' ] || '7.4' ),
		VENDOR: String( args.vendor || prefix ).toLowerCase().replace( /[^a-z0-9-]/g, '-' ),
	};

	console.log( `\nScaffolding ${ type } theme "${ name }" (${ slug }, prefix ${ prefix }_)` );
	console.log( `→ ${ out }${ opts.dryRun ? '  [dry run]' : '' }\n` );

	let written = [];

	// 1. Theme files.
	if ( type === 'hybrid' ) {
		written = written.concat( copyTree( path.join( TEMPLATES, 'classic' ), out, tokens, opts ) );
		written = written.concat( copyTree( path.join( TEMPLATES, 'hybrid' ), out, tokens, opts, [ 'README-overlay.md' ] ) );
	} else {
		written = written.concat( copyTree( path.join( TEMPLATES, type ), out, tokens, opts ) );
	}

	// 2. Screenshot.
	if ( ! opts.dryRun ) {
		fs.writeFileSync( path.join( out, 'screenshot.png' ), makeScreenshotPng() );
	}
	written.push( 'screenshot.png' );

	// 3. Dev configs.
	if ( ! args[ 'no-configs' ] ) {
		const configMap = {
			'phpcs.xml.dist': '.phpcs.xml.dist',
			'composer.json': 'composer.json',
			'package.json': 'package.json',
			'.wp-env.json': '.wp-env.json',
			'.editorconfig': '.editorconfig',
			'.gitignore': '.gitignore',
			'.gitattributes': '.gitattributes',
		};
		for ( const [ src, dest ] of Object.entries( configMap ) ) {
			const srcPath = path.join( CONFIGS, src );
			if ( ! fs.existsSync( srcPath ) ) {
				continue;
			}
			const content = replaceTokens( fs.readFileSync( srcPath, 'utf8' ), tokens );
			written.push( dest );
			if ( ! opts.dryRun ) {
				fs.writeFileSync( path.join( out, dest ), content );
			}
		}
	}

	// 4. Companion plugin.
	let pluginOut = null;
	if ( args[ 'with-plugin' ] ) {
		pluginOut = path.resolve( args[ 'plugin-out' ] ? String( args[ 'plugin-out' ] ) : path.join( out, '..', `${ slug }-core` ) );
		if ( ! isDirEmpty( pluginOut ) && ! args.force ) {
			fail( `Plugin directory is not empty: ${ pluginOut }` );
		}
		const pluginFiles = copyTree( PLUGIN_TPL, pluginOut, tokens, opts );
		console.log( `Companion plugin → ${ pluginOut }` );
		pluginFiles.forEach( ( f ) => console.log( `  + ${ f }` ) );
		console.log( '' );
	}

	written.sort().forEach( ( f ) => console.log( `  + ${ f }` ) );

	console.log( `\nDone. ${ written.length } theme files${ pluginOut ? ' + companion plugin' : '' }.\n` );
	console.log( 'Next steps:' );
	console.log( `  1. node "${ path.join( SKILL_DIR, 'scripts', 'audit-theme.js' ) }" "${ out }"` );
	console.log( `  2. cd "${ out }" && composer install && vendor/bin/phpcs` );
	console.log( '  3. Replace screenshot.png with a real 1200x900 capture before release.' );
	console.log( '  4. Edit .phpcs.xml.dist / composer.json / package.json if the defaults do not fit.' );
	if ( type !== 'block' ) {
		console.log( '  5. Generate translations: wp i18n make-pot . languages/' + slug + '.pot' );
	}
	console.log( '' );
}

main();
