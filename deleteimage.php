<?php
session_start();
// Include the database connection
include_once("db.php");
// Include the user class
include_once("lib/user.php");

// Get the user data
$userID = intval( $_POST['user_id'] );
$imageID = intval( $_POST['image_id'] );

// Instantiate new User class
$u = new User( "drawapp" );

if( !$u->isLoggedIn( $userID ) ) {
	echo '{ "status": "permission-denied" }';
	exit;
}

$db->query( sprintf( "DELETE FROM drawapp_images WHERE user_id = '%d' AND id = '%d'", $userID, $imageID ) );
$db->query( sprintf( "DELETE FROM drawapp_thumbs WHERE user_id = '%d' AND id = '%d'", $userID, $imageID ) );

echo '{ "status": "ok" }';
?>