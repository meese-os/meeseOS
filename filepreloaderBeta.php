<?php
// error handler
function error($errno, $errstr, $errfile, $errline) {
	echo "alert('Serverside error in $errfile[$errline]: $errstr\n\nContact karabriggs15@gmail.com \nIf needed, tell the developer in a PRIVATE conversation, your ID is " . $_COOKIE['keyword'] . "');";
}
set_error_handler("error");

// if USERFILES and such does not exist, create it (first time setup)
if (!is_dir('USERFILES')) {
	mkdir('USERFILES');
	mkdir('USERFILES/!ERROR');
	mkdir('USERFILES/!MESSAGE');
	file_put_contents('USERFILES/newUsers.txt', '');
	file_put_contents('USERFILES/.htaccess', 'Deny from all');
	if (!file_exists('USERFILES/!MESSAGE/m0.txt')) {
		file_put_contents('USERFILES/!MESSAGE/m0.txt', '{"i":" ","n":" ","c":"This is the beginning of the message history.","t":"1","l":"0"}');
	}
	if (!is_dir('messageUsernames')) {
		mkdir('messageUsernames');
		file_put_contents('messageUsernames/.htaccess', 'Deny from all');
	}
	if (!is_dir('logins')) {
		mkdir('logins');
		file_put_contents('logins/.htaccess', 'Deny from all');
	}
}

if (isset($_COOKIE['password'])) {
	setcookie('password', '', time() - 3600);
}

// alphabet available to make userkeys from
$newUser = 0;
$lettertypes = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';

// 1. if the user is not logged in
// 2. if the user has a weird keyword
if (!isset($_COOKIE['keyword']) || preg_match('/[^A-Za-z0-9_-]/', $_COOKIE['keyword'])) {
	$newUser = 1;
	// create a new userkey
	$newcode = 'blank';
	while ($newcode === 'blank' || is_dir('USERFILES/' . $newcode)) {
		$newcode = '';
		for ($i = 0; $i < 21; $i++) { // capacity for 41-trillion, 107-billion, 996-million, 877-thousand, 935-hundred, 680 unique web-browser keys
			$newcode = $newcode . $lettertypes[random_int(0, strlen($lettertypes) - 1)];
		}
	}

	// tell the browser
	setcookie('keyword', $newcode, time() + 321408000);
	$_COOKIE['keyword'] = $newcode;
}

// Push javascript to set server variables
echo 'window.SRVRKEYWORD="' . $_COOKIE['keyword'] . '";';

// If user folder not exist, create it
if (!(is_dir('USERFILES/' . $_COOKIE['keyword']))) {
	$newUser = 1;
	mkdir('USERFILES/' . $_COOKIE['keyword']);
}

$newUsers = fopen('USERFILES/newUsers.txt', 'r');
if (filesize('USERFILES/newUsers.txt') === 0) {
	$newUsersList = array();
} else {
	$newUsersList = explode("\n", fread($newUsers, filesize('USERFILES/newUsers.txt')));
}

fclose($newUsers);
$newList = array();
foreach ($newUsersList as $user) {
	if ((int) substr($user, strpos($user, '=') + 1, strlen($user)) >= round(microtime(true) * 1000) - 120000) {
		array_push($newList, $user);
	}
}
if ($newUser) {
	array_push($newList, $_COOKIE['keyword'] . '=' . round(microtime(true) * 1000));
}
unset($user);
$newUsers = fopen('USERFILES/newUsers.txt', 'w');
fwrite($newUsers, join("\n", $newList));
fclose($newUsers);

// renew your keyword cookie
setcookie('keyword', $_COOKIE['keyword'], time() + 321408000);

?>