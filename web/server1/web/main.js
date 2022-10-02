/* global layout */
/* global file */
/* global editor */
"use strict";
var main = ( function () {

	let menuItems = {
		"File": []
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
		file.init();
		initMenu();
		storage.calculateLocalStorageCapacity();
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

		layout.createMenu( menuArray, document.querySelector( ".main-menu" ) );
	}

	function addMenuItem( menuName, name, title, shortcutName, keybindingsLocal, keybindingsMonaco, command ) {
		let menuItem = {
			"name": name,
			"command": command,
			"title": title,
			"shortcutName": shortcutName,
			"keybindingsLocal": keybindingsLocal,
			"keybindingsMonaco": keybindingsMonaco
		};
		menuItems[ menuName ].push( menuItem );
	}

} )();