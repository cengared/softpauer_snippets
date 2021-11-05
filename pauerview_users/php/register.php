<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function validateField($var, $fieldname, $code, $message, $minLen, $maxLen)
{
    global $validationErrors;

    $errObject            = new stdClass();
    $errObject->fieldName = $fieldname;
    $errObject->message   = $message;

    if (strlen($var) < $minLen)
    {
        array_push($validationErrors, (array) $errObject);
    }

    if (strlen($var) > $maxLen)
    {
        array_push($validationErrors, (array) $errObject);
    }
}

function verifyCaptcha($request)
{
    $url = "https://www.google.com/recaptcha/api/siteverify?secret=6Let7TQUAAAAACcJCAD3iYaIaj_bCeIybVEKRm-Z&response=" . $request->captcha . "&remoteip=" . $_SERVER['REMOTE_ADDR'];

    logMsg("Captcha url: $url");

    $verify = file_get_contents($url);

    logMsg("Captcha verify:" . $verify);
    $captcha_success = json_decode($verify);
    if ($captcha_success->success == false)
    {
        global $validationErrors;
        $errObject            = new stdClass();
        $errObject->fieldName = "email";
        $errObject->message   = "You must confirm the captcha";
        array_push($validationErrors, (array) $errObject);
        logMsg("failed captcha!");
    }
    else
    {
        logMsg("good captcha!");
    }
}

function getRealIpAddr()
{
    if (!empty($_SERVER['HTTP_CLIENT_IP']))   //check ip from share internet
    {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    }
    elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR']))   //to check ip is pass from proxy
    {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    }
    else
    {
        $ip = $_SERVER['REMOTE_ADDR'];
    }
    return $ip;
}

try
{
    require_once '../../config.php';
    require_once 'GSSDK.php';
    require_once 'JWT.php';
    require_once 'dbinc.php';
    require_once 'SignatureInvalidException.php';
    require_once 'ExpiredException.php';
    require_once 'BeforeValidException.php';
    require_once 'gigyaFunctions.php';
    require_once 'akqaFunctions.php';
    require_once 'mailFunctions.php';

    $origin = (isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : "*");
    
    header("Access-Control-Allow-Origin: " . $origin . "");
    header("Access-Control-Allow-Headers: Content-Type, X-SP-MAC, X-SP-UID, X-SP-TS");
    header('Access-Control-Allow-Credentials: true');
    header('Content-type: application/json');
    logPost("register.php");

    $post = file_get_contents('php://input');
    $data = json_decode($post);

    if (!isset($data)) {
        logMsg("No data posted, registration cancelled.");
        terminate(-1, "No data posted", "{}");
    }

    logMsg("Incoming: $post \r\n" . spPrint($data, 1), 2);

    $passwordlessRegistration = false;
    if (isset($data->passwordless) && $data->passwordless == true) {
        $passwordlessRegistration = true;
        logMsg("The user is registering without a password.");
    }

    if (isset($data->email))
    {
        $data->loginID = $data->email;
    }

    if (isset($data->name))
    {
        $name = explode(" ", $data->name);
        $data->firstName = $name[0];
        $data->lastName = "";
        for ($i = 1; $i < count($name); $i ++) {
            $data->lastName .= $name[$i] . " ";
        }
    }
    
    if (!isset($data) || !isset($data->loginID) || !isset($data->firstName) || !isset($data->lastName))
    {
        terminate(-1, "forbidden", "{}");
    }

    userLog(strtolower($data->loginID), $data);    
    if (isset($data->service))
    {
        $service = filter_var($data->service, FILTER_SANITIZE_SPECIAL_CHARS);
        if (strlen($service) > 20)
        {
            terminate(-1005, "Invalid service name");
        }
    }

    // Basic input validation:
    $validationErrors = array();
    if (!filter_var($data->loginID, FILTER_VALIDATE_EMAIL))
    {
        array_push($validationErrors, array("fieldName" => "email", "message" => "Email is invalid"));
    }

    if (isset($data->captcha))
    {
        logMsg("Captcha!");
        verifyCaptcha($data);
    }
    else
    {
        logMsg("Warning - no captcha!");
    }

    validateField($data->loginID, "email", -1000, "Invalid email", 5, 255);
    validateField($data->lastName, "lastName", -1001, "Invalid last name", 1, 63);
    validateField($data->firstName, "firstName", -1002, "Invalid first name", 1, 63);    
    if(!$passwordlessRegistration)
    {
        validateField($data->password, "password", -1003, "password too short", 8, 1024);
    }
            
    if (count($validationErrors) > 0)
    {
        $errorObject                   = new stdClass();
        $errorObject->validationErrors = $validationErrors;
        $errorObject->code             = -1;
        $errorObject->msg              = "Error";
        $errorObject->data             = count($validationErrors) . " validation error(s) found.";
        term(json_encode($errorObject), 0);
    }

    if (!isset($data->country))
    {
        if (isset($data->countryIso)) {
            $data->country = country_code_to_country($data->countryIso);
        }
        else {
            $data->country = "United Kingdom";          // We'll just default these users
        }
    }
    
    if (!isset($data->countryIso)) {
        $data->countryIso = country_name_to_code($data->country);
    }

    validateString($data->country, -1003, "Invalid country", -1, 1024);

    if (isset($data->age)) {
        $data->dob = date("Y-m-d", strtotime("-$data->age year", time()));
    }

    if (!isset($data->dob))
    {
        $data->dob = date("1900-01-01");
    }

    if (!isset($data->displayName)) {
        $data->displayName = $data->firstName . substr($data->lastName, 0, 1);
    }

    // Create a request object for this
    $request              = (object) array();
    $request->loginID     = trim($data->loginID);
    $request->firstName   = $data->firstName;
    $request->lastName    = $data->lastName;
    $request->password    = $passwordlessRegistration ? "" : $data->password;
    $request->country     = $data->country;
    $request->dob         = date($data->dob);
    $request->displayName = $data->displayName;
    $request->avatar      = "";

    if (isset($data->acceptTerms)) {
        $request->acceptTerms = date("Y-m-d H:i:s"); 
    }
    
    $request->acceptContact = (isset($data->acceptContact) && $data->acceptContact === TRUE) ? "true" : "false";
    $request->acceptContactThirdParty = (isset($data->acceptContactThirdParty) && $data->acceptContactThirdParty === TRUE) ? "true" : "false";
    $request->acceptIP = (isset($data->acceptIP) && $data->acceptIP === TRUE) ? "true" : "false";
    $request->acceptLocation = (isset($data->acceptLocation) && $data->acceptLocation === TRUE) ? "true" : "false";
    
    $request->service                 = $service;
    
    if ($data->country)
    {
        $request->registration_source = "web";
    }
    else
    {
        $request->registration_source = "app";
    }

    if (isset($data->source))
    {
        $request->registration_source = $data->source;
    }

    setServiceName($request, $data);

    if (checkIfUserExistsInDB($request->loginID))
    {
        logMsg($data->loginID . " already exists in db!", 2);
        term('{ "validationErrors": [{ "fieldName": "email", "message": "User already exists"}], "errorCode":-3, "msg":"User already exists" }', 0);
    }

    logMsg("Creating a user : " . spPrint($request, 1), 2);
    if (isset($_SERVER['HTTP_USER_AGENT']))
    {
        $request->UA = $_SERVER['HTTP_USER_AGENT'];
    }


    createUserInDB($request,$passwordlessRegistration);
    mailWelcomeEmail($request);

    term(json_encode($request->userData));
}
catch (Exception $ex)
{
    logMsg("Message = [" .$ex->getMessage(). "]  file = [" .$ex->getFile(). "], Line = [" .$ex->getLine(). "]", 1);
    terminate(-500, "something went wrong.");
}