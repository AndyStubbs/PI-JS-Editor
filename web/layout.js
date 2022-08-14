"use strict";
var layout = ( function () {
    return {
        "createHorizontalResize": createHorizontalResize
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

} )();
