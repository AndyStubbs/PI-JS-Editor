"use strict";
var layout = ( function () {
	let m_keys = {};

	initializeDragDrop();
	return {
		"createHorizontalResize": createHorizontalResize,
		"createTabsElement": createTabsElement,
		"createMenu": createMenu,
		"createPopup": createPopup
	};

	function createHorizontalResize( leftElement, resizeElement, rightElement ) {
		resizeElement.addEventListener( "mousedown", mouseDown );
		leftElement.parentElement.addEventListener( "mousemove", mouseMove );
		window.addEventListener( "mouseup", mouseUp );

		let isMouseDown = false;
		let oldCursor;
		let resizeElementWidth = resizeElement.getBoundingClientRect().width;
		let resizeMiddlePosition = resizeElementWidth / 2;
		const CURSOR_WIDTH = 15;

		function mouseDown() {
			isMouseDown = true;
			oldCursor = leftElement.style.cursor;
			leftElement.parentElement.style.cursor = "e-resize";
		}
	
		function mouseMove( e ) {
			if( isMouseDown ) {
				let leftElementWidth = e.pageX - resizeMiddlePosition - CURSOR_WIDTH;
				leftElement.style.width = leftElementWidth + "px";
				rightElement.style.width = "calc(100% - " + ( leftElementWidth + resizeElementWidth ) + "px)";
				resizeMain();
				editor.resize();
			}
		}
	
		function mouseUp() {
			isMouseDown = false;
			leftElement.parentElement.style.cursor = oldCursor;
		}
	}

	function createTabsElement( tabsElement, tabSelected ) {
		let f_tabDrag = null;
		let f_tabsContainer = tabsElement;
		let $tabsElement = $( tabsElement );
		
		$tabsElement.on( "click", "input[type='button']", closeTabButtonClicked );
		$tabsElement.on( "mousedown", ".tab", mousedownTabs );
		$tabsElement.on( "mousemove", ".tab", mousemoveTabs );
		window.addEventListener( "mouseup", mouseupWindow );
		window.addEventListener( "blur", mouseupWindow );

		function closeTabButtonClicked() {			
			let tab = this.parentElement;
			closeTab( tab );
		}

		function mousedownTabs( e ) {
			let over = document.elementFromPoint( e.pageX, e.pageY );
			if( over && over.type === "button" ) {
				return;
			}
			f_tabDrag = this;
			if( f_tabDrag ) {
				tabSelected( f_tabDrag );
			} else {
				f_tabDrag = null;
			}
		}
	
		function mousemoveTabs( e ) {
			if( f_tabDrag ) {
				let tabUnderMouse = this;
				if( tabUnderMouse !== f_tabDrag ) {
					let tabUnderMouseRect = tabUnderMouse.getBoundingClientRect();
					let tabDragRect = f_tabDrag.getBoundingClientRect();
					if( tabDragRect.left > tabUnderMouseRect.right ) {
						tabUnderMouse.parentElement.insertBefore( f_tabDrag, tabUnderMouse );
					} else {
						tabUnderMouse.parentElement.insertBefore( tabUnderMouse, f_tabDrag );
					}
				}
			}
		}
	
		function mouseupWindow() {
			f_tabDrag = null;
		}

		function createTab( tabData ) {
			let existingTab = f_tabsContainer.querySelector( ".tab-" + tabData.id );
			if( existingTab ) {
				util.selectItem( existingTab, "selected-tab" );
			} else {
				let newTab = document.createElement( "div" );
				let tabTitle = document.createElement( "span" );
				let tabClose = document.createElement( "input" );
				tabClose.type = "button";
				tabClose.dataset.clickable = true;
				tabClose.value = "X";
				tabClose.className = "close-button";
				newTab.dataset.clickable = true;
				newTab.append( tabTitle );
				newTab.append( tabClose );
				newTab.className = "tab tab-" + tabData.id + " disable-select";            
				tabTitle.innerText = tabData.name;
				newTab.dataset.fileId = tabData.id;
				f_tabsContainer.append( newTab );
				util.selectItem( newTab, "selected-tab" );

				resizeMain();
				return newTab;
			}
			return existingTab;
		}

		function closeTab( tab ) {
			// If selected tab then find a new tab to open
			if( tab.classList.contains( "selected-tab" ) ) {
				let nearestTab;
				if( tab.previousElementSibling ) {
					nearestTab = tab.previousElementSibling;
				} else {
					nearestTab = tab.nextElementSibling;
				}
				if( nearestTab ) {
					tabSelected( nearestTab );
				} else {
					editor.setModel( null );
					$( ".main-image-viewer" ).html( "" ).hide();
					$( ".main-editor-body" ).show();
				}
			}
			if( tab.parentElement ) {
				tab.parentElement.removeChild( tab );
				resizeMain();
			}
		}

		return {
			"createTab": createTab,
			"closeTab": closeTab
		};
	}

	function resizeMain() {
		let height = $( ".main-editor-tabs" ).height() + 4;

		$( ".main-image-viewer" ).css( "height", "calc(100% - " + height + "px)" );
		$( ".main-editor-body" ).css( "height", "calc(100% - " + height + "px)" );
		editor.resize();
	}

	function createMenu( items, menuContainer ) {
		let submenu = document.createElement( "div" );
		let isOpenThisThread = false;
		let isMenuOpen = false;
		submenu.classList.add( "submenu" );
		submenu.style.display = "none";
		document.body.appendChild( submenu );
		window.addEventListener( "mousedown", mouseDown );
		window.addEventListener( "blur", blur );
		window.addEventListener( "keydown", keyDown );

		for( let i = 0; i < items.length; i++ ) {
			let item = items[ i ];
			let element = document.createElement( "span" );
			element.classList.add( "menu-item" );
			element.innerText = item.name;
			element.dataset.index = i;
			element.addEventListener( "mousedown", openSubMenu );
			menuContainer.appendChild( element );

			for( let j = 0; j < item.subItems.length; j++ ) {
				if( item.subItems[ j ].shortcutKey ) {
					m_keys[ item.subItems[ j ].shortcutKey.key ] = item.subItems[ j ];
				}
			}
		}

		function openSubMenu() {
			submenu.innerText = "";
			let index = this.dataset.index;
			let item = items[ index ];
			for( let i = 0; i < item.subItems.length; i++ ) {
				let subItem = item.subItems[ i ];
				let submenuItem = document.createElement( "div" );
				submenuItem.innerHTML = "<span class='subitem-title'>" + subItem.name + "</span>" +
					"<span class='shortcut'>" + subItem.shortcutName + "</span>";
				submenuItem.classList.add( "submenu-item" );
				submenuItem.addEventListener( "click", function() {
					subItem.command();
					submenu.style.display = "none";
					isMenuOpen = false;
				} );
				submenu.appendChild( submenuItem );
			}
			let rect = this.getBoundingClientRect();
			submenu.style.top = ( rect.bottom - 5 ) + "px";
			submenu.style.left = rect.left + "px";
			submenu.style.display = "";
			isOpenThisThread = true;
			isMenuOpen = true;
			setTimeout( function () {
				isOpenThisThread = false;
			}, 0 );
		}

		function mouseDown( e ) {
			if( isMenuOpen && !isOpenThisThread ) {
				let $over = $( document.elementFromPoint( e.pageX, e.pageY ) ).closest( ".submenu-item" );
				if( $over.length === 0 ) {
					submenu.style.display = "none";
					isMenuOpen = false;
				}
			}
		}

		function blur() {
			submenu.style.display = "none";
			isMenuOpen = false;
		}

		function keyDown( e ) {
			console.log( e );
			let item = m_keys[ e.key.toUpperCase() ];
			if( item ) {
				if( e.ctrlKey === item.shortcutKey.ctrlKey ) {
					item.command();
					e.preventDefault();
				}
			}
		}
	}

	function createPopup( title, contentElement, options ) {
		if( !options ) {
			options = {};
		}
		let okCommand = options.okCommand;
		let cancelCommand = options.cancelCommand;
		let popup = document.createElement( "div" );
		let okText = options.okText;

		if( title === "" ) {
			title = "&nbsp;";
		}
		popup.className = "popup";
		popup.innerHTML = "<div class='popup-title'>" +
			"<span>" + title + "</span>" +
			"<input class='popup-close close-button' type='button' value='X' />" +
			"</div>";
		if( typeof contentElement === "string" ) {
			let temp = contentElement;
			contentElement = document.createElement( "div" );
			contentElement.innerHTML = temp;
		}
		popup.appendChild( contentElement );

		let footer = document.createElement( "div" );
		footer.className = "popup-footer";
		if( options.extraButtons ) {
			for( let i = options.extraButtons.length - 1; i >= 0; i-- ) {
				footer.appendChild( options.extraButtons[ i ] );
			}
		}
		let okButton = document.createElement( "input" );
		okButton.classList.add( "button" );
		okButton.classList.add( "popup-ok" );
		okButton.type = "button";
		okButton.value = "Ok";
		if( okText ) {
			okButton.value = okText;
		}
		footer.appendChild( okButton );
		if( cancelCommand ) {
			let cancelButton = document.createElement( "input" );
			cancelButton.classList.add( "button" );
			cancelButton.classList.add( "popup-close" );
			cancelButton.type = "button";
			cancelButton.value = "Cancel";
			footer.appendChild( cancelButton );
		}
		popup.appendChild( footer );
		let popupOverlay = document.createElement( "div" );
		popupOverlay.classList.add( "popup-overlay" );
		popupOverlay.appendChild( popup );
		document.body.appendChild( popupOverlay );
		popup.querySelectorAll( ".popup-close" ).forEach( function ( element ) {
			element.addEventListener( "click", closePopup );
		} );
		popup.querySelectorAll( ".popup-ok" ).forEach( function ( element ) {
			element.addEventListener( "click", okPopup );
		} );

		function okPopup() {
			let success = true;
			if( okCommand ) {				
				success = okCommand();
			}
			if( success ) {
				document.body.removeChild( popupOverlay );
			}
		}

		function closePopup() {
			if( cancelCommand ) {
				cancelCommand();
			}
			document.body.removeChild( popupOverlay );
		}
	}

	function initializeDragDrop() {
		var dragEvents, i;

		// Prevent default behavior on drag events
		function noDrop( e ) {
			e.preventDefault();
			e.stopPropagation();
		}
		dragEvents = [
			"drag", "dragstart", "dragend", "dragover",
			"dragenter", "dragleave", "drop"
		];
		for( i = 0; i < dragEvents.length; i++ ) {
			document.body.addEventListener( dragEvents[ i ], noDrop );
		}

		// Change background on drag over
		function dragOver( e ) {
			let popupOverlay = document.querySelector( ".popup-overlay" );
			if( popupOverlay ) {
				popupOverlay.parentElement.removeChild( popupOverlay );
			}
			document.getElementById( "dragOverPopup" ).style.display = "block";
		}
		dragEvents = [ "dragover", "dragenter" ];
		for( i = 0; i < dragEvents.length; i++ ) {
			document.body.addEventListener( dragEvents[ i ], dragOver );
		}

		// Change background on drag out
		function dragOut( e ) {
			document.getElementById( "dragOverPopup" ).style.display = "none";
		}
		dragEvents = [ "dragleave", "dragend", "drop" ];
		for( i = 0; i < dragEvents.length; i++ ) {
			document.getElementById( "dragOverPopup" )
				.addEventListener( dragEvents[ i ], dragOut );
		}
		document.getElementById( "dragOverPopup" )
			.addEventListener( "drop", droppedFile );

		// Dropped File
		function droppedFile( e ) {
			file.createUploadDialog( e.dataTransfer.files );
		}
	}
} )();
