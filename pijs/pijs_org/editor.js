"use strict";
/* global monaco */
/* global main */

require.config( { paths: { vs: "libs/monaco-editor/min/vs" } } );

require( [ "vs/editor/editor.main" ], function () {
	editor.init( document.querySelector( ".main-editor-body" ) );
	main.init();
} );

var editor = ( function () {
	let editors = [];
	let activeEditor;

	window.addEventListener( "resize", resize );

	return {
		"init": init,
		"resize": resize,
		"createModel": createModel,
		"setModel": setModel,
		"addCommand": addCommand
	};

	function init( containerElement ) {

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

		monaco.languages.typescript.javascriptDefaults.addExtraLib( g_mapStr, "filename/fields.d.ts" );
		activeEditor = monaco.editor.create( containerElement, {
			"model": null,
			"theme": "myCustomTheme",
			"language": 'javascript',
			"fontSize": "14px",
			"bracketPairColorization.enabled": true
		} );

		editors.push( activeEditor );
	}

	function createModel( code, language ) {
		return monaco.editor.createModel( code, language );
	}

	function setModel( model ) {
		activeEditor.setModel( model );
	}

	function resize() {
		for( let i = 0; i < editors.length; i++ ) {
			editors[ i ].layout();    
		}
	}

	function addCommand( name, command, keybindings ) {
		activeEditor.addAction( {
			"id": name,
			"label": name,
			"keybindings": keybindings,
			"contextMenuGroupId": 'navigation',
			"contextMenuOrder": 1.5,
			"run": function( editor ) {
				//alert( name );
				command();
			}
		} );
	}
} )();
