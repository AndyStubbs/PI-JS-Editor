var file = ( function () {
    const OPEN_FOLDER_ENTITY = "&darr;";
    const CLOSED_FOLDER_ENTITY = "&rarr;"
    const FILE_TYPE_FOLDER = "folder";
    const FILE_TYPE_HTML = "html";
    const FILE_TYPE_STYLE = "stylesheet";
    const FILE_TYPE_SCRIPT = "javascript";

    let files = [
        {
            "name": "index.html",
            "type": FILE_TYPE_HTML,
            "isOpen": true,
            "content": "" +
            "<!DOCTYPE html>" +
                "<html lang=\"en\">" +
                "<head>" +
                    "<title>My Game</title>" +
                    "<meta http-equiv=\"Content-Type\" content=\"text/html;charset=utf-8\" />" +
                    "<link rel=\"stylesheet\" href=\"styles.css\">" +
                "</head>" +
                "<body>" +
                    "<script src=\"main.js\"></script>" +
                "</body>" +
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
                        "html, body {" +
                            "height: 100%;" +
                            "margin: 0;" +
                            "overflow: hidden;" +
                            "background-color: rgb(30, 30, 30);" +
                            "color: rgb(225, 225, 225);" +
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
    }

    function initFolder( parentFolder, folder ) {
        let ul = document.createElement( "ul" );
        for( let i = 0; i < folder.length; i++ ) {
            let fileId = ++lastFileId;
            fileLookup[ fileId ] = folder[ i ];
            let li = document.createElement( "li" );
            let span = document.createElement( "span" );
            li.appendChild( span );
            li.dataset.fileType = folder[ i ].type;
            li.dataset.fileClickable = true;
            li.dataset.fileId = fileId;

            if( folder[ i ].type === FILE_TYPE_FOLDER ) {
                updateFolderName( li, folder[ i ], true );
                initFolder( li, folder[ i ].content );
            } else {
                span.innerText = folder[ i ].name;
            }
            ul.appendChild( li );
        }
        parentFolder.appendChild( ul );
    }

    function updateFolderName( element, file, isOpen ) {
        if( isOpen ) {
            element.firstElementChild.innerHTML = OPEN_FOLDER_ENTITY + "&nbsp;&nbsp;" + file.name;
        } else {
            element.firstElementChild.innerHTML = CLOSED_FOLDER_ENTITY + "&nbsp;&nbsp;" + file.name;
        }
    }

    function selectFile( element, file ) {

        // Remove previously selected files
        document.querySelectorAll( ".selected-file" ).forEach(
            ( el ) => el.classList.remove( "selected-file" )
        );

        element.classList.add( "selected-file" );
    }

    function clickFiles( e ) {

        // Make sure we are clicking on a file or folder
        let target = e.target;
        while( target !== this && ! target.dataset.fileClickable ) {
            target = target.parentElement;
        }
        if( target === this ) {
            return;
        }

        selectFile( target );

        // Toggle the folder Open/Closed
        if( target.dataset.fileType === FILE_TYPE_FOLDER ) {
            let ul = target.children[ 1 ];
            let file = fileLookup[ target.dataset.fileId ];
            if( ul.style.display === "none" ) {
                ul.style.display = "";
                updateFolderName( target, file, true );
            } else {
                ul.style.display = "none";
                updateFolderName( target, file, false );
            }
        }
    }

} )();

file.init();
