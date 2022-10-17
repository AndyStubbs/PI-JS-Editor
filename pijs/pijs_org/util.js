"use strict";
let util = ( function () {
	return {
		"getClickableTarget": getClickableTarget,
		"selectItem": selectItem
	};

	// Make sure we are clicking on a file or folder
	function getClickableTarget( target, container ) {
		while( target && target !== container && ! target.dataset.clickable ) {
			target = target.parentElement;
		}
		if( target === container ) {
			return null;
		}
		return target;
	}

	function selectItem( element, className ) {
		document.querySelectorAll( "." + className ).forEach(
			( el ) => el.classList.remove( className )
		);

		element.classList.add( className );
	}

} )();