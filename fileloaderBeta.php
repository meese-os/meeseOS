<?php
function dirToArray($dir) {
	$result = array();
	$cdir = scandir($dir);
	foreach ($cdir as $key => $value) {
		if (!in_array($value, array(".", ".."))) {
			if (is_dir($dir . DIRECTORY_SEPARATOR . $value)) {
				$result[$value] = dirToArray($dir . DIRECTORY_SEPARATOR . $value);
			} else {
				$result[substr($value, 0, strrpos($value, '.'))] = file_get_contents($dir . DIRECTORY_SEPARATOR . $value);
			}
		}
	}

	return $result;
}

if (isset($_COOKIE['keyword'])) {
	if (is_dir('USERFILES/' . $_COOKIE['keyword'])) {
		$jsonResult = json_encode(dirToArray('USERFILES/' . $_COOKIE['keyword']));
		if ($jsonResult == "null") {
			echo '{}';
		} else {
			$jsonResult = str_replace("/script", "\\/script", $jsonResult);
			echo $jsonResult;
		}
	} else {
		echo '{}';
	}
} else {
	echo '{}';
}
