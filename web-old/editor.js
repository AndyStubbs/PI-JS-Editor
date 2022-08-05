"use strict";
( function () {
    require.config( { paths: { vs: "monaco-editor/min/vs" } } );

    require( [ "vs/editor/editor.main" ], function () {

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
                'editorCursor.foreground': '#8B0000',
                
		'editor.lineHighlightBackground': '#0000FF20',
		'editorLineNumber.foreground': '#008800',
		'editor.selectionBackground': '#88000030',
		'editor.inactiveSelectionBackground': '#88000015'
            }
        });

        /*monaco.languages.typescript.javascriptDefaults.addExtraLib(`var myobject = {
                      field1: "",
                      field2: ""
                    }`, 'filename/fields.d.ts');
        */
        
        console.log( JSON.stringify( $ ) );
        //monaco.languages.typescript.javascriptDefaults.addExtraLib("var $ = " + JSON.stringify( $ ), "filename/fields.d.ts" );
                      
        let editor = monaco.editor.create( document.getElementById( "container" ), {
            value: "" +
                "$.screen(\"300x200\");\n" +
                "$.circle(150, 100, 50, \"red\");\n" +
                "// This is a comment.\n" +
                "$.filterImg( function ( color, x, y ) {\n\t" +
                "let z = x + y;\n\t"+
                "color.r = color.r - Math.round( Math.tan( z / 10 ) * 128 );\n\t" +
                "color.g = color.g + Math.round( Math.cos( x / 7 ) * 128 );\n\t" +
                "color.b = color.b + Math.round( Math.sin( y / 5 ) * 128 );\n\t" +
                "return color;\n" +
                "} );",
            "language": 'javascript',
            "theme": "myCustomTheme",
            "fontSize": "14px",
            "bracketPairColorization.enabled": true
        });

        window.onresize = () => {
            console.log('Window resize');
            editor.layout();
        };
    } );
} )();
