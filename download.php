<?php 

error_reporting(E_ERROR);
header('Content-Type: application/json');

$url = array_key_exists("url", $_POST) ? $_POST["url"] : null;

if( $url == null ){
	exit(0);
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 3);
curl_setopt($ch, CURLOPT_TIMEOUT_MS, 3000);
curl_setopt($ch, CURLOPT_CONNECTIONTIMEOUT_MS, 3000);

$result = curl_exec($ch);
curl_close($ch);

$numChars = 4;

do {
	
	$targetFilaname = "downloaded_";	
	for($i = 0; $i < $numChars; $i++){
		$targetFilaname .= chr( rand(65, 90) );
	}

	$targetFilaname .=  ".png";
	$numChars += 1;
	
}while( is_file("images/" . $targetFilaname) );

$fname = tempnam( sys_get_temp_dir(), "fx" );
file_put_contents($fname, $result);

if( filesize($fname) > 10000000 ){
	echo json_encode( ["error" => "The file is to large."] );
	unlink($fname);
	exit(0);
}

$fullFilename = dirname(__FILE__) . "/images/" . $targetFilaname;

exec("convert " . $fname . " " . $fullFilename);
unlink($fname);
chmod($targetFilaname, 0644);

if( filesize($fullFilename) == 0 ){
	echo json_encode( ["error" => "The file isn't a valid image."] );
	unlink($fullFilename);
	exit(0);
}

echo json_encode( ["error" => null, "filename" => $targetFilaname] );