<?php
class User {

	private $sitename = "";

	public function __construct( $sitename ) {
		$this->sitename = $sitename."_";
	}

	public function isLoggedIn( $id ){
		if($_SESSION[$this->sitename.'loggedin'] == $_SERVER['REMOTE_ADDR'] && $_SESSION[$this->sitename.'user_id'] == $id)
			return true;
		else
			return false;
	}
	
	public function setLogin( $id ){
		$_SESSION[$this->sitename.'loggedin'] = $_SERVER['REMOTE_ADDR'];
		$_SESSION[$this->sitename.'user_id'] = $id;
	}
	
	public function setLogout(){
		unset($_SESSION[$this->sitename.'loggedin']);
		unset($_SESSION[$this->sitename.'user_id']);
	}
	
	public function checkPasswords($old,$new,$new_repeated){
		$errors = array();
		if(empty($old))
			$errors['old'] = 'Fyll i ett lösenord.';
		else if(!$this->validPassword($old))
			$errors['old'] = 'Lösenordet är felaktigt.';
			
		if(empty($new))
			$errors['new'] = 'Fyll i ett lösenord.';
		if(empty($new_repeated))
			$errors['new_repeat'] = 'Fyll i ett lösenord.';
		else if($new !== $new_repeated)
			$errors['new_repeat'] = 'Stämmer inte överens.';
		
		if(count($errors) == 0)
			return true;
		else
			return $errors;
	}
	
	public function validPassword($password,$correct_pass){
		$salt = substr($correct_pass,0,8);
		$this_hash = $this->generateHash($password,$salt);
		if($correct_pass === $this_hash)
			return true;
		else
			return false;
	}
	
	public function generateCode($num,$usedChars="a-zA-Z0-9")
	{
		$array = array();
		if(strpos($usedChars,"a-z") !== false)
		{
			array_push($array,"a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z");
		}
		if(strpos($usedChars,"A-Z") !== false)
		{
			array_push($array,"A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z");
		}
		if(strpos($usedChars,"0-9") !== false)
		{
			array_push($array,"0","1","2","3","4","5","6","7","8","9");
		}
		if(strpos($usedChars,"[") !== false)
		{
			preg_match("/\[(.*?)\]/",$usedChars,$matches);
			$special = $matches[1];
			$spec = chunk_split($special,1,"####");
			$spec = substr($spec,0,-4);
			$special = explode("####",$spec);
			foreach($special as $sp)
			{
				array_push($array,$sp);
			}
		}

		$array_keys = array_rand($array,$num);
		shuffle($array_keys);
		for($i=0; $i < $num; $i++){
			$code .= $array[$array_keys[$i]];
		}
		return $code;
	}
	
	public function generateHash($password,$salt=false)
	{
		if($salt === false)
		{
			$salt = substr(hash('sha512',self::generateCode(8,"a-z0-9")),0,8);
		}
		else
		{
			$salt = substr($salt,0,8);
		}

		return $salt.hash('sha512',$password.$salt);
	}
}
?>