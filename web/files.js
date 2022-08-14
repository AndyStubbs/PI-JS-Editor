/* global editor */

"use strict";

var file = ( function () {
    const OPEN_FOLDER_ENTITY = "&darr;";
    const CLOSED_FOLDER_ENTITY = "&rarr;"
    const FILE_TYPE_FOLDER = "folder";
    const FILE_TYPE_HTML = "html";
    const FILE_TYPE_STYLE = "css";
    const FILE_TYPE_SCRIPT = "javascript";

    let files = [
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
    ];
    let fileLookup = {};
    let lastFileId = 0;

    return {
        "init": init
    };

    function init() {
        let filesElement = document.querySelector( ".body > .files" );
        initFolder( filesElement, files );
        filesElement.addEventListener( "click", clickFiles );
        let tabsElement = document.querySelector( ".main-editor-tabs" );
        tabsElement.addEventListener( "click", clickTabs );
    }

    function initFolder( parentFolder, folder ) {
        let ul = document.createElement( "ul" );
        for( let i = 0; i < folder.length; i++ ) {
            let fileId = ++lastFileId;
            folder[ i ].id = fileId;
            fileLookup[ fileId ] = folder[ i ];
            let li = document.createElement( "li" );
            let span = document.createElement( "span" );
            li.appendChild( span );
            li.dataset.fileType = folder[ i ].type;
            li.dataset.clickable = true;
            li.dataset.fileId = fileId;

            if( folder[ i ].type === FILE_TYPE_FOLDER ) {
                updateFolderName( li, folder[ i ], true );
                initFolder( li, folder[ i ].content );
            } else {
                span.innerText = folder[ i ].name;
                if( folder[ i ].isOpen ) {
                    openFile( folder[ i ] );
                }
            }
            ul.appendChild( li );
        }
        parentFolder.appendChild( ul );
    }

    function openFile( file ) {
        let tabsContainer = document.querySelector( ".main-editor-tabs" );
        let existingTab = tabsContainer.querySelector( ".tab-"+ file.id );
        if( existingTab ) {
            selectItem( existingTab, "selected-tab" );
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
            newTab.className = "tab-" + file.id;            
            tabTitle.innerText = file.name;
            newTab.dataset.fileId = file.id;
            tabsContainer.append( newTab );
            selectItem( newTab, "selected-tab" );
        }
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

    function selectItem( element, className ) {
        document.querySelectorAll( "." + className ).forEach(
            ( el ) => el.classList.remove( className )
        );

        element.classList.add( className );
    }

    function getClickableTarget( e, container ) {
        // Make sure we are clicking on a file or folder
        let target = e.target;
        while( target && target !== container && ! target.dataset.clickable ) {
            target = target.parentElement;
        }
        if( target === container ) {
            return null;
        }
        return target;
    }

    function clickFiles( e ) {
        // Make sure we are clicking on a file or folder
        let target = getClickableTarget( e, this );
        if( ! target ) {
            return;
        }

        selectItem( target, "selected-file" );
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

    function clickTabs( e ) {
        let target = getClickableTarget( e, this );
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
                    let file = fileLookup[ nearestTab.dataset.fileId ];
                    selectItem( nearestTab, "selected-tab" );
                    editor.setModel( file.model );
                } else {
                    editor.setModel( null );
                }
            }
            tab.parentElement.removeChild( tab );
        } else {
            let file = fileLookup[ target.dataset.fileId ];
            selectItem( target, "selected-tab" );
            editor.setModel( file.model );
        }
    }

} )();
