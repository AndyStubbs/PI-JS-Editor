"use strict";
var layout = ( function () {
	return {
		"createHorizontalResize": createHorizontalResize,
		"createTabsElement": createTabsElement,
		"createTab": createTab
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

} )();
