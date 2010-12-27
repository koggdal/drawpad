<?php
session_start();
// Include the database connection
include_once("db.php");
// Include the user class
include_once("lib/user.php");

// Get the user data
$email = $db->real_escape_string( strtolower( $_POST['email'] ) );
$password = $db->real_escape_string( $_POST['password'] );

// Get user data from DB
if( $result = $db->query( sprintf( "SELECT * FROM drawapp_users WHERE email = '%s'", $email ) ) ) {

	// Get data
	$user = $result->fetch_object();
	
	if( $user === NULL ) {
		// Return JSON string with status
		echo '{ "status": "wrong-email" }';
		exit;
	}
	
	// Instantiate new User class
	$u = new User( "drawapp" );
	
	// Validate if the password was correct
	if( $u->validPassword( $password, $user->password ) ) {
	
		// Set session to remember that the user is logged in
		$u->setLogin( $user->id );
	
		// Return JSON string with user data
		echo '{ "status": "ok", "user": { "id": "'.$user->id.'", "email": "'.$user->email.'" } }';
		
	} else {
	
		// Return JSON string with status
		echo '{ "status": "wrong-password" }';
	}
}
?>