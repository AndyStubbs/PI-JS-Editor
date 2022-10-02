<?php

require( '../app-config.php' );
require( '../util.php' );

session_start();

$GLOBALS[ 'runsdir' ] = $GLOBALS[ 'server2dir' ] . '/' . 'runs';
$GLOBALS[ 'projectpath' ] = '';
$GLOBALS[ 'errors' ] = [];
$GLOBALS[ 'scripts' ] = '';

switch( $_POST[ 'action' ] ) {
	case 'init':
		init();
		break;
	case 'run':
		// print_r( $_POST );
		run( $_POST[ 'files' ] );
		break;
}

function init() {
	$_SESSION[ 'project_id' ] = uniqidReal( 6 );
	$path = $GLOBALS[ 'runsdir' ] . '/' . $_SESSION[ 'project_id' ];
	if ( file_exists( $path ) ) {
		DeleteFolder( $path );
	}
	mkdir( $path, 0777, true );	
}

function run( $file ) {
	if( !isset( $_SESSION[ 'project_id' ] ) ) {
		init();
	}
	$GLOBALS[ 'projectpath' ] = $GLOBALS[ 'runsdir' ] . '/' . $_SESSION[ 'project_id' ];

	buildFiles( $file );
	$template = file_get_contents( $GLOBALS[ 'server2dir' ] . '/index-template.php' );
	$template = str_replace( '[TITLE]', htmlentities( $_POST[ 'title' ] ), $template );
	$scripts = '<script src="../qbs.js"></script>' . "\n\t\t";
	$scripts .= '<!-- MY SCRIPTS -->' . $GLOBALS[ 'scripts' ];
	$template = str_replace( '[SCRIPTS]', $scripts, $template );
	file_put_contents( $GLOBALS[ 'projectpath' ] . '/index.php', $template );
	
	echo $GLOBALS[ 'server2url' ] . '/' . $_SESSION[ 'project_id' ];
}

function buildFiles( $file ) {
	// print_r( $file );
	//echo $file[ 'name' ] . '\n';
	if( $file[ 'type' ] === "folder" ) {
		foreach( $file[ 'content' ] as $subFile ) {
			buildFiles( $subFile );
		}
	} else {
		if( $file[ 'type' ] === 'javascript' ) {
			$filename = $file[ 'name' ] . '.js';
			$filepath = $GLOBALS[ 'projectpath' ] . '/' . $file[ 'name' ] . '.js';
			$GLOBALS[ 'scripts' ] .= "\n\t\t" . '<script src="' . $filename . '"></script>';
			//echo $filename;
			file_put_contents( $filepath, $file[ 'content' ] );
		} else {

		}
	}
}

function convertToImage( $b64 ) {
	// Obtain the original content (usually binary data)
	$bin = base64_decode( $b64 );

	// Load GD resource from binary data
	$im = imageCreateFromString($bin);

	// Make sure that the GD library was able to load the image
	// This is important, because you should not miss corrupted or unsupported images
	if ( !$im ) {
		die('Base64 value is not a valid image');
	}

	// Specify the location where you want to save the image
	$img_file = '/files/images/filename.png';

	// Save the GD resource as PNG in the best possible quality (no compression)
	// This will strip any metadata or invalid contents (including, the PHP backdoor)
	// To block any possible exploits, consider increasing the compression level
	imagepng($im, $img_file, 0);

	/*
	$code_base64 = $row['content'];
	$code_base64 = str_replace('data:image/jpeg;base64,','',$code_base64);
	$code_binary = base64_decode($code_base64);
	$image= imagecreatefromstring($code_binary);
	header('Content-Type: image/jpeg');
	imagejpeg($image);
	imagedestroy($image);
	*/
}
