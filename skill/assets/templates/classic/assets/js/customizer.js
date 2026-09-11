/* global wp */
/**
 * Live-updates the site title and description in the Customizer preview.
 */
( function () {
	'use strict';

	if ( ! window.wp || ! wp.customize ) {
		return;
	}

	wp.customize( 'blogname', function ( value ) {
		value.bind( function ( to ) {
			document.querySelectorAll( '.site-title a' ).forEach( function ( el ) {
				el.textContent = to;
			} );
		} );
	} );

	wp.customize( 'blogdescription', function ( value ) {
		value.bind( function ( to ) {
			document.querySelectorAll( '.site-description' ).forEach( function ( el ) {
				el.textContent = to;
			} );
		} );
	} );
}() );
