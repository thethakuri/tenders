<?php

/* DropBox */
require_once "dropbox-sdk/Dropbox/autoload.php";
use \Dropbox as dbx;
$accessToken = $_ENV["ACCESS_TOKEN"];
$appInfo = dbx\AppInfo::loadFromJsonFile("config.json");
$dbxClient = new dbx\Client($accessToken, "tenderPortal/1.0");
$accountInfo = $dbxClient->getAccountInfo();

/* Connect to MongoDB */
$connection = new MongoClient(get_uri());
$collection = $connection->tenders->createCollection('listing');

/* stop words used in tender categories */
$stop_words = array("and", "the", "works", "of", "services", "others", ":", "items", "non", "other", "various");

/* Connect to gmail */
$hostname = $_ENV["GMAIL_HOST"];
$username = $_ENV["GMAIL_USER"];
$password = $_ENV["GMAIL_PASSWD"];

/* try to connect */
$inbox = imap_open($hostname,$username,$password) or die('Cannot connect to Gmail: ' . imap_last_error());

/* Sources from where we get mails regarding tenders */
$sources = array('nicg', 'ucil', 'gepson', 'nea', 'tendernotice');
foreach($sources as $source){
    switch ($source) {
        case 'nicg':
            /* grab emails */
            $emails = imap_search($inbox, 'BODY "NEPAL INVESTMENT CONSULTANTS GROUP" SUBJECT "Tenders" UNSEEN');
            /* if emails are returned, grab em... */
            if($emails){ 
                grabNICG($emails);
            }
            break;
        
        default:
            # code...
            break;
    }
}

/* Function to parse emails from Nepal Investment Consultancy Group */
function grabNICG($emails){

    global $inbox, $stop_words, $collection, $dbxClient;
    $doc_count = 0;
    
    /* put the newest emails on top */
    rsort($emails);
    
    /* for every email... */
    foreach($emails as $email) {

        $headerInfo = imap_headerinfo($inbox,$email);
        $dBFolder =  preg_replace("/[^A-Za-z0-9 ]/", '', $headerInfo->subject);

        /********************* ATTACHMENTS **************************/
        /************************************************************/

        /* get mail structure */
        $structure = imap_fetchstructure($inbox, $email);
 
        $attachments = array();
        $dw_link = array(); //direct links array
 
        /* if any attachments found... */
        if(isset($structure->parts) && count($structure->parts)) 
        {
            for($i = 0; $i < count($structure->parts); $i++) 
            {
                $attachments[$i] = array(
                    'is_attachment' => false,
                    'filename' => '',
                    'name' => '',
                    'attachment' => ''
                );
 
                if($structure->parts[$i]->ifdparameters) 
                {
                    foreach($structure->parts[$i]->dparameters as $object) 
                    {
                        if(strtolower($object->attribute) == 'filename') 
                        {
                            $attachments[$i]['is_attachment'] = true;
                            $attachments[$i]['filename'] = $object->value;
                        }
                    }
                }
 
                if($structure->parts[$i]->ifparameters) 
                {
                    foreach($structure->parts[$i]->parameters as $object) 
                    {
                        if(strtolower($object->attribute) == 'name') 
                        {
                            $attachments[$i]['is_attachment'] = true;
                            $attachments[$i]['name'] = $object->value;
                        }
                    }
                }
 
                if($attachments[$i]['is_attachment']) 
                {
                    $attachments[$i]['attachment'] = imap_fetchbody($inbox, $email, $i+1);
 
                    /* 4 = QUOTED-PRINTABLE encoding */
                    if($structure->parts[$i]->encoding == 3) 
                    { 
                        $attachments[$i]['attachment'] = base64_decode($attachments[$i]['attachment']);
                    }
                    /* 3 = BASE64 encoding */
                    elseif($structure->parts[$i]->encoding == 4) 
                    { 
                        $attachments[$i]['attachment'] = quoted_printable_decode($attachments[$i]['attachment']);
                    }
                }
            }
        }
 
        /* iterate through each attachment and save it */
        foreach($attachments as $attachment)
        {
            if($attachment['is_attachment'] == 1)
            {
                $filename = $attachment['name'];
                if(empty($filename)) $filename = $attachment['filename'];
 
                if(empty($filename)) $filename = time() . ".dat";

                $imgNum = filter_var($attachment['name'], FILTER_SANITIZE_NUMBER_INT); //get the image no. from filename
                
                $img = $email . "-" . $filename;
                $fp = fopen($img, "w+");
                fwrite($fp, $attachment['attachment']);               
                fclose($fp);

                compressImage($img, $filename, 50);
                unlink($img); //delete from local server

                // transfer the file to dropbox
                $f = fopen($filename, "rb");
                $pathToImg = '/'.$dBFolder.'/'.$filename;
                $result = $dbxClient->uploadFile($pathToImg, dbx\WriteMode::force(), $f);
                fclose($f);

                //delete the file on local server
                unlink($filename);

                // Get file info from Dropbox
                $file = $dbxClient->getMetadata($pathToImg);

                // sending the direct link:
                $dropboxPath = $file['path'];
                $pathError = dbx\Path::findError($dropboxPath);
                if ($pathError !== null) {
                    fwrite(STDERR, "Invalid <dropbox-path>: $pathError\n");
                    die;
                }

                // The $link is an array!
                $link = $dbxClient->createShareableLink($dropboxPath);
                // adding ?dl=1 / ?raw=1 to the link will force the file to be downloaded / rendered by the client.
                // $dw_link[$imgNum] = $link[0]."?raw=1"; //createTemporaryDirectLink()
                $dw_link[$imgNum] = strtok($link, '?')."?raw=1";


            }
 
        }
        /*********************END OF ATTACHMENTS*******************************/


        /*********************MAIN TEXT*****************************************/
        
        $json = array(); //JSON to hold tenders information
        $category = array(); // Category information included at the top row
        
        
        $message = imap_fetchbody($inbox, $email, 1.2); // 1.2 - TEXT/HTML
        if ($message == "") { // no attachments is the usual cause of this
            $message = imap_fetchbody($inbox, $email, 1); // 1 - MULTIPART/ALTERNATIVE
        }
        
        /* Convert or remove encodings  */
        $html = decode7Bit($message);
        
        /* Dom element manipulation api for php
           Using php DOM Document to parse the html */
        $dom = new DOMDocument();
        $dom->loadHTML($html);  
        $dom->preserveWhiteSpace = false;
        
        /* remove empty nodes (tags) */
        $xpath = new DOMXPath($dom);
        foreach ($xpath->query('//*') as $node) {
            if (!count($node->childNodes) || trim($node->nodeValue, " \n\r\t\0\xC2\xA0")==='') {
                $node->parentNode->removeChild($node);
            }
        }
        
        /* get <tr> tags that contains each row of the table */
        $rows = $dom->getElementsByTagName('tr');
        
        /* Each row consists a single tender description or the category information */
        foreach($rows as $row){
            
            /* Each feature is within <td> */
            $columns = $row->getElementsByTagName('td');
            $clen = $columns->length;
            
            if($clen > 0){
                $tender = array(array()); //array to hold individual tender info
                
                $col_count = 0; // count no. of columns in a given row
                foreach($columns as $column){
                    
                    if($clen === 1){ // if given column only has one dimension - category
                        
                        $category = array(); //empty array
                        // Break down category to useful terms by removing duplicates and stop-words
                        $category = preg_split( "/(\s|&|,|\/|\\|and)/", $column->nodeValue );
                        $category = array_map('strtolower', $category);
                        
                        foreach($category as &$cword){ //assign value by reference '&' to modify
                            if(in_array($cword, $stop_words)){
                                $cword = '';
                            }
                            else $cword = preg_replace("'[^A-Za-z0-9-]'", '', $cword); //remove non alphanumeric characters
                        }
                        $category = array_unique(array_filter($category));
                    }
                    
                    // given row lists tender
                    // Features:  S.N, Caller's Name and Address, Items, Notice Published Date, Publication Daily, Last Date of Submission and Remark
                    else{
                        // given column has tender description with 6 dimensions
                        foreach ($column->childNodes as $item) {
                            // check if each td has childNodes like <font> or <span>
                            if($item->hasChildNodes()){
                                $children = $item->childNodes;
                                /* Some columns have multiple tags eg. Publication Date & Daily*/
                                foreach ($children as $child) {
                                    $value = trim($child->nodeValue); //remove whitespaces
                                    /* check if given dimension has info or is an integer */
                                    if(strlen($value) >= 3 || filter_var(intval($value), FILTER_VALIDATE_INT)){
                                        /* remove newline and other characters that appear in the text before pushing into the array */
                                        $tender[$col_count][] = str_replace(array("\n","\t","\r"), "", $value);
                                    }
                                    else break 2; //break out of both foreach statements
                                }
                            }
                        }
                        ++$col_count;
                    }
                }

                /* Push tender information into json format array*/
                if(count($tender) === 6 && filter_var(intval($tender[0][0]), FILTER_VALIDATE_INT)){

                    $pubDate = DateTime::createFromFormat('!d/m/Y', $tender[3][0]);
                    $subDate = DateTime::createFromFormat('!d/m/Y', $tender[4][0]);

                    if($pubDate instanceof DateTime && $subDate instanceof DateTime){

                        $extraInfo = count($tender[2]) === 2; // sometimes tender name field has extra information
                        $sn = intval($tender[0][0]); // serial no
                        array_push($json, array(
                            'sn' => $sn, // serial no.
                            'caller' => $tender[1][0], // tender caller
                            'item' => ($extraInfo) ? implode(' - ', $tender[2]) : $tender[2][0], // tender title + extra description (if provided)
                            'pubDate' => new MongoDate($pubDate->setTimeZone(new DateTimeZone('Asia/Kathmandu'))->getTimestamp()), // publication date
                            'pubDaily' => $tender[3][1], // publication daily
                            'subDate' => new MongoDate($subDate->setTimeZone(new DateTimeZone('Asia/Kathmandu'))->getTimestamp()), // last date of submission
                            'remarks' => $tender[5][0], // remarks eg. "tender", "quotation"
                            'category' => array_values($category),// categories
                            'img' => isset($dw_link[$sn]) ? $dw_link[$sn] : ''  //paper cutting image of the posting
                        ));
                    }
                }
            }
        } // end of tender collection and json formatting
        
        /* Insert into mongodb */
        if (count($json) > 1){
            //$collection->batchInsert($json);
            foreach ($json as $item) {
                $criteria = array("item"=>$item['item'], "caller"=>$item['caller'], "pubDate"=>$item['pubDate']);
                $collection->update($criteria, $item, array("upsert" => true));
            }
        }
        $doc_count += count($json); //total docs inserted - can be returned with this function
    }
    return;
} // end of function grabNICG

// close the connections
imap_expunge($inbox);
imap_close($inbox);
$connection->close();



/************************  HELPER FUNCTIONS  *********************************/

//Image Compression
function compressImage($source, $destination, $quality){
    $info = getimagesize($source);

    if ($info['mime'] == 'image/jpeg') 
        $image = imagecreatefromjpeg($source);

    elseif ($info['mime'] == 'image/gif') 
        $image = imagecreatefromgif($source);

    elseif ($info['mime'] == 'image/png') 
        $image = imagecreatefrompng($source);

    imagejpeg($image, $destination, $quality);

    return $destination;
}

// Function to check if given string qualifies to be a date
function verifyDate($date){
    return DateTime::createFromFormat('d/m/Y', $date);
}

// remove encryptions from email
function decode7Bit($text)
{
    // If there are no spaces on the first line, assume that the body is
    // actually base64-encoded, and decode it.
    $lines = explode("\r\n", $text);
    $first_line_words = explode(' ', $lines[0]);
    if ($first_line_words[0] == $lines[0]) {
        $text = base64_decode($text);
    }

    // Manually convert common encoded characters into their UTF-8 equivalents.
    $characters = array(
        '3D' => '', //email 8-bit encoding on tags - threw DOM error
        '=E2=80=93' => '-', // dash
        '=C2' => '', // joined line.
        '=20' => ' ', // space.
        '=E2=80=99' => "'", // single quote.
        '=0A' => "\r\n", // line break.
        '=A0' => ' ', // non-breaking space.
        '=C2=A0' => ' ', // non-breaking space.
        "=\r\n" => '', // joined line.
        '=E2=80=A6' => '…', // ellipsis.
        '=E2=80=A2' => '•' // bullet.
    );

    // Loop through the encoded characters and replace any that are found.
    foreach ($characters as $key => $value) {
        $text = str_replace($key, $value, $text);
    }
    // When devnagari font is used, imap encodes that into 7-bit and it appears as
    // '=E0=A4=9C=E0=A4=82=E0=A4=97=E0=A5=80' => 'जंगी',
    // '=E0=A4=85=E0=A4=A1=E0=A5=8D=E0=A4=A1=E0=A4=BE' => 'अड्डा'   
    // Since it is rare occurence, its better to remove rows(tender) with such characters
    // Here I have just replaced that with empty string so that it will be removed later on
    // Clearout anything that starts with '=' and is followed by number or alphabert
    $text = preg_replace('/=\w[^<]*/', '', $text); // [^<] is a character class, it matches everything but <

    return $text;
}
/* MongoDB credentials */
function get_uri(){
    $dbhost = $_ENV["TENDERS_DB_HOST"];
    $dbuser = $_ENV["TENDERS_DB_USERNAME"];
    $dbpasswd = $_ENV["TENDERS_DB_PASSWORD"];
    $dbport = $_ENV["TENDERS_DB_PORT"];    
    return "mongodb://" . $dbuser . ":" . $dbpasswd . "@" . $dbhost . ":" . $dbport;
}

?>