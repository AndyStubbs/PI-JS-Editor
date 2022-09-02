/* global editor */

"use strict";

var file = ( function () {
	const OPEN_FOLDER_ENTITY = "&darr;";
	const CLOSED_FOLDER_ENTITY = "&rarr;"
	const FILE_TYPE_FOLDER = "folder";
	const FILE_TYPE_HTML = "html";
	const FILE_TYPE_STYLE = "css";
	const FILE_TYPE_SCRIPT = "javascript";
	const FILE_TYPES = [
		FILE_TYPE_SCRIPT, FILE_TYPE_FOLDER, FILE_TYPE_HTML, FILE_TYPE_STYLE
	];
	const FILE_TYPE_EXTENSIONS = {
		"javascript": ".js",
		"folder": "",
		"html": ".html",
		"css": ".css"
	};
	const ROOT_NAME = "root";

	let m_files = { 
		"name": ROOT_NAME,
		"type": FILE_TYPE_FOLDER,
		"content": [
			{
				"name": "index.html",
				"type": FILE_TYPE_HTML,
				"isOpen": true,
				"content": "" +
				"<!DOCTYPE html>\n\t" +
					"<html lang=\"en\">\n\t" +
					"<head>\n\t\t" +
						"<title>My Game</title>\n\t\t" +
						"<meta http-equiv=\"Content-Type\" content=\"text/html;charset=utf-8\" />\n\t\t" +
						"<link rel=\"stylesheet\" href=\"styles.css\">\n\t" +
					"</head>\n\t" +
					"<body>\n\t\t" +
						"<script src=\"main.js\"></script>\n\t" +
					"</body>\n" +
				"</html>"
			},
			{
				"name": "src",
				"type": FILE_TYPE_FOLDER,
				"content": [
					{
						"name": "main.js",
						"type": FILE_TYPE_SCRIPT,
						"content": "" +
							"$.screen( \"300x200\" );\n" +
							"$.circle( 150, 100, 50, \"red\" );\n" +
							"// This is a comment.\n" +
							"$.filterImg( function ( color, x, y ) {\n\t" +
							"let z = x + y;\n\t"+
							"color.r = color.r - Math.round( Math.tan( z / 10 ) * 128 );\n\t" +
							"color.g = color.g + Math.round( Math.cos( x / 7 ) * 128 );\n\t" +
							"color.b = color.b + Math.round( Math.sin( y / 5 ) * 128 );\n\t" +
							"return color;\n" +
							"} );"
					},
					{
						"name": "style.css",
						"type": FILE_TYPE_STYLE,
						"content": "" +
							"html, body {\n\t" +
								"height: 100%;\n\t" +
								"margin: 0;\n\t" +
								"overflow: hidden;\n\t" +
								"background-color: rgb(30, 30, 30);\n\t" +
								"color: rgb(225, 225, 225);\n" +
							"}"
					}
				]
			}
		],
	};

	let fileLookup = {};
	let lastFileId = 0;

	main.addMenuItem( "File", "Create new file", "Ctrl+N", createNewFileDialog );
	main.addMenuItem( "File", "Upload file", "Ctrl+U", function () { console.log( "Create a new file." ) } );
	main.addMenuItem( "File", "Edit file", "Ctrl+E", function () { console.log( "Create a new file." ) } );
	main.addMenuItem( "File", "Delete file", "DEL", function () { console.log( "Create a new file." ) } );

	return {
		"init": init
	};

	function init() {
		let filesElement = document.querySelector( ".body > .files" );
		initFiles( m_files.content );
		createFileView( filesElement, m_files.content );
		filesElement.addEventListener( "click", clickFiles );
		layout.createTabsElement( document.querySelector( ".main-editor-tabs" ), function ( tab ) {
			let file = fileLookup[ tab.dataset.fileId ];
			util.selectItem( tab, "selected-tab" );
			editor.setModel( file.model );
		} );
	}

	function initFiles( parentFolder ) {
		for( let i = 0; i < parentFolder.length; i++ ) {
			let file = parentFolder[ i ];
			createFile( file, parentFolder );
			if( file.type === FILE_TYPE_FOLDER ) {
				initFiles( file.content );
			}
		}
	}

	function createFile( file, parentFolder ) {
		let fileId = ++lastFileId;
		file.id = fileId;
		file.parent = parentFolder;
		fileLookup[ fileId ] = file;
	}

	function createFileView( element, folder ) {
		let ul = document.createElement( "ul" );
		for( let i = 0; i < folder.length; i++ ) {
			let file = folder[ i ];
			let li = document.createElement( "li" );
			let span = document.createElement( "span" );
			li.appendChild( span );
			li.dataset.fileType = file.type;
			li.dataset.clickable = true;
			li.dataset.fileId = file.id;

			if( file.type === FILE_TYPE_FOLDER ) {
				updateFolderName( li, file, true );
				createFileView( li, file.content );
			} else {
				span.innerText = file.name;
				if( file.isOpen ) {
					openFile( file );
				}
			}
			ul.appendChild( li );
		}
		element.appendChild( ul );
	}

	function openFile( file ) {
		let tabsContainer = document.querySelector( ".main-editor-tabs" );
		layout.createTab( tabsContainer, file );
		if( !file.model ) {
			file.model = editor.createModel( file.content, file.type );
		}
		editor.setModel( file.model );
	}

	function updateFolderName( element, file, isOpen ) {
		if( isOpen ) {
			element.firstElementChild.innerHTML = OPEN_FOLDER_ENTITY + "&nbsp;&nbsp;" + file.name;
		} else {
			element.firstElementChild.innerHTML = CLOSED_FOLDER_ENTITY + "&nbsp;&nbsp;" + file.name;
		}
	}

	function clickFiles( e ) {
		// Make sure we are clicking on a file or folder
		let target = util.getClickableTarget( e.target, this );
		if( ! target ) {
			return;
		}

		util.selectItem( target, "selected-file" );
		let file = fileLookup[ target.dataset.fileId ];

		// Toggle the folder Open/Closed
		if( target.dataset.fileType === FILE_TYPE_FOLDER ) {
			let ul = target.children[ 1 ];
			if( ul.style.display === "none" ) {
				ul.style.display = "";
				updateFolderName( target, file, true );
			} else {
				ul.style.display = "none";
				updateFolderName( target, file, false );
			}
		} else {
			openFile( file );
		}
	}

	function getFolders( name, folderContents, folderArray ) {
		folderArray.push( name );
		for( let i = 0; i < folderContents.length; i++ ) {
			if( folderContents[ i ].type === FILE_TYPE_FOLDER ) {
				getFolders( name + "/" + folderContents[ i ].name, folderContents[ i ].content, folderArray );
			}
		}
	}

	function createFolderOptions() {
		let folders = [];
		getFolders( ROOT_NAME, m_files.content, folders );
		let folderOptions = "";
		for( let i = 0; i < folders.length; i++ ) {
			folderOptions += "<option>" + folders[ i ] + "</option>";
		}
		return folderOptions;
	}

	function findFileByName( name, folderContents, isRecursive ) {
		if( name === ROOT_NAME ) {
			return m_files;
		}
		for( let i = 0; i < folderContents.length; i++ ) {
			if( folderContents[ i ].name === name ) {
				return folderContents[ i ];
			}
			if( isRecursive && folderContents[ i ].type === FILE_TYPE_FOLDER ) {
				let folder = findFileByName( name, folderContents[ i ].content, isRecursive );
				if( folder ) {
					return folder;
				}
			}
		}
		return null;
	}

	function findFileByPath( path ) {
		let parts = path.split( "/" );
		let folder = m_files;
		for( let i = 0; i < parts.length; i++ ) {			
			if( folder.type === FILE_TYPE_FOLDER ) {
				folder = findFileByName( parts[ i ], folder.content, false );
			} else {
				return null;
			}
			if( ! folder ) {
				return  null;
			}
		}
		return folder;
	}

	function createNewFileDialog() {
		let popup = document.querySelector( ".popup" );
		if( popup ) {
			popup.focus();
			return;
		}
		let div = document.createElement( "div" );
		let typeOptions = "";
		for( let i = 0; i < FILE_TYPES.length; i++ ) {
			typeOptions += "<option>" + FILE_TYPES[ i ] + "</option>";
		}
		let folderOptions = createFolderOptions();

		div.className = "new-file-popup";
		div.innerHTML = "<p>" +
			"<span>File Type:</span>&nbsp;&nbsp;" +
			"<select id='new-file-language'>" + typeOptions + "</select>" +
			"</p><p>" +
			"<span>File Name:</span>&nbsp;&nbsp;" +
			"<input id='new-file-name' type='text' value='untitled' /> <span id='new-file-extension'>.js</span>" + 
			"</p><p>" +
			"<span>Folder:</span>&nbsp;&nbsp;" +
			"<select id='new-file-folder'>" + folderOptions + "</select>" +
			"</p><p id='new-file-message'>&nbsp;</p>";
		div.querySelector( "#new-file-name" ).addEventListener( "change", function () {
			let unallowedCharacters = "./\\";
			let value = this.value;
			let changed = false;
			for ( let i = 0; i < unallowedCharacters.length; i++ ) {
				if( value.indexOf( unallowedCharacters[ i ] ) > -1 ) {
					value = value.replaceAll( unallowedCharacters.charAt( i ), "" );
					changed = true;
				}
			}
			if( changed ) {
				this.value = value;
			}
		} );
		div.querySelector( "#new-file-language" ).addEventListener( "change", function () {
			let language = div.querySelector( "#new-file-language" ).value;
			div.querySelector( "#new-file-extension" ).innerText = FILE_TYPE_EXTENSIONS[ language ];
		} );
		let createButton = document.createElement( "input" );
		createButton.classList.add( "button" );
		createButton.value = "Create";
		createButton.type = "button";
		createButton.addEventListener( "click", function () {
			let language = div.querySelector( "#new-file-language" ).value;
			let name = div.querySelector( "#new-file-name" ).value + FILE_TYPE_EXTENSIONS[ language ];
			let folderPath = div.querySelector( "#new-file-folder" ).value;
			let filePath = folderPath + "/" + name;
			let divMsg = document.getElementById( "new-file-message" );

			if( findFileByPath( filePath ) ) {
				divMsg.classList.remove( "msg-success" );
				divMsg.classList.add( "msg-error" );
				divMsg.innerText =  filePath + " already exists.";
				return false;
			}
			let parentFolder = findFileByPath( folderPath ).content;
			let content = "";
			if( language === FILE_TYPE_FOLDER ) {
				content = [];
			}
			let file = {
				"name": name,
				"type": language,
				"content": content
			};
			parentFolder.push( file );
			createFile( file, parentFolder );
			let filesElement = document.querySelector( ".body > .files" );
			filesElement.innerText = "";
			createFileView( filesElement, m_files.content );
			divMsg.classList.remove( "msg-error" );
			divMsg.classList.add( "msg-success" );
			divMsg.innerText = "Created file: " + filePath;
			if( language === FILE_TYPE_FOLDER ) {
				div.querySelector( "#new-file-folder" ).innerHTML = createFolderOptions();
			}
		} );
		layout.createPopup( "Create New File", div, { "extraButtons": [ createButton ] } );
	}

} )();
