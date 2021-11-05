<?php
ini_set('auto_detect_line_endings', TRUE);

if (!isset($configRoot)) {
	$configRoot = dirname(__FILE__, 5) . "/";
}

require_once $configRoot . 'config.php';
require_once 'dbinc.php';
require_once 'curl.php';
require_once 'userFunctions.php';

logPost("sendemailblast.php");

$postData = file_get_contents('php://input');
$data = (object)json_decode($postData, true);
$returnLog = array();
$now = date("Y-m-d H:i:s");
$log = "";
$mailingList = $data->listName;
$listID = $data->listID;
$templateID = $data->templateID;
$from = array($data->fromAddress => $data->fromName);
logMsg($returnLog[] = "Preparing email blast for mailing list '$mailingList'...");

$db_connect = openDB();
logMsg("Getting template data");
$query = "SELECT * FROM emails_template WHERE etid='$templateID'";
$result = doSQLTermError($db_connect, $query);
$template = $result->fetch_object();
if(!$template) {
  terminate("-39", "Template data not found");
}
logMsg("Using template: " . $template->type);

logMsg("Collecting user emails for users attached to mailing list '$mailingList'");
$userList = getMailingListUsers($listID);

$returnLog[] = "Mailing list = $mailingList;\nTemplate = $template->type;\nFrom = $data->fromAddress";
logMsg($returnLog[] = "Starting to send emails...");

foreach($userList as $user) {
  logMsg($user);
  $fail = true;
  $guid = $user->guid;
  $post = new stdClass();
  $post->email = $user->email;
  $post->from = $from;
  $post->service = $mailingList;
  $post->subject = $template->subject;
  $post->message = $template->body;
  $post->htmlMessage = $template->html;

  $request = new stdClass();
  $request->url = $mailerURL;
  $request->type = "POST";
  $request->postFields = json_encode($post);
  $request->header = [
    'Content-Type: application/json',
    'Content-Length: ' . strlen($request->postFields),
  ];

  doCurlRequest($request, $result);
  if ($result === false) {
    logMsg($returnLog[] = "*** Email failed: " . $post->email . " ***", 1);
    
  } else {
    $resultDecoded = json_decode($result);
    if (!$resultDecoded) {
      logMsg($returnLog[] = "* Failed to decode json result *", 1);
      logMsg($result);
    }
    else {
      if ($resultDecoded->errorCode == 0) {
        logMsg($returnLog[] = "Email sent: " . $post->email);
        $fail = false;
      }
      else {
        logMsg($returnLog[] = "** Something went wrong with mailer on email: " . $post->email . " **", 1);
        logMsg($resultDecoded);
      }
    }
  }
  if ($fail) {
    $query = "UPDATE mailing_lists_users SET last_fail='$now', send_count=(send_count+1) WHERE list_id='$listID' AND g_uid='$guid'";
  } else {
    $query = "UPDATE mailing_lists_users SET last_success='$now', send_count=(send_count+1) WHERE list_id='$listID' AND g_uid='$guid'";
  }
  doSQLTermError($db_connect, $query);
  logMsg("Updated send status");
  logMsg($query);
}

$query = "UPDATE mailing_lists SET last_send='$now' WHERE list_id='$listID'";
doSQLTermError($db_connect, $query);
logMsg("Updating the last send date for the mailing list");
logMsg($query);

logMsg($returnLog[] = "Email blast done.");

term(json_encode($returnLog));

