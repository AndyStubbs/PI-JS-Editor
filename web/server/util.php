<?php

if (! function_exists( 'str_ends_with' ) ) {
    function str_ends_with( string $haystack, string $needle ): bool
    {
        $needle_len = strlen( $needle );
        return ( $needle_len === 0 || 0 === substr_compare( $haystack, $needle, - $needle_len ) );
    }
}

function uniqidReal( $lenght = 13 ) {
    // uniqid gives 13 chars, but you could adjust it to your needs.
    if ( function_exists( 'random_bytes' ) ) {
        $bytes = random_bytes( ceil( $lenght / 2 ) );
    } elseif ( function_exists( 'openssl_random_pseudo_bytes' ) ) {
        $bytes = openssl_random_pseudo_bytes( ceil( $lenght / 2 ) );
    } else {
        throw new Exception( 'no cryptographically secure random function available' );
    }
    return substr( bin2hex( $bytes ), 0, $lenght );
}

function DeleteFolder( $path ) {
    if ( is_dir( $path ) === true ) {
        $files = array_diff( scandir( $path ), array( '.', '..' ) );

        foreach ( $files as $file ) {
            DeleteFolder( realpath( $path ) . '/' . $file );
        }

        return rmdir( $path );
    }

    else if ( is_file( $path ) === true ) {
        return unlink( $path );
    }

    return false;
}