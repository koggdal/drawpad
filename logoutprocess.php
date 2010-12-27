<?php
session_start();
// Include the database connection
include_once("db.php");
// Include the user class
include_once("lib/user.php");

// Instantiate new User class
$u = new User( "drawapp" );

// Logout
$u->setLogout();

// Return JSON string with status
echo '{ "status": "ok" }';
?>