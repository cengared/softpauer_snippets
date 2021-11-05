<?php

ini_set('max_execution_time', 0);

session_start();

$allReady = $mailReady = $csvSet = FALSE;

ini_set('auto_detect_line_endings', TRUE);

if (!isset($configRoot)) {
    $configRoot = dirname(dirname(dirname(__FILE__)), 4) . "/";
}

require_once $configRoot.'config.php';

logPost("emailblast.php");

$csvDir = "csv/";
$fromOptions = array("F1NoReply" => "noreply@formula1.com", "F1Media" => "f1media@formula1.com" );
$emailFrom = $fromOptions['F1NoReply'];
$emailRoot = "email";
$emailCSV = $csvDir . "emailList.csv";
$emailFileList = array("html" => "templates/email.html.txt", "subject" => "templates/email.subject.txt", "body" => "templates/email.body.txt");
$body = $subject = $html = $csvFile = $fileMessage = '';
$emailList = $invalidEmails = array();

if (isset($_POST['selectFrom']))
{
	$_SESSION['emailFrom'] = $emailFrom = $_POST['selectFrom'];

	if (isset($_SESSION['mailReady']))
	{
		$body = $html = $_SESSION['html'];
		$subject = $_SESSION['subject'];
		$body = $_SESSION['body'];
		foreach ($emailFileList as $file)
		{
			if (!file_exists($file))
			{
				$mailReady = FALSE;
			}
			else
			{
				$mailReady = TRUE;
			}
		}
	}
}

if (isset($_POST['prepareEmail']))
{
	$htmlConverted = $templateCreated = FALSE;

	if(!empty($_POST['html']))
	{
		$html = $_POST['html'];
		
		logMsg("Starting HTML conversion.");
		$url = 'https://inlinestyler.torchbox.com/styler/convert/';
		$post = ['returnraw' => 1, 'source' => $html];
		$curl = curl_init($url);
		curl_setopt($curl, CURLOPT_POST, 1);
		curl_setopt($curl, CURLOPT_POSTFIELDS, $post);
		curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

		$result = curl_exec($curl);
		if ($result === FALSE)
	    {
	        $info = curl_getinfo($curl);
	        logMsg("failed to send curl:");
	        logMsg($info);
	        logMsg("result:");
	        logMsg($result);
	        curl_close($curl);
	    }
	    else
	    {
	    	curl_close($curl);
	    	$html = html_entity_decode($result, ENT_COMPAT, "UTF-8");
			$htmlConverted = TRUE;
	    	logMsg("HTML conversion done.\r\n");
			$hWrite = file_put_contents($emailFileList["html"], $html);
			if ($hWrite === FALSE)
			{
				logMsg("Unable to write HTML to file.");
			}
			else
			{
				logMsg("HTML written to file.");
			}
			$_SESSION['html'] = $html;
	    }
	}

	if (!empty($_POST['subject']))
	{
		$subject = trim($_POST['subject']);
	}

	if ($htmlConverted)
	{
		$sWrite = file_put_contents($emailFileList["subject"], $subject);
		if ($sWrite === FALSE)
		{
			logMsg("Unable to write Subject to file.");
		}
		else
		{
			logMsg("Subject written to file.");
		}
		$_SESSION['subject'] = $subject;

		$body = "This is a HTML email and your email client software does not support HTML email.";
		$bWrite = file_put_contents($emailFileList["body"], $body);
		if ($bWrite === FALSE)
		{
			logMsg("Unable to write Body to file.");
		}
		else
		{
			logMsg("Body written to file.");
		}
		$_SESSION['body'] = $body;
		if ($sWrite && $bWrite)
		{
			$templateCreated = TRUE;
		}
	}

	if ($templateCreated)
	{
		$mailReady = TRUE;
		$_SESSION['mailReady'] = $mailReady;
		logMsg("Process complete.");
	}

	if (isset($_SESSION['emailFrom']))
	{
		$emailFrom = $_SESSION['emailFrom'];
	}
}

if (isset($_POST['clearEmail']))
{
	$_SESSION['mailReady'] = $mailReady = $allReady = FALSE;
	foreach ($emailFileList as $file)
	{
		if (file_exists($file))
		{
			unlink($file);
		}
	}
}

if (isset($_POST['addCSV']))
{
	$targetFile = $csvDir . basename($_FILES['fileToUpload']['name']);
	$fileType = pathinfo($targetFile, PATHINFO_EXTENSION);
	if ($fileType != "csv")
	{
		$fileMessage = "Sorry, only CSV files are allowed.";
	}
	else
	{
		if (move_uploaded_file($_FILES['fileToUpload']['tmp_name'], $targetFile))
		{
			$fileMessage = "The file " . basename($_FILES['fileToUpload']['name']) . " has been uploaded."; 
		}
		else
		{
			$fileMessage = "Sorry, there was an error uploading your file.";
		}
	}

	if (isset($_SESSION['mailReady']))
	{
		$body = $html = $_SESSION['html'];
		$subject = $_SESSION['subject'];
		$body = $_SESSION['body'];
		foreach ($emailFileList as $file)
		{
			if (!file_exists($file))
			{
				$mailReady = FALSE;
			}
			else
			{
				$mailReady = TRUE;
			}
		}
	}

	if (isset($_SESSION['emailFrom']))
	{
		$emailFrom = $_SESSION['emailFrom'];
	}
}

if (isset($_POST['selectCSV']))
{
	$csvName = $_POST['selectCSV'];
	$csvFile = $csvDir . $csvName;
	if (!empty($csvFile) && file_exists($csvFile))
	{
		$csvData = array_map('str_getcsv', file($csvFile));
		foreach ($csvData as $line) 
		{
			foreach ($line as $value) 
			{
				$email = filter_var(trim($value), FILTER_SANITIZE_EMAIL);
				if(filter_var($email, FILTER_VALIDATE_EMAIL))
			    {
			        $emailList[] = $email;
			    }
			}
		}

		$file = fopen("emailList.csv", "w");
		foreach ($emailList as $line) 
		{
			fputcsv($file,explode(',',$line));
		}
		fclose($file);
		$csvSet = TRUE;

		if (isset($_SESSION['mailReady']))
		{
			$body = $html = $_SESSION['html'];
			$subject = $_SESSION['subject'];
			$body = $_SESSION['body'];
			foreach ($emailFileList as $file)
			{
				if (!file_exists($file))
				{
					$mailReady = FALSE;
				}
				else
				{
					$mailReady = TRUE;
				}
			}
		}
	}

	if (isset($_SESSION['emailFrom']))
	{
		$emailFrom = $_SESSION['emailFrom'];
	}
}

if ($mailReady && $csvSet)
{
	$allReady = TRUE;
}

if (isset($_POST['blastDone']))
{
	foreach ($emailFileList as $file)
	{
		if (file_exists($file))
		{
			unlink($file);
		}
	}
	$emailFrom = $fromOptions['F1NoReply'];
	$mailReady = FALSE;
	$file = "emailList.csv";
	if (file_exists($file))
	{
		unlink($file);
	}
	session_unset();
	session_destroy();
}

?>

<!DOCTYPE html>
<html>
<head>
	<title>Email Blast</title>
</head>
<body>
	<h2>Email Blast Form</h2>
	<form method="post" action="emailblast.php">
		<p>From: <select name="selectFrom" id="selectFrom" onchange="this.form.submit();">
			<?php foreach ($fromOptions as $from) { echo "<option value='" . $from . "'>" . $from . "</option>"; } ?>
		</select></p>
		<script type="text/javascript">
			document.getElementById('selectFrom').value = "<?php echo $emailFrom; ?>";
		</script>
	</form>
	<form method="post" action="emailblast.php">
		<p>Subject:</p>
		<p><textarea id="subject" name="subject" rows="1" cols="75"><?php if ($mailReady) {echo "$subject";} ?></textarea></p>
		<p>Enter HTML:</p>
		<p><textarea id="html" name="html" rows="15" cols="75"><?php if ($mailReady) {echo "$html";} ?></textarea></p>
		<div id="submit"><p><input type="submit" name="prepareEmail" value="Prepare Email"></p></div>
		<script type="text/javascript">
			var div = document.getElementById("submit");
			var html = document.getElementById("html");
			var subject = document.getElementById("subject");
			div.style.display = "none";
			html.addEventListener("keyup", function() {
			if (this.value.length && subject.value.length) { 
					div.style.display = "block"; }
				else { 
					div.style.display = "none"; } 
				}, false);

			subject.addEventListener("keyup", function() {
			if (this.value.length && html.value.length) { 
					div.style.display = "block"; }
				else { 
					div.style.display = "none"; } 
				}, false);
		</script>
		<p><?php if ($mailReady) : ?><input type="submit" name="clearEmail" value="Clear Email"><?php endif; ?></p>
		<p><?php if ($mailReady) { echo("The email, '$subject', is prepared for sending."); } ?></p>
	</form>

	<form method="post" action="emailblast.php" enctype="multipart/form-data">
		<p>Upload new CSV file: 
			<input type="hidden" name="MAX_FILE_SIZE" value="30000">
			<input type="file" name="fileToUpload" accept=".csv">
			<input type="submit" name="addCSV" value="Submit"> 
		</p>
		<p><?php echo $fileMessage; ?></p>
	</form>

	<form method="post" action="emailblast.php">
		<p>Choose CSV file to use: <select name="selectCSV" onchange="this.form.submit()">
		<option value="" selected><?php if ($csvSet) {echo($csvName);} else {echo("---------");} ?></option>
		<?php foreach (glob('csv/*.csv') as $filename) {
			$filename = basename($filename);
			if ($filename == "emailList.csv") {continue;}
			echo "<option value='" . $filename . "'>" . $filename . "</option>"; } ?>
		</select></p>
	</form>
	
	<p><?php if ($csvSet) { echo "Email list prepared from $csvFile. Contains " . count($emailList) . " valid email addresses.\n";} ?></p>
	<textarea id="validEmails" rows="15" cols="50" readonly><?php if ($csvSet) {foreach ($emailList as $value) {echo $value."\n";}} ?></textarea> 

	<form method="post" action="sendEmailBlast.php" onsubmit="return confirm('Are you sure you want to send this email blast?');"><p>
		<input type="hidden" name="emailFrom" value="<?php echo($emailFrom) ?>">
		<input type="hidden" name="emailRoot" value="<?php echo($emailRoot) ?>">
		<input type="hidden" name="emailCSV" value="<?php echo($emailCSV) ?>">
		<?php if($allReady) : ?>Ready to send the email blast: <input type="submit" name="sendBlast" value="Send Email Blast"><?php endif; ?>
	</p></form>

</body>
</html>

