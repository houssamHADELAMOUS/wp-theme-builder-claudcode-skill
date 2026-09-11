/**
 * Handles toggling the navigation menu for small screens and enables TAB key
 * navigation support for dropdown menus.
 *
 * Vanilla JS, no dependencies. Loaded with the "defer" strategy.
 */
( function () {
	'use strict';

	const siteNavigation = document.getElementById( 'site-navigation' );

	if ( ! siteNavigation ) {
		return;
	}

	const button = siteNavigation.querySelector( '.menu-toggle' );
	const menu = siteNavigation.querySelector( 'ul' );

	if ( ! button || ! menu ) {
		if ( button ) {
			button.style.display = 'none';
		}
		return;
	}

	if ( ! menu.classList.contains( 'nav-menu' ) ) {
		menu.classList.add( 'nav-menu' );
	}

	function closeMenu() {
		siteNavigation.classList.remove( 'toggled' );
		button.setAttribute( 'aria-expanded', 'false' );
	}

	// Toggle the .toggled class and the aria-expanded value each time the button is clicked.
	button.addEventListener( 'click', function () {
		siteNavigation.classList.toggle( 'toggled' );
		const expanded = siteNavigation.classList.contains( 'toggled' );
		button.setAttribute( 'aria-expanded', expanded ? 'true' : 'false' );
	} );

	// Close the menu when Escape is pressed.
	document.addEventListener( 'keydown', function ( event ) {
		if ( 'Escape' === event.key && siteNavigation.classList.contains( 'toggled' ) ) {
			closeMenu();
			button.focus();
		}
	} );

	// Remove the .toggled class and set aria-expanded to false when the user clicks outside the navigation.
	document.addEventListener( 'click', function ( event ) {
		if ( ! siteNavigation.contains( event.target ) ) {
			closeMenu();
		}
	} );

	// Get all the link elements within the menu.
	const links = menu.getElementsByTagName( 'a' );

	// Get all the link elements with children within the menu.
	const linksWithChildren = menu.querySelectorAll( '.menu-item-has-children > a, .page_item_has_children > a' );

	// Toggle focus each time a menu link is focused or blurred.
	for ( const link of links ) {
		link.addEventListener( 'focus', toggleFocus, true );
		link.addEventListener( 'blur', toggleFocus, true );
	}

	// Toggle focus each time a menu link with children receives a touch event.
	for ( const link of linksWithChildren ) {
		link.addEventListener( 'touchstart', toggleFocus, false );
	}

	/**
	 * Sets or removes .focus class on an element so sub-menus open on keyboard focus.
	 *
	 * @param {Event} event The focus, blur or touchstart event.
	 */
	function toggleFocus( event ) {
		if ( 'focus' === event.type || 'blur' === event.type ) {
			let self = this;
			// Move up through the ancestors of the current link until we hit .nav-menu.
			while ( ! self.classList.contains( 'nav-menu' ) ) {
				// On li elements toggle the class .focus.
				if ( 'li' === self.tagName.toLowerCase() ) {
					self.classList.toggle( 'focus' );
				}
				self = self.parentNode;
			}
		}

		if ( 'touchstart' === event.type ) {
			const menuItem = this.parentNode;
			event.preventDefault();
			for ( const sibling of menuItem.parentNode.children ) {
				if ( menuItem !== sibling ) {
					sibling.classList.remove( 'focus' );
				}
			}
			menuItem.classList.toggle( 'focus' );
		}
	}
}() );
