$.screen( "300x200" );
$.loadImage( "img/prince.png", "monkey" );
$.ready( function () {
	$.circle( 150, 100, 50, "red" );
	$.drawImage( "monkey", 150, 100, 0, 0.5, 0.5 );
	// This is a comment.
	$.filterImg( function ( color, x, y ) {
		let z = x + y;
		color.r = color.r - Math.round( Math.tan( z / 10 ) * 128 );
		color.g = color.g + Math.round( Math.cos( x / 7 ) * 128 );
		color.b = color.b + Math.round( Math.sin( y / 5 ) * 128 );
		return color;
	} );
} );
