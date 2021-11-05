<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


try
{
    require_once '../../config.php';
    require_once 'dbinc.php';
    require_once 'gigyaFunctions.php';
    require_once 'akqaFunctions.php';
    require_once 'mailFunctions.php';

    $origin = (isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : "*");

    header("Access-Control-Allow-Origin: " . $origin . "");
    header("Access-Control-Allow-Headers: Content-Type, X-SP-MAC, X-SP-UID, X-SP-TS");
    header('Access-Control-Allow-Credentials: true');
    header('Content-type: application/json');
    logPost("login.php");

    $post = file_get_contents('php://input');
    $data = json_decode($post);

    if (!isset($data)) {
        logMsg("No data posted, login cancelled.");
        terminate(-1, "No data posted", "{}");
    }

    logMsg("Post data:" . spPrint($data, 1));

    if (isset($data->email))
    {
        $data->loginID = $data->email;
    }

    $passwordlessLogin = false;
    if (isset($data->passwordless) && $data->passwordless == true) {
        $passwordlessLogin = true;
        if($data && isset($data->loginID))
        {
            $loginID = $data->loginID;
            $password = "";
        }
        else if (!isset($_POST["loginID"]))
        {
            terminate(-1, "forbidden", "{}");
        }
        else
        {
            $loginID = $_POST["loginID"];
            $password = "";
        }
        logMsg("The user is logging in without a password.");
    }
    else{
        if($data && isset($data->loginID) && isset($data->password))
        {
            $loginID = $data->loginID;
            $password = $data->password;
        }
        else if (!isset($_POST["loginID"]) || !isset($_POST["password"]))
        {
            terminate(-1, "forbidden", "{}");
        }
        else
        {
            $loginID = $_POST["loginID"];
            $password = $_POST["password"];
        }
    }

    if (!isset($data->service)) {
        $data->service = "pauerview";
    }
    
    validateString($loginID, -1000, "Invalid email", 2, 255);
    $request           = (object) array();
    $request->loginID  = strtolower($loginID);
    $request->password = $password;
    setServiceName($request, $data);

    userLog($request->loginID, $data);

    if (isset($_SERVER['HTTP_USER_AGENT']))
        $request->UA = $_SERVER['HTTP_USER_AGENT'];
    /*
    if (checkIfUserExistsInDB($request->loginID) && !doesUserHavePassword($request) && !$passwordlessLogin)
    {
        //If the user exists but has no password.
        logMsg("user has no password, lets send them an email");
        $request->g_uid = emailToGuid($request);
        createUserRecordFromDB($request);
        mailSetPassword($request);
        terminate(12, "The user needs to set a password (email has been sent).");
    }*/

    if ($passwordlessLogin) {
        loginNoPassword($request);
    }
    else { 
        loginUsingDB($request);
    }

    $time_end = microtime(true);
    $time     = $time_end - $time_start;

    $request->userData->_t = $time;

    term(json_encode($request->userData));
}
catch (Exception $ex)
{
    logMsg("Message = [" .$ex->getMessage(). "]  file = [" .$ex->getFile(). "], Line = [" .$ex->getLine(). "]", 1);
    terminate(-500, "something went wrong.");
}