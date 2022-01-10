<?php

function console_log($output, $with_script_tags = true) {
	$js_code = 'console.log(' . json_encode($output, JSON_HEX_TAG) . 
');';
	if ($with_script_tags) {
		$js_code = '<script>' . $js_code . '</script>';
	}
	echo $js_code;
}

$owner_email = "karabmeese@gmail.com";
$website_url = "karameese.com";

$email = filter_var( $_POST["email"], FILTER_VALIDATE_EMAIL );
if (!$_POST["subject"] || !$_POST["message"] || !$_POST["name"] || !$email) {
	// TODO: Make this a popup
	console_log("Please fill out all fields with valid information!");
}

$sent = mail(
	$owner_email,
	$_POST["subject"],
	"Name: " . $_POST["name"] . "\n\nEmail: " . $_POST["email"] . "\n\nMessage: " . $_POST["message"],
	"From: contactform@" . $website_url
);

die;

// TODO: Return a response indicating whether the email send was successful

?>