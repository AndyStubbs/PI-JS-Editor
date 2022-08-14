/* global layout */
/* global file */
/* global editor */
"use strict";
var main = ( function () {
    return {
        "init": init
    };

    function init() {
        layout.createHorizontalResize(
            document.querySelector( ".files"),
            document.querySelector( ".resize" ),
            document.querySelector( ".main-editor" )
        );
        file.init();
    }
} )();