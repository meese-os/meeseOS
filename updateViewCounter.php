<?php
	$fileName = "counter.txt";
	
	if (file_exists($fileName)) {
		$handle = fopen($fileName, "r");
		$counter = (int) fread($handle, 20);
		fclose($handle);

		$counter++;
	} else {
		$counter = 1;
	}
	
	$handle = fopen($fileName, "w");
	fwrite($handle, $counter);
	fclose ($handle);
?>