#!/usr/bin/env node
/**
 * check-tools.js
 *
 * Detect which WordPress development tools are available on this machine and
 * print which real checks (PHPCS, Theme Check, wp-env) can run.
 *
 * Usage: node check-tools.js [--json]
 */

'use strict';

const { spawnSync } = require( 'child_process' );
const fs = require( 'fs' );
const path = require( 'path' );

const TOOLS = [
	{ name: 'php', cmd: 'php', args: [ '--version' ], install: 'https://www.php.net/downloads (Windows: winget install PHP.PHP.8.3)', need: 'PHPCS, php -l' },
	{ name: 'composer', cmd: 'composer', args: [ '--version' ], install: 'https://getcomposer.org/download/ (Windows: winget install Composer.Composer)', need: 'PHPCS + WordPress Coding Standards' },
	{ name: 'node', cmd: 'node', args: [ '--version' ], install: 'https://nodejs.org/', need: 'skill scripts, @wordpress/scripts, wp-env' },
	{ name: 'npm', cmd: 'npm', args: [ '--version' ], install: 'ships with Node.js', need: '@wordpress/scripts, wp-env' },
	{ name: 'docker', cmd: 'docker', args: [ '--version' ], install: 'https://docs.docker.com/get-docker/', need: 'wp-env local WordPress' },
	{ name: 'wp-cli', cmd: 'wp', args: [ '--version' ], install: 'https://wp-cli.org/#installing (or use `npx wp-env run cli wp`)', need: 'wp i18n make-pot, theme activate, importer' },
	{ name: 'git', cmd: 'git', args: [ '--version' ], install: 'https://git-scm.com/downloads', need: 'versioning, release archives' },
];

const ANSI = new RegExp( String.fromCharCode( 27 ) + '\\[[0-9;]*m', 'g' );

function run( cmd, args ) {
	// .cmd/.bat wrappers on Windows (npm, composer) need a shell; a shell is harmless elsewhere.
	const r = spawnSync( cmd, args, { encoding: 'utf8', shell: true, timeout: 15000, windowsHide: true } );
	if ( ! r.error && r.status === 0 ) {
		const lines = ( r.stdout || r.stderr || '' ).trim().split( /\r?\n/ );
		return lines[ 0 ].replace( ANSI, '' );
	}
	return null;
}

function localPhpcs() {
	const candidates = [
		path.join( process.cwd(), 'vendor', 'bin', process.platform === 'win32' ? 'phpcs.bat' : 'phpcs' ),
		path.join( process.cwd(), 'vendor', 'bin', 'phpcs' ),
	];
	return candidates.find( ( c ) => fs.existsSync( c ) ) || null;
}

function main() {
	const json = process.argv.includes( '--json' );
	const results = TOOLS.map( ( t ) => ( { ...t, version: run( t.cmd, t.args ) } ) );
	const has = ( n ) => results.find( ( r ) => r.name === n ).version !== null;
	const phpcs = localPhpcs();

	const capabilities = {
		phpcs: has( 'php' ) && ( has( 'composer' ) || !! phpcs ),
		phpLint: has( 'php' ),
		wpEnv: has( 'docker' ) && has( 'node' ) && has( 'npm' ),
		wpCli: has( 'wp-cli' ),
		build: has( 'node' ) && has( 'npm' ),
	};

	if ( json ) {
		console.log( JSON.stringify( { tools: results.map( ( r ) => ( { name: r.name, version: r.version } ) ), phpcsBinary: phpcs, capabilities }, null, 2 ) );
		return;
	}

	console.log( '\nTool check\n' );
	for ( const r of results ) {
		const status = r.version ? `OK   ${ r.version }` : 'MISSING';
		console.log( `  ${ r.name.padEnd( 9 ) } ${ status }` );
		if ( ! r.version ) {
			console.log( `            needed for: ${ r.need }` );
			console.log( `            install:    ${ r.install }` );
		}
	}
	console.log( '' );
	console.log( 'What can run here:' );
	console.log( `  PHPCS (WordPress Coding Standards) ....... ${ capabilities.phpcs ? 'yes' : 'no' }${ phpcs ? ` (found ${ phpcs })` : '' }` );
	console.log( `  php -l syntax check ...................... ${ capabilities.phpLint ? 'yes' : 'no' }` );
	console.log( `  wp-env local WordPress (Theme Check) ..... ${ capabilities.wpEnv ? 'yes' : 'no' }` );
	console.log( `  WP-CLI (make-pot, activate) .............. ${ capabilities.wpCli ? 'yes' : 'no (use: npx wp-env run cli wp ...)' }` );
	console.log( `  @wordpress/scripts build/lint ............ ${ capabilities.build ? 'yes' : 'no' }` );
	console.log( '' );
	if ( capabilities.phpcs && ! phpcs ) {
		console.log( 'To enable PHPCS in a theme directory:' );
		console.log( '  composer install          (if composer.json from the scaffold is present)' );
		console.log( '  vendor/bin/phpcs' );
		console.log( '' );
	}
	if ( ! capabilities.phpcs ) {
		console.log( 'Without PHP + Composer, use the heuristic audit only:' );
		console.log( `  node "${ path.join( __dirname, 'audit-theme.js' ) }" <theme-dir>` );
		console.log( '' );
	}
}

main();
