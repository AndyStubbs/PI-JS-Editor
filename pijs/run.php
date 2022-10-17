<?php

if( $_GLOBALS[ 'ACCEPT_REFERER' ] !== trim( $_SERVER[ 'HTTP_REFERER' ] ) ) {
	print_r( $_SERVER );
	//http_response_code( 404 );
	die();
}