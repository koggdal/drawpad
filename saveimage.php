<?php
session_start();
// Include the database connection
include_once("db.php");
// Include the user class
include_once("lib/user.php");

// Get the user data
$userID = intval( $_POST['user_id'] );
$fullsize = str_replace( " ", "+", $db->real_escape_string( $_POST['fullsize'] ) );
$thumb = str_replace( " ", "+", $db->real_escape_string( $_POST['thumb'] ) );

// Instantiate new User class
$u = new User( "drawapp" );

if( !$u->isLoggedIn( $userID ) ) {
	echo '{ "status": "permission-denied" }';
	exit;
}

$db->query( sprintf( "INSERT INTO drawapp_images ( user_id, data_url ) VALUES ( '%d', '%s' )", $userID, $fullsize ) );
$db->query( sprintf( "INSERT INTO drawapp_thumbs ( user_id, data_url ) VALUES ( '%d', '%s' )", $userID, $thumb ) );

echo '{ "status": "ok" }';
?>