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
	if( !isset( $_SESSION[ 'project_id' ] ) ) {
		$_SESSION[ 'project_id' ] = uniqidReal( 6 );
	}

	$path = $GLOBALS[ 'runsdir' ] . '/' . $_SESSION[ 'project_id' ];
	if ( file_exists( $path ) ) {
		DeleteFolder( $path );
	}
	mkdir( $path, 0777, true );

	$GLOBALS[ 'projectpath' ] = $GLOBALS[ 'runsdir' ] . '/' . $_SESSION[ 'project_id' ];
	$GLOBALS[ 'projecturl' ] = $GLOBALS[ 'server2url' ] . '/' . $_SESSION[ 'project_id' ];
}

function run( $file ) {
	init();
		
	buildFiles( $file, '' );
	$template = file_get_contents( $GLOBALS[ 'server2dir' ] . '/index-template.php' );
	$template = str_replace( '[TITLE]', htmlentities( $_POST[ 'title' ] ), $template );
	$scripts = '<script src="' . $GLOBALS[ 'server2url' ] . '/qbs.js"></script>' . "\n\t\t";
	$scripts .= '<!-- MY SCRIPTS -->' . $GLOBALS[ 'scripts' ];
	$template = str_replace( '[SCRIPTS]', $scripts, $template );
	file_put_contents( $GLOBALS[ 'projectpath' ] . '/index.php', $template );
	
	echo $GLOBALS[ 'server2url' ] . '/' . $_SESSION[ 'project_id' ];
}

function buildFiles( $file, $path ) {
	// print_r( $file );
	//echo $file[ 'name' ] . '\n';
	//preg_replace( '/[\W]/', '', $str);
	$name = preg_replace( '/[^a-zA-Z0-9_ \-\.]/', '', $file[ 'name' ] );
	if( $file[ 'type' ] === "folder" ) {
		if( $path . '/' . $name !== '/root' ) {
			$newpath = $path . '/' . $name;
			//echo 'Making dir: ' . $GLOBALS[ 'projectpath' ] . $newpath . "-- \n";
			$status = mkdir( $GLOBALS[ 'projectpath' ] . $newpath, 0777, true );
			if( !file_exists( $GLOBALS[ 'projectpath' ] . $newpath ) ) {
				echo 'FAILED TO MAKE DIR: ' . $GLOBALS[ 'projectpath' ] . $newpath . "-- \n";
			}
		} else {
			//echo 'Skipping root dir: ' . $path . "-- \n";
			$newpath = $path;
		}
		foreach( $file[ 'content' ] as $subFile ) {
			buildFiles( $subFile, $newpath );
		}
	} else {
		if( $file[ 'type' ] === 'javascript' ) {
			$filename = $GLOBALS[ 'projecturl' ] . $path . '/' . $name . '.js';
			$filepath = $GLOBALS[ 'projectpath' ] . $path . '/' . $name. '.js';
			$GLOBALS[ 'scripts' ] .= "\n\t\t" . '<script src="' . $filename . '"></script>';
			file_put_contents( $filepath, $file[ 'content' ] );
		} elseif ( $file[ 'type' ] === 'image' ) {
			$filename = $GLOBALS[ 'projectpath' ] . $path . '/' . $name;
			convertToImage( $file[ 'content' ], $filename );
		}
	}
}

function convertToImage( $content, $filename ) {
	$start = strpos( $content, 'data:' ) + 5;
	$end = strpos( $content, ';', $start );
	$imageType = substr( $content, $start, $end - $start );
	$b64 = substr( $content, strpos( $content, 'base64,' ) + 7 );

	//echo $filename;
	//echo " -- \n";
	//echo $imageType;
	//echo " -- \n";
	//echo $b64;

	// Obtain the original content (usually binary data)
	$bin = base64_decode( $b64 );

	// Load GD resource from binary data
	$im = imageCreateFromString( $bin );

	// Make sure that the GD library was able to load the image
	// This is important, because you should not miss corrupted or unsupported images
	if ( !$im ) {
		return;
	}
	switch( $imageType ) {
   		case 'image/bmp':
			imagebmp( $im, $filename . '.bmp' );
			break;
		case 'image/gif':
			imagegif( $im, $filename . '.gif' );
			break;
		case 'image/jpeg':
			imagejpg( $im, $filename . '.jpg' );
			break;
		case 'image/png':
			imagepng( $im, $filename . '.png' );
			break;
		case 'image/webp':
			imagewebp( $im, $filename . '.webp' );
			break;
		default: return false;
	}
}
