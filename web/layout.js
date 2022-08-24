"use strict";
var layout = ( function () {
	return {
		"createHorizontalResize": createHorizontalResize,
		"createTabsElement": createTabsElement,
		"createTab": createTab,
		"createMenu": createMenu,
		"createPopup": createPopup
	};

	function createHorizontalResize( leftElement, resizeElement, rightElement ) {
		resizeElement.addEventListener( "mousedown", mouseDown );
		leftElement.parentElement.addEventListener( "mousemove", mouseMove );
		window.addEventListener( "mouseup", mouseUp );

		let isMouseDown = false;
		let oldCursor;

		function mouseDown() {
			isMouseDown = true;
			oldCursor = leftElement.style.cursor;
			leftElement.parentElement.style.cursor = "e-resize";
		}
	
		function mouseMove( e ) {
			if( isMouseDown ) {
				let resizeRect = resizeElement.getBoundingClientRect();
				let width = e.pageX;
				leftElement.style.width = width + "px";
				rightElement.style.width = "calc(100% - " + ( resizeRect.width + width ) + "px)";
				editor.resize();
			}
		}
	
		function mouseUp() {
			isMouseDown = false;
			leftElement.parentElement.style.cursor = oldCursor;
		}
	}

	function createTabsElement( tabsElement, tabSelected ) {
		let tabDrag = null;

		tabsElement.addEventListener( "click", clickTabs );
		tabsElement.addEventListener( "mousedown", mousedownTabs );
		tabsElement.addEventListener( "mousemove", mousemoveTabs );
		window.addEventListener( "mouseup", mouseupWindow );
		window.addEventListener( "blur", mouseupWindow );

		function clickTabs( e ) {
			let target = util.getClickableTarget( e.target, this );
			if( ! target ) {
				return;
			}
	
			// Check if close button clicked
			if( target.type === "button" ) {
				let tab = target.parentElement;
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
					}
				}
				tab.parentElement.removeChild( tab );
			}
		}

		function mousedownTabs( e ) {
			tabDrag = util.getClickableTarget( e.target, this );
			if( tabDrag && tabDrag.type !== "button" ) {
				tabSelected( tabDrag );
			} else {
				tabDrag = null;
			}
		}
	
		function mousemoveTabs( e ) {
			if( tabDrag ) {
				let tabUnderMouse = util.getClickableTarget( document.elementFromPoint( e.pageX, e.pageY ), this );
				if( tabUnderMouse && tabUnderMouse.type !== "button" && tabUnderMouse !== tabDrag ) {
					let tabUnderMouseRect = tabUnderMouse.getBoundingClientRect();
					let tabDragRect = tabDrag.getBoundingClientRect();
					if( tabDragRect.left > tabUnderMouseRect.right ) {
						this.insertBefore( tabDrag, tabUnderMouse );
					} else {
						this.insertBefore( tabUnderMouse, tabDrag );
					}
				}
			}
		}
	
		function mouseupWindow() {
			tabDrag = null;
		}
	}

	function createTab( tabsContainer, tabData ) {
		let existingTab = tabsContainer.querySelector( ".tab-"+ tabData.id );
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
			newTab.className = "tab-" + tabData.id + " disable-select";            
			tabTitle.innerText = tabData.name;
			newTab.dataset.fileId = tabData.id;
			tabsContainer.append( newTab );
			util.selectItem( newTab, "selected-tab" );
		}
	}

	function createMenu( items, menuContainer ) {
		let submenu = document.createElement( "div" );
		let isOpenThisThread = false;
		submenu.classList.add( "submenu" );
		submenu.style.display = "none";
		document.body.appendChild( submenu );
		window.addEventListener( "mousedown", mouseDown );
		window.addEventListener( "blur", blur );

		for( let i = 0; i < items.length; i++ ) {
			let item = items[ i ];
			let element = document.createElement( "span" );
			element.classList.add( "menu-item" );
			element.innerText = item.name;
			element.dataset.index = i;
			element.addEventListener( "mousedown", openSubMenu );
			menuContainer.appendChild( element );
		}

		function openSubMenu() {
			submenu.innerText = "";
			let index = this.dataset.index;
			let item = items[ index ];
			for( let i = 0; i < item.subItems.length; i++ ) {
				let subItem = item.subItems[ i ];
				let submenuItem = document.createElement( "div" );
				submenuItem.innerHTML = "<span class='subitem-title'>" + subItem.name + "</span>" +
					"<span class='shortcut'>" + subItem.shortcut + "</span>";
				submenuItem.classList.add( "submenu-item" );
				submenuItem.addEventListener( "click", subItem.command );
				submenu.appendChild( submenuItem );
			}
			let rect = this.getBoundingClientRect();
			submenu.style.top = ( rect.bottom - 5 ) + "px";
			submenu.style.left = rect.left + "px";
			submenu.style.display = "";
			isOpenThisThread = true;
			setTimeout( function () {
				isOpenThisThread = false;
			}, 0 );
		}

		function mouseDown( e ) {
			if( !isOpenThisThread ) {
				let over = document.elementFromPoint( e.pageX, e.pageY );
				if( ! over.classList.contains( "submenu-item" ) ) {
					setTimeout( function () {
						submenu.style.display = "none";
					}, 250 );
				} else {
					submenu.style.display = "none";
				}
			}
		}

		function blur() {
			submenu.style.display = "none";
		}
	}

	function createPopup( title, contentElement, okCommand, cancelCommand ) {
		let popup = document.createElement( "div" );
		popup.className = "popup";
		popup.innerHTML = "<div class='popup-title'>" +
			"<span>" + title + "</span>" +
			"<input class='popup-close close-button' type='button' value='X' />" +
			"</div>";
		popup.appendChild( contentElement );
		let footer = document.createElement( "div" );
		footer.className = "popup-footer";

		if( cancelCommand ) {
			footer.innerHTML = "<input class='popup-ok button' type='button' value='OK' />" +
				"<input class='popup-close button' type='button' value='Cancel' />";
		} else {
			footer.innerHTML = "<input class='popup-ok button' type='button' value='OK' />";
		}
		popup.appendChild( footer );
		document.body.appendChild( popup );

		popup.querySelectorAll( ".popup-close" ).forEach( function ( element ) {
			element.addEventListener( "click", closePopup );
		} );

		popup.querySelectorAll( ".popup-ok" ).forEach( function ( element ) {
			element.addEventListener( "click", okPopup );
		} );

		function okPopup() {
			if( okCommand ) {
				let temp = okCommand;
				okCommand = null;
				temp();
			}
			document.body.removeChild( popup );
		}

		function closePopup() {
			if( cancelCommand ) {
				let temp = cancelCommand;
				cancelCommand = null;
				temp();
			}
			document.body.removeChild( popup );
		}
	}
} )();
