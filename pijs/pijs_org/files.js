/* global monaco */
/* global editor */

"use strict";

var file = ( function () {
	const HTML_TEMPLATE = "" +
`
<!DOCTYPE html>
<html lang="en">
	<head>
		<title>[TITLE]</title>
		<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
		<style>
			body {
				background-color: black;
			}
		</style>
	</head>
	<body>
		[SCRIPTS]
	</body>
</html>
`;
	const OPEN_FOLDER_ENTITY = "&darr;";
	const CLOSED_FOLDER_ENTITY = "&rarr;"
	const FILE_TYPE_FOLDER = "folder";
	const FILE_TYPE_HTML = "html";
	const FILE_TYPE_STYLE = "css";
	const FILE_TYPE_SCRIPT = "javascript";
	const FILE_TYPE_IMAGE = "image";
	const FILE_TYPE_AUDIO = "audio";
	const FILE_TYPES = [
		FILE_TYPE_SCRIPT, FILE_TYPE_FOLDER
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
	const SAVE_DELAY = 3000;
	const MB_SIZE = 1048576;
	const KB_SIZE = 1024;

	let m_files = { 
		"name": ROOT_NAME,
		"fullname": ROOT_NAME,
		"type": FILE_TYPE_FOLDER,
		"path": "",
		"extension": "",
		"isChanged": true,
		"content": [
			{
				"name": "main",
				"fullname": "main.js",
				"type": FILE_TYPE_SCRIPT,
				"path": "root",
				"extension": ".js",
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
			}
		]
	};
	let m_fileLookup = {};
	let m_lastFileId = 0;
	let m_lastFileClicked;
	let m_recycleBin = [];
	let m_tabsElement = null;
	let m_saveTimeout = null;
	let m_failedLastSave = false;
	let m_projectSettings = {
		"name": "untitled",
		"width": 800,
		"height": 600
	};
	let m_hasProjectRun = false;
	let m_zipFileUploads = null;

	return {
		"init": init,
		"createUploadDialog": createUploadDialog,
		"getFileName": getFileName
	};

	function init() {
		main.addMenuItem(
			"File", "Project Settings", "Manage project settings.", "Ctrl+P", { "key": "P", "ctrlKey": true },
			[ monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP ], createProjectSettingsDialog
		);
		main.addMenuItem(
			"File", "Run", "Uploads your files and runs in a seperate window.", "Ctrl+R", { "key": "R", "ctrlKey": true },
			[ monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR ], function () { runProgram( false, true ); }
		);
		main.addMenuItem(
			"File", "Update Program", "Uploads your files but doesn't open a new window.", "Ctrl+U", { "key": "U", "ctrlKey": true },
			[ monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyU ], updateProgram
		);
		main.addMenuItem(
			"File", "Create new file", "New file dialog.", "Ctrl+G", { "key": "G", "ctrlKey": true },
			[ monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG ], function() { createFileDialog( "create" );
		} );
		main.addMenuItem(
			"File", "Edit/Update file", "Edit file dialog.", "Ctrl+E", { "key": "E", "ctrlKey": true },
			[ monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE ], function () { createFileDialog( "edit" ); }
		);
		main.addMenuItem(
			"File", "Upload file", "Upload a file to your project.", "Ctrl+L", { "key": "L", "ctrlKey": true },
			[ monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL ], createUploadDialog
		);	
		main.addMenuItem(
			"File", "Delete file", "Delete a file from your project.", "DEL", { "key": "DELETE", "ctrlKey": false },
			null, deleteSelectedFiles
		);

		let filesElement = document.querySelector( ".body > ." + CLASS_NAMES.FILES );
		m_tabsElement = layout.createTabsElement(
			document.querySelector( "." + CLASS_NAMES.MAIN_EDITOR_TABS ),
			function ( tab ) {
				let file = m_fileLookup[ parseInt( tab.dataset.fileId ) ];
				util.selectItem( tab, CLASS_NAMES.SELECTED_TAB );
				fileSelected( file );
				editor.resize();
			}
		);
		let dataStr = localStorage.getItem( "projectData" );
		if( dataStr ) {
			let data = JSON.parse( dataStr );
			m_files = data.files;
			m_projectSettings = data.settings;
		}
		initFiles( m_files.content, m_files.fullname );
		createFileView( filesElement, m_files.content, true );
		filesElement.addEventListener( "click", clickFiles );
		storage.onReady( function () {
			updateFreespace();
		} );
	}

	function getFileName( id ) {
		let file = m_fileLookup[ parseInt( id ) ];
		return file.fullname;
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

	function runProgram( noRun, getOnlyRecentChanges ) {
		if( getOnlyRecentChanges === undefined ) {
			getOnlyRecentChanges = true;
		}
		let data = {
			"action": "run",
			"files": getFilesForSave( getOnlyRecentChanges ),
			"title": m_projectSettings.name,
			"has_project_run": m_hasProjectRun
		};
		$.post( "app.php", data, function ( dataReturn ) {
			if( dataReturn.needsRefresh ) {
				runProgram( noRun, false );
				return;
			}
			m_hasProjectRun = true;
			resetFilesChanged( m_files );
			let url = dataReturn.url;
			if( !noRun && url ) {
				let settings = "width=" + m_projectSettings.width + ", height=" + m_projectSettings.height + " top=200,left=200";
				let w = window.open( url, "_blank", settings );
				w.focus();
			}
		} );
	}

	function updateProgram() {
		runProgram( true, true );
	}

	function createFile( file, path ) {
		let fileId = ++m_lastFileId;
		file.id = fileId;
		file.path = path;
		if( !file.fullname ) {
			file.fullname = file.name + file.extension;
		}
		file.fullpath = file.path + "/" + file.fullname;
		file.isChanged = true;
		m_fileLookup[ fileId ] = file;
	}

	function createFileView( element, folder, init, isHidden ) {
		let ul = document.createElement( "ul" );
		let selectedFile = null;

		if( isHidden ) {
			ul.style.display = "none";
		}
		folder.sort( function ( a, b ) {
			if ( a.type === FILE_TYPE_FOLDER && b.type === FILE_TYPE_FOLDER ) {
				return a.fullname.localeCompare( b.fullname );
			} else if( a.type === FILE_TYPE_FOLDER ) {
				return -1;
			} else if( b.type === FILE_TYPE_FOLDER ) {
				return 1;
			} else {
				return a.fullname.localeCompare( b.fullname );
			}
		} );
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
				createFileView( li, file.content, init, file.minimized );
			} else {
				span.innerText = file.fullname;
				if( init && file.isOpen ) {
					if( file.isOpen ) {
						openFile( file );
					}
					if( file.isSelected ) {
						selectedFile = file;
					}
				}
			}
			ul.appendChild( li );
		}
		element.appendChild( ul );
		if( selectedFile ) {
			openFile( selectedFile );
		}
	}

	function openFile( file ) {
		file.tab = m_tabsElement.createTab( { "id": file.id, "name": file.fullname } );
		fileSelected( file );
		editor.resize();
	}

	function fileSelected( file ) {
		if( file.type === FILE_TYPE_SCRIPT ) {
			$( ".main-image-viewer" ).hide();
			$( ".main-audio-viewer" ).hide();
			$( ".main-editor-body" ).show();
			if( !file.model ) {
				file.model = editor.createModel( file.content, file.type );
				file.model.onDidChangeContent( function () {
					file.content = file.model.getValue();
					file.isChanged = true;
					saveFiles();
				} );
			}
			editor.setModel( file.model );
		} else if( file.type === FILE_TYPE_IMAGE ) {
			let $imageViewer = $( ".main-image-viewer" );
			if( $imageViewer.data( "file" ) === file.fullpath ) {
				$( ".main-editor-body" ).hide();
				$( ".main-audio-viewer" ).hide();
				$imageViewer.show();
			} else {
				$( ".main-editor-body" ).hide();
				$( ".main-audio-viewer" ).hide();
				$imageViewer.html( "" ).show();
				let img = new Image();
				img.onload = function () {
					if( img.naturalWidth < $imageViewer.width() ) {
						img.style.imageRendering = "pixelated";
					}
				}
				img.src = file.content;
				img.style.width = "100%";
				img.style.height = "100%";
				img.style.objectFit = "contain";
				$imageViewer.append( img );
				$imageViewer.data( "file", file.fullpath );
			}
		} else if( file.type === FILE_TYPE_AUDIO ) {
			$( ".main-image-viewer" ).hide();
			$( ".main-editor-body" ).hide();
			$( "#main-audio-player" ).get( 0 ).src = file.content;
			$( ".main-audio-viewer" ).show();
		}
		saveFiles();
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
		let file = m_fileLookup[ parseInt( target.dataset.fileId ) ];

		// Toggle the folder Open/Closed
		if( target.dataset.fileType === FILE_TYPE_FOLDER ) {
			let ul = target.children[ 1 ];
			if( ul.style.display === "none" ) {
				ul.style.display = "";
				updateFolderName( target, file, true );
				file.minimized = false;
			} else {
				ul.style.display = "none";
				updateFolderName( target, file, false );
				file.minimized = true;
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

	function createFileFromPath( filePath, fileData ) {
		var currentFolder, parts, name, i, temp, path;

		if( typeof filePath !== "string" ) {
			return "Invalid Filename";
		}

		fileData.path = filePath;
		currentFolder = m_files;
		path = "";

		// Create the folders
		parts = filePath.split( "/" );
		for( i = 0; i < parts.length; i++ ) {
	
			if( parts[ i ] === "" ) {
				continue;
			}
		
			name = parts[ i ];
			if( name === ROOT_NAME ) {
				path = name;
			} else {
				path += "/" + name;	
			}

			// Check if part is a folderName
			if( i !== parts.length - 1 ) {
	
				// If it's a new folder then create it
				if( ! findFileByPath( path ) ) {
	
					// Create the folder file
					temp = {
						"name": name,
						"fullname": name,
						"extension": "",
						"type": FILE_TYPE_FOLDER,
						"content": []
					};
					createFile( temp, path.substr( 0, path.lastIndexOf( "/" ) ) );
					currentFolder.content.push( temp );
					currentFolder = temp;
				} else {
					currentFolder = findFileByPath( path );
				}
	
			} else {
	
				// Set the file name part to the file data
				fileData.name = name;
			}
		}

		// Create the file
		createFile( fileData, filePath.substr( 0, filePath.lastIndexOf( "/" ) ) );
		currentFolder.content.push( fileData );

		return fileData;
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
			selectedFiles.push( m_fileLookup[ parseInt( selectedElement.dataset.fileId ) ] );
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

		file.isChanged = true;
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
			folder.content[ i ].isChanged = true;
			if( folder.content[ i ].type === FILE_TYPE_FOLDER ) {
				repathFolder( folder.content[ i ] );
			}
		}
	}

	function refreshFileView() {
		let $filesElement = $( ".files" );
		$filesElement.find( "ul" ).remove();
		createFileView( $filesElement.get( 0 ), m_files.content );
		m_tabsElement.refreshTabs();
		saveFiles( 100 );
	}

	function createProjectSettingsDialog() {
		let div = document.createElement( "div" );

		div.innerHTML = "<p>" +
			"<span>Name:</span>&nbsp;&nbsp;" +
			"<input id='project-name' type='text' value='" + m_projectSettings.name + "' /> " +
			"</p><p>" +
			"<span>Window Width:</span>&nbsp;&nbsp;" +
			"<input id='project-width' type='number' value='" + m_projectSettings.width + "' /> " +
			"</p><p>" +
			"<span>Window Height:</span>&nbsp;&nbsp;" +
			"<input id='project-height' type='number' value='" + m_projectSettings.height + "' />" +
			"</p><p>" +
			"<input id='btn-download-project' type='button' value='Download Project' class='button button-wide' />" +
			"</p>";

		layout.createPopup( "Project Settings", div, { "okCommand": function () {
			updateProjectSettings();
			saveFiles( 100 );
			return true;
		}, "cancelCommand": function () {} } );

		$( "#btn-download-project" ).on( "click", function () {
			updateProjectSettings();
			let indexHtml = HTML_TEMPLATE.replace( "[TITLE]", m_projectSettings.name );
			let scripts = [ "<script src='https://pijs.org/qbs.js'></script>" ];
			let zip = new JSZip();
			zipProjectFiles( m_files, zip, scripts, "" );
			indexHtml = indexHtml.replace( "[SCRIPTS]", scripts.join( "\n\t\t" ) );
			zip.file( "index.html", indexHtml );
			zip.generateAsync( { type: "blob" } )
				.then( function( content )  {
				    saveAs( content, "PIJS_PROJECT_" + m_projectSettings.name + ".zip" );
				} );
		} );

		function zipProjectFiles( file, zip, scripts, folder ) {
			if( file.type === FILE_TYPE_FOLDER ) {
				for( let i = 0; i < file.content.length; i++ ) {
					let path = "";
					if( file.name === ROOT_NAME ) {
						path = "";
					} else if( folder === "" ) {
						path = file.name;
					} else {
						path = folder + "/" + file.name;
					}
					zipProjectFiles( file.content[ i ], zip, scripts, path );
				}
			} else {
				let filename = "";
				if( folder === "" ) {
					filename = file.fullname;
				} else {
					filename = folder + "/" + file.fullname;
				}
				if( file.type === FILE_TYPE_IMAGE || file.type === FILE_TYPE_AUDIO ) {
					let content = file.content.substr( file.content.indexOf( "base64," ) + "base64,".length );
					zip.file( filename, content, { "base64": true } );	
				} else {
					zip.file( filename, file.content );
					scripts.push( "<script src='" + filename + "'></script>" );
				}				
			}
		}

		function updateProjectSettings() {
			m_projectSettings.name = div.querySelector( "#project-name" ).value;
			m_projectSettings.width = parseInt( div.querySelector( "#project-width" ).value );
			m_projectSettings.height = parseInt( div.querySelector( "#project-height" ).value );
		}
	}

	function createFileDialog( dialogType ) {
		let buttonText = "Create";
		let fileDialogTitle = "Create New File";
		let selectedFiles = null;
		let defaultName = "untitled";
		let defaultFolderName = ROOT_NAME;
		let defaultFileType = FILE_TYPES[ 0 ];
		let defaultExtension = FILE_TYPE_EXTENSIONS[ defaultFileType ];
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
			//	selectedFiles.push( m_fileLookup[ parseInt( selectedElement.dataset.fileId ) ] );
			//} );

			// Get the last file selected in case of multi-selection
			selectedFile = m_fileLookup[ parseInt( m_lastFileClicked.dataset.fileId ) ];

			// Setup the defaults
			defaultName = selectedFile.name;
			fileDialogTitle = "Update File: " + selectedFile.fullname;
			defaultFileType = selectedFile.type;
			defaultFolderName = selectedFile.path;
			defaultExtension = selectedFile.extension;
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

		let divContent = "";
		if( dialogType !== "edit" ) {
			divContent += "<p>" +
				"<span>File Type:</span>&nbsp;&nbsp;" +
				"<select id='new-file-language'>" + typeOptions + "</select>" +
				"</p>";
		}

		divContent += "<p>" +
			"<span>File Name:</span>&nbsp;&nbsp;" +
			"<input id='new-file-name' type='text' value='" + defaultName + "' /> " +
			"<span id='new-file-extension'>" + defaultExtension + "</span>" + 
			"</p><p>" +
			"<span>Folder:</span>&nbsp;&nbsp;" +
			"<select id='new-file-folder'>" + folderOptions + "</select>" +
			"</p><p id='new-file-message'>&nbsp;</p>";
		
		div.innerHTML = divContent;

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

		let language = defaultFileType;

		if( dialogType !== "edit" ) {
			// When the language has changed
			div.querySelector( "#new-file-language" ).addEventListener( "change", function () {
				language = div.querySelector( "#new-file-language" ).value;
				div.querySelector( "#new-file-extension" ).innerText = FILE_TYPE_EXTENSIONS[ language ];
			} );
		}

		// Create the create/update button
		let createButton = document.createElement( "input" );
		createButton.classList.add( "button" );
		createButton.value = buttonText;
		createButton.type = "button";

		// When the create/update button is clicked
		createButton.addEventListener( "click", function () {

			// Get all input values
			if( dialogType !== "edit" ) {
				language = div.querySelector( "#new-file-language" ).value;
			}
			let name = div.querySelector( "#new-file-name" ).value;
			let folderPath = div.querySelector( "#new-file-folder" ).value;
			let fileExtension = FILE_TYPE_EXTENSIONS[ language ];
			let filePath = folderPath + "/" + name + fileExtension;
			let divMsg = document.getElementById( "new-file-message" );
			let defaultOp = "Created file: ";

			// If we are doing an update instead of create
			if( dialogType === "edit" ) {

				if( fileExtension === undefined ) {
					fileExtension = selectedFile.extension;
					filePath = folderPath + "/" + name + fileExtension;
				}

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
						selectedFile.fullname = name + fileExtension;
						selectedFile.isChanged = true;
						if( selectedFile.type === FILE_TYPE_FOLDER ) {
							repathFolder( selectedFile );
						}
						defaultOp = "Updated file: ";
					}
				} else {

					// Store temp values in case move fails
					let tempName = selectedFile.name;
					let tempFullname = selectedFile.fullname;
					let tempExtension = selectedFile.extension;

					selectedFile.name = name;
					selectedFile.fullname = name + fileExtension;
					selectedFile.extension = fileExtension;
					selectedFile.isChanged = true;

					// Only move if the path is different
					if( selectedFile.path !== folderPath ) {
						let moveStatus = moveFile( selectedFile, folderPath );
						if( moveStatus !== true ) {
							selectedFile.name = tempName;
							selectedFile.fullname = tempFullname;
							selectedFile.extension = tempExtension;

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
					"content": content,
					"extension": fileExtension
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
		let div = document.createElement( "div" );
		let folderOptions = createFolderOptions();
		let freespaceMB = getMbKb( storage.getFreeSpace() );
		div.innerHTML = "<p><input id='fileUploads' type='file' accept='audio/*,image/*,.js,.zip' multiple></p>" +
			"Storage Available: " + freespaceMB + "<br />" +
			"File(s) Selected: <span id='fileCount'></span><br />" +
			"Zipped File(s): <span id='zippedFiles'></span><br />" +
			"Total Size: <span id='fileSize'></span><br />" +
			"<p id='fileMessage'></p>" +
			"<p><span>Upload to Folder:</span>&nbsp;&nbsp;" +
			"<select id='new-file-folder'>" + folderOptions + "</select>" + "</p>";
		layout.createPopup( "Upload a File", div, {
			"okCommand": function () {
				let folderPath = div.querySelector( "#new-file-folder" ).value;
				let files = div.querySelector( "#fileUploads" ).files;				
				Array.from( files ).forEach( ( file ) => {
					saveUploadedFile( file, folderPath );
				} );
				for( let i = 0; i < m_zipFileUploads.length; i++ ) {
					saveUploadedZipFile( m_zipFileUploads[ i ], folderPath );
				}
				m_zipFileUploads = null;
				return true;
			},
			"cancelCommand": function () {
				m_zipFileUploads = null;
			}
		} );
		if( files ) {
			div.querySelector( "#fileUploads" ).files = files;
			checkFiles( div, true );
		}
		div.querySelector( "#fileUploads" ).addEventListener( "change", () => checkFiles( div, true ) );
	}

	function getMbKb( size ) {
		if( size < KB_SIZE * 100 ) {
			return ( size / KB_SIZE ).toFixed( 2 ) + " KB";
		} else {
			return ( size / MB_SIZE ).toFixed( 2 ) + " MB";
		}
	}

	function saveUploadedZipFile( file, folderPath ) {
		let name = file.name;
		let extension = name.substr( name.lastIndexOf( "." ) );
		if( name.indexOf( "/" ) === -1 ) {
			name = file.name;
		} else {
			folderPath = folderPath + "/" + name.substr( 0, name.lastIndexOf( "/" ) );
			name = name.substr( -( name.length - name.lastIndexOf( "/" ) - 1 ) );
		}
		name = name.substr( 0, name.lastIndexOf( "." ) );
		addNewUploadedFile( name, folderPath, extension, file.content, file.type );
	}

	function saveUploadedFile( uploadedFile, folderPath ) {
		let type = "";
		let reader = new FileReader ();

		if( uploadedFile.type.indexOf( "javascript" ) > -1 ) {
			type = FILE_TYPE_SCRIPT;
		} else if( uploadedFile.type.indexOf( "image" ) > -1 ) {
			type = FILE_TYPE_IMAGE;
		} else if( uploadedFile.type.indexOf( "audio" ) > -1 ) {
			type = FILE_TYPE_AUDIO;
		}

		// Runs after image is loaded
		reader.onloadend = function ( ev ) {
			let name = uploadedFile.name.substring( 0, uploadedFile.name.lastIndexOf( "." ) );
			let content = reader.result;
			let imageType = null;
			let audioType = null;
			let extension = ".js";
			if( type === FILE_TYPE_IMAGE ) {
				imageType = content.substring( content.indexOf( "data:" ) + 5, content.indexOf( ";" ) );
				extension = getExtensionFromImageType( imageType );
			}
			if( type === FILE_TYPE_AUDIO ) {
				audioType = content.substring( content.indexOf( "data:" ) + 5, content.indexOf( ";" ) );
				extension = getExtensionFromAudioType( audioType );
			}

			addNewUploadedFile( name, folderPath, extension, content, type );
		};
		if( type === "javascript" ) {
			reader.readAsText( uploadedFile );
		} else {
			reader.readAsDataURL( uploadedFile );
		}
	}

	function addNewUploadedFile( name, folderPath, extension, content, type ) {
		let fullname = name + extension;
		let filePath = folderPath + "/" + fullname;
		let parent = findFileByPath( folderPath );
		if( !parent ) {
			let shortname = folderPath.substr( folderPath.lastIndexOf( "/" ) + 1 );
			parent = createFileFromPath( folderPath, {
				"extension": "",
				"name": shortname,
				"fullname": shortname,
				"type": FILE_TYPE_FOLDER,
				"content": []
			} );
		}
		let parentFolder = parent.content;
		let searchForFile = findFileByPath( filePath );
		let index = 0;
		while( searchForFile ) {
			name = getUpdatedName( name, ++index );
			fullname = name + extension;
			filePath = folderPath + "/" + fullname;
			searchForFile = findFileByPath( filePath );
		}

		let newFile = {
			"name": name,
			"fullname": fullname,
			"type": type,
			"content": content,
			"extension": extension
		};
		parentFolder.push( newFile );
		if( parent.path === "" ) {
			createFile( newFile, ROOT_NAME );
		} else {
			createFile( newFile, parent.path + "/" + parent.fullname );
		}
		refreshFileView();
	}

	function getExtensionFromImageType( imageType ) {
		let extensions = {
			"image/bmp": ".bmp",
			"image/gif": ".gif",
			"image/jpeg": ".jpg",
			"image/png": ".png",
			"image/webp": ".webp"
		};
		if( extensions[ imageType ] ) {
			return extensions[ imageType ];	
		}
		return extensions[ "image/png" ];
	}

	function getTypeFromExtension( fileExtension ) {
		let mimeTypes = {
			".bmp": "image/bmp",
			".gif": "image/gif",
			".jpg": "image/jpeg",
			".png": "image/png",
			".webp": "image/webp",
			".wav": "audio/wav",
			".webm": "audio/webm",
			".ogg": "audio/ogg",
			".mp3": "audio/mpeg",
			".mid": "audio/mid",
			".mp4": "audio/mp4"
		};

		return mimeTypes[ fileExtension ];	
	}

	function getFileTypeFromExtension( fileExtension ) {
		let mimeTypes = {
			".bmp": FILE_TYPE_IMAGE,
			".gif": FILE_TYPE_IMAGE,
			".jpg": FILE_TYPE_IMAGE,
			".png": FILE_TYPE_IMAGE,
			".webp": FILE_TYPE_IMAGE,
			".wav": FILE_TYPE_AUDIO,
			".webm": FILE_TYPE_AUDIO,
			".ogg": FILE_TYPE_AUDIO,
			".mp3": FILE_TYPE_AUDIO,
			".mid": FILE_TYPE_AUDIO,
			".mp4": FILE_TYPE_AUDIO
		};

		return mimeTypes[ fileExtension ];	
	}

	function getExtensionFromAudioType( audioType ) {
		let extensions = {
			"audio/wave": ".wav",
			"audio/wav": ".wav",
			"audio/x-wav": ".wav",
			"audio/x-pn-wav": ".wav",
			"audio/webm": ".webm",
			"audio/ogg": ".ogg",
			"audio/mpeg": ".mp3",
			"audio/mid": ".mid",
			"audio/mp4": ".mp4"
		};
		if( extensions[ audioType ] ) {
			return extensions[ audioType ];	
		}
		return extensions[ "audio/mpeg" ];
	}

	function getUpdatedName( name, index ) {
		if( name.lastIndexOf( "." ) === -1 ) {
			return name + "_" + ( index + "" ).padStart( 3, "0" );
		}
		let extension = name.substring( name.lastIndexOf( "." ) );
		return name.substring( 0, name.lastIndexOf( "." ) ) + "_" + ( index + "" ).padStart( 3, "0" ) + extension;
	}

	function checkFiles( div, resetZipFiles ) {
		let files = div.querySelector( "#fileUploads" ).files;
		let msg = "";

		// Check for zip files - don't check rest of files until
		if( resetZipFiles ) {
			m_zipFileUploads = [];
			if( checkZipFiles( files, div ) ) {
				return;
			}
		}

		div.querySelector( "#zippedFiles" ).innerText = m_zipFileUploads.length;

		// Check the file types
		let filesData = checkFileTypes( files );
		if( files.length !== filesData.good.length ) {
			for( let i = 0; i < filesData.bad.length; i++ ) {
				msg += "<span class='msg-error'>Unable to upload file: </span>" + filesData.bad[ i ].name + ".<br />";
			}
			let list = new DataTransfer();
			for( let i = 0; i < filesData.good.length; i++ ) {
				list.items.add( filesData.good[ i ] );
			}
			div.querySelector( "#fileUploads" ).files = list.files;
			files = list.files;
		}

		div.querySelector( "#fileCount" ).innerText = filesData.good.length;

		let fileSize = calculateFilesSize( files );
		let freespace = storage.getFreeSpace();
		let totalCapacity = storage.getTotalCapacity();
		let totalCapacityMB = "5 MB";
		if( !isNaN( totalCapacity ) ) {
			totalCapacityMB = getMbKb( totalCapacity );
		}
		div.querySelector( "#fileSize" ).innerText = getMbKb( fileSize );
		let okBtn = div.parentElement.querySelector( ".popup-ok" );
		if( fileSize > freespace ) {
			msg += "<span class='msg-error'>Total size of files is above the max size of " +
			totalCapacityMB + ". If you have large images you can try to shrink the images or " +
				"increase the image compression.</span><br />";
			okBtn.setAttribute( "disabled", true );
		} else {
			okBtn.removeAttribute( "disabled" );
		}

		div.querySelector( "#fileMessage" ).innerHTML = msg;
	}

	function checkZipFiles( files, div ) {
		let timeout = 0;
		let foundZipFile = false;

		Array.from( files ).forEach( ( file ) => {
			const extensions = [
				".bmp", ".gif", ".jpg", ".png", ".webp", ".wav",
				".webm", ".ogg", ".mp3", ".mid", ".mp4"
			];
			if( file.type === "application/zip" ) {
				foundZipFile = true;
				JSZip.loadAsync( file ).then( function( zip ) {
					zip.forEach( function( relativePath, zipEntry ) {
						if( ! zipEntry.dir ) {
							if( zipEntry.name.endsWith( ".js" ) ) {
								zip.file( zipEntry.name ).async( "string" ).then( function( data ) {
									m_zipFileUploads.push( { "name": zipEntry.name, "content": data, "type": FILE_TYPE_SCRIPT } );
									clearTimeout( timeout );
									timeout = setTimeout( () => checkFiles( div, false ), 100 );
								} );
							} else {
								zip.file( zipEntry.name ).async( "base64" ).then( function( data ) {
									let content = "";
									let fileType = "";
									for( let j = 0; j < extensions.length; j++ ) {
										if( zipEntry.name.endsWith( extensions[ j ] ) ) {
											fileType = getFileTypeFromExtension( extensions[ j ] );
											content = "data:" + getTypeFromExtension( extensions[ j ] ) + ";base64," + data;
										}
									}
									if( content !== "" ) {
										m_zipFileUploads.push( { "name": zipEntry.name, "content": content, "type": fileType } );
									}
									clearTimeout( timeout );
									timeout = setTimeout( () => checkFiles( div, false ), 100 );
								} );
							}
						}
					} );
				} );
			}
		} );

		return foundZipFile;
	}

	function checkFileTypes( files ) {
		let badFiles = [];
		let goodFiles = [];
		Array.from( files ).forEach( ( file ) => {
			if( 
				file.type.indexOf( "javascript" ) === -1 &&
				file.type.indexOf( "image" ) === -1 &&
				file.type.indexOf( "audio" ) === -1
			) {
				if( file.type !== "application/zip" ) {
					badFiles.push( file );
				}
			} else {
				goodFiles.push( file );
			}
		} );
		return { "bad": badFiles, "good": goodFiles };
	}

	function calculateFilesSize( files ) {
		const BYTE_SIZE = str => new Blob([str]).size;
		let totalBytes = 0;
		Array.from( files ).forEach( ( file ) => {
			totalBytes += file.size;
		} );
		for( let i = 0; i < m_zipFileUploads.length; i++ ) {
			//const byte_Size = str => new Blob([str]).size;
			totalBytes += BYTE_SIZE( m_zipFileUploads[ i ].content );
		}
		return totalBytes;
	}

	function updateFreespace() {
		let $fileSizeRemaining = $( ".file-size-remaining" );

		if( m_failedLastSave ) {
			$fileSizeRemaining.text( "OVER" );
			$fileSizeRemaining.addClass( "msg-error" );
		} else {
			let freespace = storage.getFreeSpace();
			$fileSizeRemaining.text( getMbKb( freespace ) );	
			$fileSizeRemaining.removeClass( "msg-error" );
		}
	}

	function saveFiles( delay ) {
		if( isNaN( delay ) ) {
			delay = SAVE_DELAY;
		}
		clearTimeout( m_saveTimeout );
		updateFreespace();
		m_saveTimeout = setTimeout( function () {
			let filesClone = getFilesForSave();
			let data = {
				"files": filesClone,
				"settings": m_projectSettings
			};
			m_failedLastSave = false;
			try {
				localStorage.setItem( "projectData", JSON.stringify( data ) );
			} catch {
				if( ! m_failedLastSave ) {
					layout.createPopup( "Warning", "<p class='msg-error'>" +
						"You are over the max storage capacity. " +
						"Your changes will no longer be saved.</p>" );
				}
				m_failedLastSave = true;
			} finally {
				updateFreespace();
			}
		}, delay );
	}

	function resetFilesChanged( file ) {
		file.isChanged = false;
		if( file.type === FILE_TYPE_FOLDER ) {
			for( let i = 0; i < file.content.length; i++ ) {
				resetFilesChanged( file.content[ i ] );
			}
		}
	}

	function getFilesForSave( isRecentChangesOnly ) {
		let filesClone = {};

		// Find all the open tabs
		let openTabs = [];
		$( ".tab" ).each( function () {
			openTabs.push( parseInt( this.dataset.fileId ) );
		} );

		// Get the selected tab
		let selectedTab = null;
		$( ".selected-tab" ).each( function () {
			selectedTab = parseInt( this.dataset.fileId );
		} );

		cloneFiles( m_files, filesClone );

		function cloneFiles( item, clone ) {
			clone.name = item.name;
			clone.fullname = item.fullname
			clone.type = item.type;
			clone.path = item.path;
			clone.extension = item.extension;
			clone.minimized = item.minimized;
			if( openTabs.indexOf( item.id ) > -1 ) {
				clone.isOpen = true;
			}
			if( item.id === selectedTab ) {
				clone.isSelected = true;
			}
			if( clone.type === FILE_TYPE_FOLDER ) {
				clone.content = [];
				for( let i = 0; i < item.content.length; i++ ) {
					let cloneItem = {};
					cloneFiles( item.content[ i ], cloneItem );
					clone.content.push( cloneItem );
				}
			} else {
				if( isRecentChangesOnly ) {
					if( item.isChanged ) {
						clone.content = item.content;
					}
				} else {
					clone.content = item.content;
				}
			}
		}

		return filesClone;
	}

} )();
