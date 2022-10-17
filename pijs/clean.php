<?php

$path = 'pijs-run_org/runs';

require( 'util.php' );

$maxTime = 3600;  // 1 hour
$date = new DateTimeImmutable();
$t = $date->getTimestamp();
//echo $t . "<br />\n";
//echo 'Path: ' . $path . "<br />\n";
$files = array_diff( scandir( $path ), array( '.', '..' ) );
//print_r( $files );
//echo "<br />\n";
foreach( $files as $file ) {
	$filepath = $path . '/' . $file;
//	echo $filepath . "<br />\n";
	if( is_dir( $filepath ) ) {
		$modtime = filemtime( $filepath );
		
//		echo $modtime . "<br />\n";
//		echo ( $t - $modtime ) . "<br />\n";
		if( ( $t - $modtime ) > $maxTime ) {
			echo 'Deleting File: ' . $filepath . "<br />\n";
			DeleteFolder( $filepath );
		}
	}
}