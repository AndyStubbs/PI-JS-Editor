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
	const CLASS_NAMES = {
		 "FILES": "files",
		 "MAIN_EDITOR_TABS": "main-editor-tabs",
		 "SELECTED_FILE": "selected-file",
		 "SELECTED_TAB": "selected-tab",
		 "LAST_SELECTED_FILE": "last-selected-file"
	};

	let m_files = { 
		"name": ROOT_NAME,
		"fullname": ROOT_NAME,
		"type": FILE_TYPE_FOLDER,
		"path": "",
		"content": [
			{
				"name": "index",
				"fullname": "index.html",
				"type": FILE_TYPE_HTML,
				"isOpen": true,
				"path": "root",
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
				"fullname": "src",
				"type": FILE_TYPE_FOLDER,
				"path": "root",
				"content": [
					{
						"name": "main",
						"fullname": "main.js",
						"type": FILE_TYPE_SCRIPT,
						"path": "root/src",
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
						"name": "style",
						"fullname": "style.css",
						"type": FILE_TYPE_STYLE,
						"path": "root/src",
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
	let m_fileLookup = {};
	let m_lastFileId = 0;
	let m_lastFileClicked;
	let m_recycleBin = [];
	let m_tabsElement = null;

	main.addMenuItem( "File", "Create new file", "Ctrl+F", { "key": "F", "ctrlKey": true }, function() { createFileDialog( "create" ); } );
	main.addMenuItem( "File", "Edit/Update file", "Ctrl+E", { "key": "E", "ctrlKey": true }, function () { createFileDialog( "edit" ); } );
	main.addMenuItem( "File", "Upload file", "Ctrl+U", { "key": "U", "ctrlKey": true }, createUploadDialog );	
	main.addMenuItem( "File", "Delete file", "DEL", { "key": "DELETE", "ctrlKey": false }, deleteSelectedFiles );

	return {
		"init": init,
		"createUploadDialog": createUploadDialog
	};

	function init() {
		let filesElement = document.querySelector( ".body > ." + CLASS_NAMES.FILES );
		m_tabsElement = layout.createTabsElement( document.querySelector( "." + CLASS_NAMES.MAIN_EDITOR_TABS ), function ( tab ) {
			let file = m_fileLookup[ tab.dataset.fileId ];
			util.selectItem( tab, CLASS_NAMES.SELECTED_TAB );
			editor.setModel( file.model );
		} );
		initFiles( m_files.content, m_files.fullname );
		createFileView( filesElement, m_files.content, true );
		filesElement.addEventListener( "click", clickFiles );
	}

	function initFiles( parentFolder, path ) {
		for( let i = 0; i < parentFolder.length; i++ ) {
			let file = parentFolder[ i ];
			createFile( file, path );
			if( file.type === FILE_TYPE_FOLDER ) {
				initFiles( file.content, file.path + "/" + file.fullname );
			}
		}
	}

	function createFile( file, path ) {
		let fileId = ++m_lastFileId;
		file.id = fileId;
		file.path = path;
		file.fullname = file.name + FILE_TYPE_EXTENSIONS[ file.type ];
		file.fullpath = file.path + "/" + file.fullname;
		m_fileLookup[ fileId ] = file;
	}

	function createFileView( element, folder, init ) {
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
				createFileView( li, file.content, init );
			} else {
				span.innerText = file.fullname;
				if( init && file.isOpen ) {
					openFile( file );
				}
			}
			ul.appendChild( li );
		}
		element.appendChild( ul );
	}

	function openFile( file ) {
		file.tab = m_tabsElement.createTab( { "id": file.id, "name": file.fullname } );
		if( !file.model ) {
			file.model = editor.createModel( file.content, file.type );
		}
		editor.setModel( file.model );
	}

	function updateFolderName( element, file, isOpen ) {
		if( isOpen ) {
			element.firstElementChild.innerHTML = OPEN_FOLDER_ENTITY + "&nbsp;&nbsp;" + file.fullname;
		} else {
			element.firstElementChild.innerHTML = CLOSED_FOLDER_ENTITY + "&nbsp;&nbsp;" + file.fullname;
		}
	}

	function clickFiles( e ) {
		// Make sure we are clicking on a file or folder
		let target = util.getClickableTarget( e.target, this );
		if( ! target ) {
			return;
		}

		if( e.shiftKey && m_lastFileClicked ) {
			selectMultipleFiles( m_lastFileClicked, target );
		} else if( e.ctrlKey ) {
			m_lastFileClicked = target;
			util.selectItem( target, CLASS_NAMES.LAST_SELECTED_FILE );
			if( target.classList.contains( CLASS_NAMES.SELECTED_FILE ) ) {
				target.classList.remove( CLASS_NAMES.SELECTED_FILE );
			} else {
				target.classList.add( CLASS_NAMES.SELECTED_FILE );
			}
		} else {
			m_lastFileClicked = target;
			selectFile( target );
			util.selectItem( target, CLASS_NAMES.LAST_SELECTED_FILE );
		}
	}

	function selectMultipleFiles( startElement, endElement ) {
		let filesElement = document.querySelector( ".body > ." + CLASS_NAMES.FILES );
		let startElementRect = startElement.getBoundingClientRect();
		let endElementRect = endElement.getBoundingClientRect();
		let top = -1;
		let bottom = -1;
		if( startElementRect.top < endElementRect.top ) {
			top = startElementRect.top;
		} else {
			top = endElementRect.top;
		}
		if( startElementRect.bottom > endElementRect.bottom ) {
			bottom = startElementRect.bottom;
		} else {
			bottom = endElementRect.bottom;
		}
		let x = startElementRect.left + startElementRect.width / 2;
		for( let y = top; y < bottom; y += 5 ) {
			let element = util.getClickableTarget( document.elementFromPoint( x, y ), filesElement );
			if( element.dataset.fileType !== FILE_TYPE_FOLDER ) {
				element.classList.add( CLASS_NAMES.SELECTED_FILE );
			}
		}

		// Check if every element in folders are selected
		let parentFolders = new Set();
		document.querySelectorAll( "." + CLASS_NAMES.SELECTED_FILE ).forEach( ( element ) => {
			parentFolders.add( element.parentElement );
		} );

		// Loop through all parent elements
		for( let parentFolderElement of parentFolders ) {
			let allListItems = parentFolderElement.querySelectorAll( "li" );
			let selectedListItems = parentFolderElement.querySelectorAll( "." + CLASS_NAMES.SELECTED_FILE );
			if( allListItems.length === selectedListItems.length ) {
				parentFolderElement.parentElement.classList.add( CLASS_NAMES.SELECTED_FILE );
			}
		}
	}

	function selectFile( target ) {
		util.selectItem( target, CLASS_NAMES.SELECTED_FILE );
		let file = m_fileLookup[ target.dataset.fileId ];

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
				getFolders( name + "/" + folderContents[ i ].fullname, folderContents[ i ].content, folderArray );
			}
		}
	}

	function createFolderOptions( defaultFolderPath ) {
		let folders = [];
		getFolders( ROOT_NAME, m_files.content, folders );
		let folderOptions = "";
		for( let i = 0; i < folders.length; i++ ) {
			if( folders[ i ] === defaultFolderPath ) {
				folderOptions += "<option selected>" + folders[ i ] + "</option>";
			} else {
				folderOptions += "<option>" + folders[ i ] + "</option>";
			}
		}
		return folderOptions;
	}

	function findFileByFullname( fullname, folderContents, isRecursive ) {
		if( fullname === ROOT_NAME ) {
			return m_files;
		}
		for( let i = 0; i < folderContents.length; i++ ) {
			if( folderContents[ i ].fullname === fullname ) {
				return folderContents[ i ];
			}
			if( isRecursive && folderContents[ i ].type === FILE_TYPE_FOLDER ) {
				let folder = findFileByFullname( fullname, folderContents[ i ].content, isRecursive );
				if( folder ) {
					return folder;
				}
			}
		}
		return null;
	}

	function findFileByPath( path ) {
		if( path === ROOT_NAME ) {
			return m_files;
		}
		let parts = path.split( "/" );
		let folder = m_files;
		for( let i = 0; i < parts.length; i++ ) {			
			if( folder.type === FILE_TYPE_FOLDER ) {
				folder = findFileByFullname( parts[ i ], folder.content, false );
			} else {
				return null;
			}
			if( ! folder ) {
				return  null;
			}
		}
		return folder;
	}

	function getSelectedFiles() {
		let selectedFiles = [];
		document.querySelectorAll( "." + CLASS_NAMES.SELECTED_FILE ).forEach( ( selectedElement ) => {
			selectedFiles.push( m_fileLookup[ selectedElement.dataset.fileId ] );
		} );
		return selectedFiles;
	}

	function deleteSelectedFiles() {
		let selectedFiles = getSelectedFiles();
		for( let i = 0; i < selectedFiles.length; i++ ) {
			deleteFile( selectedFiles[ i ].fullpath );
		}
		if( selectedFiles.length > 0 ) {
			refreshFileView();
		}
	}

	function deleteFile( path ) {
		let file = findFileByPath( path );
		if( !file ) {
			return false;
		}
		let parent = findFileByPath( file.path );
		if( !parent ) {
			return false;
		}
		let recycledFile = {
			"content": null
		};
		if( file.type === FILE_TYPE_FOLDER ) {
			recycledFile.content = [];
			for( let i = 0; i < file.content.length; i++ ) {
				recycledFile.content.push( file.content[ i ].fullpath );
				deleteFile( file.content[ i ].fullpath );
			}
		} else {
			recycledFile.content = file.content;
		}

		if( file.model ) {
			recycledFile.content = file.model.getValue();
			file.model.dispose();
		}
		if( file.tab ) {
			m_tabsElement.closeTab( file.tab );
		}
		parent.content.splice( parent.content.indexOf( file ), 1 );
		delete m_fileLookup[ file.id ];

		m_recycleBin.push( recycledFile );
	}

	function moveFile( pathSrc, pathDest ) {
		let file = pathSrc;
		if( typeof pathSrc === "string" ) {
			file = findFileByPath( pathSrc );
		}
		if( !file ) {
			return "Source file not found.";
		}
		let parent = findFileByPath( file.path );
		if( !parent ) {
			return "Source folder not found.";
		}
		let newParent = findFileByPath( pathDest );
		if( !newParent ) {
			return "Destination folder not found.";
		}
		if( isSubfolder( file, newParent ) ) {
			return "Cannot move a folder into itself.";
		}
		let conflict = findFileByPath( pathDest + "/" + file.fullname );
		if( conflict ) {
			return "A file already exists in the destination folder with same name.";
		}

		parent.content.splice( parent.content.indexOf( file ), 1 );
		newParent.content.push( file );
		if( newParent.path === "" ) {
			file.path = newParent.fullname;	
		} else {
			file.path = newParent.path + "/" + newParent.fullname;
		}

		if( file.type === FILE_TYPE_FOLDER ) {
			repathFolder( file );
		}

		return true;
	}

	function isSubfolder( baseFolder, folder ) {
		if( baseFolder === folder ) {
			return true;
		}
		for( let i = 0; i < folder.content.length; i++ ) {
			if(
				folder.content[ i ].type === FILE_TYPE_FOLDER &&
				isSubfolder( baseFolder, folder.content[ i ] )
			) {
				return true;
			}			
		}
		return false;
	}

	function repathFolder( folder ) {
		let path = folder.path + "/" + folder.fullname;
		for( let i = 0; i < folder.content.length; i++ ) {
			folder.content[ i ].path = path;
			if( folder.content[ i ].type === FILE_TYPE_FOLDER ) {
				repathFolder( folder.content[ i ] );
			}
		}
	}

	// Update file view and options
	function refreshFileView() {
		let filesElement = document.querySelector( ".body > .files" );
		filesElement.innerText = "";
		createFileView( filesElement, m_files.content );
	}

	function createFileDialog( dialogType ) {
		let buttonText = "Create";
		let fileDialogTitle = "Create New File";
		let selectedFiles = null;
		let defaultName = "untitled";
		let defaultFolderName = ROOT_NAME;
		let defaultFileType = FILE_TYPES[ 0 ];
		let excludedFileTypes = [];
		let selectedFile = null;

		// Check if we are editting the file or creating a new file
		if( dialogType === "edit" ) {

			// Need to make sure that a file was selected first
			if( ! m_lastFileClicked ) {
				layout.createPopup( "Notice", "Select a file to edit then try again." );
				return;
			}
			buttonText = "Update";

			//Populate list of all selected files --- do not need at this time
			//selectedFiles = [];
			//document.querySelectorAll( "." + CLASS_NAMES.SELECTED_FILE ).forEach( ( selectedElement ) => {
			//	selectedFiles.push( m_fileLookup[ selectedElement.dataset.fileId ] );
			//} );

			// Get the last file selected in case of multi-selection
			selectedFile = m_fileLookup[ m_lastFileClicked.dataset.fileId ];

			// Setup the defaults
			defaultName = selectedFile.name;
			fileDialogTitle = "Update File: " + selectedFile.fullname;
			defaultFileType = selectedFile.type;
			defaultFolderName = selectedFile.path;
			if( defaultFileType === FILE_TYPE_FOLDER ) {
				for( let i = 0; i < FILE_TYPES.length; i++ ) {
					if( FILE_TYPES[ i ] !== FILE_TYPE_FOLDER ) {
						excludedFileTypes.push( FILE_TYPES[ i ] );
					}
				}
			} else {
				excludedFileTypes.push( FILE_TYPE_FOLDER );
			}
		}
		// Removed because we are doing a modal popup and can only have one popup at a time
		//let popup = document.querySelector( ".popup" );
		//if( popup ) {
		//	popup.focus();
		//	return;
		//}

		// Create the popup contents
		let div = document.createElement( "div" );
		let typeOptions = "";
		for( let i = 0; i < FILE_TYPES.length; i++ ) {
			if( excludedFileTypes.indexOf( FILE_TYPES[ i ] ) > -1 ) {
				continue;
			}
			if( FILE_TYPES[ i ] === defaultFileType ) {
				typeOptions += "<option selected>" + FILE_TYPES[ i ] + "</option>";
			} else {
				typeOptions += "<option>" + FILE_TYPES[ i ] + "</option>";
			}
		}
		let folderOptions = createFolderOptions( defaultFolderName );

		// Build the HTML
		div.className = "new-file-popup";
		div.innerHTML = "<p>" +
			"<span>File Type:</span>&nbsp;&nbsp;" +
			"<select id='new-file-language'>" + typeOptions + "</select>" +
			"</p><p>" +
			"<span>File Name:</span>&nbsp;&nbsp;" +
			"<input id='new-file-name' type='text' value='" + defaultName + "' /> " +
			"<span id='new-file-extension'>" + FILE_TYPE_EXTENSIONS[ defaultFileType ] + "</span>" + 
			"</p><p>" +
			"<span>Folder:</span>&nbsp;&nbsp;" +
			"<select id='new-file-folder'>" + folderOptions + "</select>" +
			"</p><p id='new-file-message'>&nbsp;</p>";

		// When a file name has changed
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

		// When the language has changed
		div.querySelector( "#new-file-language" ).addEventListener( "change", function () {
			let language = div.querySelector( "#new-file-language" ).value;
			div.querySelector( "#new-file-extension" ).innerText = FILE_TYPE_EXTENSIONS[ language ];
		} );

		// Create the create/update button
		let createButton = document.createElement( "input" );
		createButton.classList.add( "button" );
		createButton.value = buttonText;
		createButton.type = "button";

		// When the create/update button is clicked
		createButton.addEventListener( "click", function () {

			// Get all input values
			let language = div.querySelector( "#new-file-language" ).value;
			let name = div.querySelector( "#new-file-name" ).value;
			let folderPath = div.querySelector( "#new-file-folder" ).value;
			let filePath = folderPath + "/" + name + FILE_TYPE_EXTENSIONS[ language ];
			let divMsg = document.getElementById( "new-file-message" );
			let defaultOp = "Created file: ";

			// If we are doing an update instead of create
			if( dialogType === "edit" ) {

				// Find the destination file in case the location is different
				let searchForFile = findFileByPath( filePath );
				if( searchForFile ) {

					// If there already is a file in the destination folder with the same name
					// and it isn't the same file
					if( searchForFile !== selectedFile ) {
						divMsg.classList.remove( "msg-success" );
						divMsg.classList.add( "msg-error" );
						divMsg.innerText =  filePath + " already exists.";
						return false;
					} else {

						// No need to move the file since it's already in the destination folder
						selectedFile.name = name;
						selectedFile.fullname = name + FILE_TYPE_EXTENSIONS[ language ];
						selectedFile.language = language;
						if( selectedFile.type === FILE_TYPE_FOLDER ) {
							repathFolder( selectedFile );
						}
						defaultOp = "Updated file: ";
					}
				} else {

					// Store temp values in case move fails
					let tempName = selectedFile.name;
					let tempFullname = selectedFile.fullname;
					let tempLanguage = selectedFile.language;

					selectedFile.name = name;
					selectedFile.fullname = name + FILE_TYPE_EXTENSIONS[ language ];
					selectedFile.language = language;

					// Only move if the path is different
					if( selectedFile.path !== folderPath ) {
						let moveStatus = moveFile( selectedFile, folderPath );
						if( moveStatus !== true ) {
							selectedFile.name = tempName;
							selectedFile.fullname = tempFullname;
							selectedFile.language = tempLanguage;

							divMsg.classList.remove( "msg-success" );
							divMsg.classList.add( "msg-error" );
							divMsg.innerText =  "Move failed: " + moveStatus;
							return false;
						}
						defaultOp = "Moved file to: ";
					} else {
						defaultOp = "Updated file: ";
					}
				}
			} else {

				// Create file

				// Check if file already exists
				if( findFileByPath( filePath ) ) {
					divMsg.classList.remove( "msg-success" );
					divMsg.classList.add( "msg-error" );
					divMsg.innerText =  filePath + " already exists.";
					return false;
				}

				let parent = findFileByPath( folderPath );
				let parentFolder = parent.content;
				let content = "";
				if( language === FILE_TYPE_FOLDER ) {
					content = [];
				}

				// Create the file
				let file = {
					"name": name,
					"type": language,
					"content": content
				};
				parentFolder.push( file );
				if( parent.path === "" ) {
					createFile( file, ROOT_NAME );
				} else {
					createFile( file, parent.path + "/" + parent.fullname );
				}
			}

			refreshFileView();

			divMsg.classList.remove( "msg-error" );
			divMsg.classList.add( "msg-success" );
			divMsg.innerText = defaultOp + filePath;
			if( language === FILE_TYPE_FOLDER ) {
				div.querySelector( "#new-file-folder" ).innerHTML = createFolderOptions();
			}
		} );
		layout.createPopup( fileDialogTitle, div, { "extraButtons": [ createButton ], "okText": "Close" } );
	}

	function createUploadDialog( files ) {
		console.log( files );
		let div = document.createElement( "div" );
		let folderOptions = createFolderOptions();
		let freespaceMB = ( storage.getFreeSpace() / 1048576 ).toFixed( 2 ) + " MB";
		div.innerHTML = "<p><input id='fileUploads' type='file' accept='image/*,.js,.zip' multiple></p>" +
			"<p>Storage Available: " + freespaceMB + "</p>" +
			"<p>File(s) Size: <span id='fileSize'></span></p>" +
			"<p id='fileMessage'></p>" +
			"<p><span>Upload to Folder:</span>&nbsp;&nbsp;" +
			"<select id='new-file-folder'>" + folderOptions + "</select>" + "</p>";
		layout.createPopup( "Upload a File", div, {
			"okCommand": function () {
				return true;
			},
			"cancelCommand": function () {

			}
		} );
		if( files ) {
			div.querySelector( "#fileUploads" ).files = files;
			checkFiles( div, files );
		}
		div.querySelector( "#fileUploads" ).addEventListener( "change", () => checkFiles( div ) );
	}

	function checkFiles( div ) {
		let files = div.querySelector( "#fileUploads" ).files;
		let fileSize = calculateFilesSize( files );
		let freespace = storage.getFreeSpace();
		let freespaceMB = ( freespace / 1048576 ).toFixed( 2 ) + " MB";
		div.querySelector( "#fileSize" ).innerText = ( fileSize / 1048576 ).toFixed( 2 ) + " MB";
		let okBtn = div.parentElement.querySelector( ".popup-ok" );
		if( fileSize > freespace ) {
			div.querySelector( "#fileMessage" ).innerText = "Total size of files is above the max size of " +
				freespaceMB + ". If you have large images you can try to shrink the images or " +
				"increase the image compression.";
			okBtn.setAttribute( "disabled", true );
		} else {
			div.querySelector( "#fileMessage" ).innerText = "";
			okBtn.removeAttribute( "disabled" );
		}
	}

	function calculateFilesSize( files ) {
		let totalBytes = 0;
		Array.from( files ).forEach( ( file ) => {
			totalBytes += file.size;
		} );
		return totalBytes;
	}

} )();
