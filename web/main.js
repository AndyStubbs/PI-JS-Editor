/* global layout */
/* global file */
/* global editor */
"use strict";
var main = ( function () {
	let menuItems = {
		"File": [],
		"Edit": []
	};
	return {
		"init": init,
		"addMenuItem": addMenuItem
	};

	function init() {
		layout.createHorizontalResize(
			document.querySelector( ".files" ),
			document.querySelector( ".resize" ),
			document.querySelector( ".main-editor" )
		);
		initMenu();
		file.init();
	}

	function initMenu() {
		let menuArray = [];
		for( let name in menuItems ) {
			let menuItem = {
				"name": name,
				"subItems": []
			};
			for( let i = 0; i < menuItems[ name ].length; i++ ) {
				menuItem.subItems.push( menuItems[ name ][ i ] );
			}
			menuArray.push( menuItem );
		}

		layout.createMenu( menuArray, document.querySelector( ".header" ) );
	}

	function addMenuItem( menuName, title, shortcut, command ) {
		let menuItem = {
			"name": title,
			"command": command,
			"shortcut": shortcut
		};
		menuItems[ menuName ].push( menuItem );
	}
} )();