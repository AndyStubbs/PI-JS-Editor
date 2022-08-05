"use strict";
/* global monaco */

require.config( { paths: { vs: "monaco-editor/min/vs" } } );

require( [ "vs/editor/editor.main" ], function () {
    editor.create( document.querySelector( ".main-editor" ) );
} );

var editor = function () {
    let editors = [];
    window.addEventListener( "resize", resize );
    
    return {
        "create": create,
        "resize": resize
    };

    function create( containerElement ) {

        monaco.editor.defineTheme( "myCustomTheme", {
            base: "vs-dark", // can also be vs-dark or hc-black
            inherit: true, // can also be false to completely replace the builtin rules
            rules: [
                { "token": "comment", "foreground": "aeaeae", "fontStyle": "italic" },
                { "token": "keyword", "foreground": "e28964" },
                { "token": "string", "foreground": "65b042" },
                { "token": "number", "foreground": "3387cc" },
                { "token": "delimiter", "foreground": "cccc33" }
            ],
            colors: {
                "editor.foreground": "#ffffff",
                //"editorCursor.foreground": "#8B0000"
            }
        } );
    
        let codeText = "" +
            "$.screen( \"300x200\" );\n" +
            "$.circle( 150, 100, 50, \"red\" );\n" +
            "// This is a comment.\n" +
            "$.filterImg( function ( color, x, y ) {\n\t" +
            "let z = x + y;\n\t"+
            "color.r = color.r - Math.round( Math.tan( z / 10 ) * 128 );\n\t" +
            "color.g = color.g + Math.round( Math.cos( x / 7 ) * 128 );\n\t" +
            "color.b = color.b + Math.round( Math.sin( y / 5 ) * 128 );\n\t" +
            "return color;\n" +
            "} );";

        let editorObject = monaco.editor.create( containerElement, {
            "value": codeText,
            "language": 'javascript',
            "theme": "myCustomTheme",
                "fontSize": "14px",
                "bracketPairColorization.enabled": true
        } );

        editors.push( editorObject );
    }

    function resize() {
        for( let i = 0; i < editors.length; i++ ) {
            editors[ i ].layout();    
        }
    }
}();
