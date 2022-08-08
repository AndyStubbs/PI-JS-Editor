var file = ( function () {

    let files = [
        {
            "name": "index.html",
            "type": "html",
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
            "type": "folder",
            "content": [
                {
                    "name": "main.js",
                    "type": "javascript",
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
                    "type": "stylesheet",
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
    
    return {
        "init": init
    };

    function init() {
        initFolder( document.querySelector( ".body > .files" ), files );
    }

    function initFolder( parentFolder, folder ) {
        let ul = document.createElement( "ul" );
        for( let i = 0; i < folder.length; i++ ) {
            let li = document.createElement( "li" );
            li.innerText = folder[ i ].name;
            if( folder[ i ].type === "folder" ) {
                li.innerText += " >";
                initFolder( li, folder[ i ].content );
            }
            ul.appendChild( li );
        }
        parentFolder.appendChild( ul );
    }
} )();

file.init();
