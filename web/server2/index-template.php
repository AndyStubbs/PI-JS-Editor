<?php
	require( '../../config.php' );
	require( '../../run.php' );
?>
<!DOCTYPE html>
<html lang="en">
	<head>
		<title>[TITLE]</title>
		<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
		<style>
			body {
				background-color: black;
			}
		</style>
	</head>
	<body>
		<?php print_r( $_SERVER['HTTP_REFERER'] ) ?>
		[SCRIPTS]
	</body>
</html>