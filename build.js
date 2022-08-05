const fs = require( "fs" );

fs.cp(
    "./node_modules/monaco-editor/min/vs",
    "./web/monaco-editor/min/vs",
    { recursive: true },
    ( err ) => {
        if (err) {
            console.error(err);
        }
} );