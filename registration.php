<?php
session_start();
// Include the database connection
include_once("db.php");
// Include the user class
include_once("lib/user.php");

// Get the supplied user data
$email = $db->real_escape_string( strtolower( $_POST['email'] ) );
$password = $db->real_escape_string( $_POST['password'] );

// Get user data from DB
if( $result = $db->query( sprintf( "SELECT * FROM drawapp_users WHERE email = '%s'", $email ) ) ) {

	// Get data
	$user = $result->fetch_object();
	
	// Return error code if e-mail already exists
	if( $user !== NULL ) {
		// Return JSON string with status
		echo '{ "status": "email-exists" }';
		exit;
	}
		
	// Instantiate new User class
	$u = new User( "drawapp" );
	
	// Add user to the DB
	if( $db->query( sprintf( "INSERT INTO drawapp_users ( email, password ) VALUES ( '%s', '%s' )", $email, $u->generateHash( $password ) ) ) ) {
		
		// Get user ID
		$id = $db->insert_id;
		
		// Set session to remember that the user is logged in
		$u->setLogin( $id );
	
		// Return JSON string with user data
		echo '{ "status": "ok", "user": { "id": "'.$id.'", "email": "'.$email.'" } }';
	}
}
?>