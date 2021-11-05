<?php

require './vendor/autoload.php';
require_once 'keys.php';
require_once 'basicFunctions.php';
require_once 'conversionFunctions.php';
require_once 'ampModules.php';
require_once 'curl.php';
require_once 'news.php';

logPost("convert-html-to-amp.php");
logMsg("*** Launching HTML to AMP article conversion process ***");
$startTime = microtime(true);

$templateFiles = array();
$templateFolderContents = array_diff(scandir($templatesFolder), array('..', '.'));
foreach($templateFolderContents as $templateFile) {
    $key = substr($templateFile, 0, (strrpos($templateFile, ".")));
    $templateFiles[$key] = $templatesFolder . "/" . $templateFile;
}

$ampModules = 0;
$articleIndex = '';

$queries = array();
if (isset($_SERVER["QUERY_STRING"])) {
    parse_str($_SERVER["QUERY_STRING"], $queries);
}

$forceUpdate = isset($queries["force"]) && $queries["force"] != 0;
$debug = isset($queries["debug"]) && $queries["debug"] != 0;
$generateNewsItems = isset($queries["generate_news"]);
$generateIndex = isset($queries["generate_index"]);

if (isset($queries["stage"])){
    $f1_design_url = $stage_url_root . $stage_path;
}

if ($generateIndex){
    logMsg("Will generate index page...");
}

if (isset($queries["article_id"])) {
    $id = $queries["article_id"];
    logMsg("Fetching article: $id");
    getArticle($id, $result);
    $article = json_decode($result);
    if (isset($article->error)) {
        logMsg("Article id [$id] not found", 1);
        die;
    }
    convertArticle($article);

} else {
    $articleCount = 10;
    if (isset($queries["count"])) {
        if ($queries["count"] == "all") {
            $articleCount = getArticleCount();
        } else {
            $articleCount = $queries["count"];
        }
    }
    
    $limit = 10;
    if (isset($queries["limit"])) {
        $limit = $queries["limit"];
    }
    if ($limit > $articleCount) {
        $limit = $articleCount;
    }

    $lastUpdated = strtotime('2016-12-31');
    $date = getFileData($lastUpdatedFile);
    if (!$forceUpdate) {
        if ($date) {
            $lastUpdated = strtotime($date);
            logMsg('Article AMP conversion last performed: ' . date('d-m-Y \a\t H:i:s', $lastUpdated)); 
        } else {
            logMsg("Unable to find when last updated, using default date of ".date('d-m-Y', $lastUpdated));
        }
    } else {
        logMsg("** Forcing update of articles **");
    }
    
    logMsg("Attempting to convert $articleCount articles, fetching $limit at a time");
    // batch process for all articles ($limit at a time).
    $generatedArticles= array();
    $count = 1;
    for ($i = 0; $i < $articleCount; $i += $limit){
        
        // return with limit and offset.
        getArticles($limit, $i, $result);

        // decode json response and convert to array.
        $returnArr = (array)json_decode($result);
 
        // items is what we care about.
        $objItems = &$returnArr['items'];
        
        $curlArray = array();
        logMsg("* Starting batch: $count");
        logMsg("Fetching...");
        foreach($objItems as $item){
            $curlArray[] = buildCurlRequest($endpoint . '/' . $item->id);
        }

        $articles = multiCurlRequest($curlArray);
        logMsg("Converting...");
        usort($articles, "compareDates");
        foreach($articles as $article){
            if (!isset($article->error)) {
                $articleDate = strtotime($article->updatedAt);
                if ($articleDate > $lastUpdated || $forceUpdate) {
                    if (convertArticle($article)){
                        // Success, Add the article to the index page.   
                        // Find the matching id returned from curl.
                        if ($generateIndex || $generateNewsItems) {
                            foreach($objItems as $item){
                                if ($item->id == $article->id){
                                    if ($generateIndex){
                                        $filename = generateArticleName($article);
                                        addArticleToIndex($filename, $item);
                                    }
                                    // Push to list of completed articles
                                    if ($generateNewsItems){
                                        $generatedArticles[] = $item;
                                    }
                                    break;
                                }
                            }
                        }
                    }
                } else {
                    logMsg("Stopping conversion as articles are now up to date", 3);
                    break 2;
                }
            } 
        }
        $count++;
    }
    $handle = fopen($lastUpdatedFile, 'w') or die('Cannot open file:  ' . $lastUpdatedFile);
    fwrite($handle, date("Y-m-d H:i:s", time()));
    fclose($handle);
    $elapsed = microtime(true) - $startTime;

    // Write index 
    generateIndexPage(); 

    // Generate newsitemsp 
    if ($generateNewsItems){
        // Generate New Items
        logMsg("Generating news items json! \n");
        generateNewsItems($generatedArticles);
        logMsg("News Items generated! \n");
    }

    logMsg("Time elapsed: " . round($elapsed, 2) . " seconds");
}

function generateIndexPage(){
    global $articleIndex, $templateFiles, $f1_design_url;

    $indexContents = getFileData($templateFiles["index_template"]);
    setTag("f1_design_url", $f1_design_url, $indexContents);
    setTag("article_entries", $articleIndex, $indexContents);

    $indexPageFile = "index.amp.html";
    $handle = fopen($indexPageFile, 'w') or die('Cannot open file:  ' . $indexPageFile);
    fwrite($handle, $indexContents);
    fclose($handle);
}

function compareDates($a, $b) {
    $t1 = strtotime($a->updatedAt);
    $t2 = strtotime($b->updatedAt);
    return ($t2 - $t1);
}

// Returns the generated file name for the article
function generateArticleName(&$article){
    return "article.".$article->slug.".".$article->id.".amp.html";
}

function convertArticle(&$article) {
    global $amp_folder, $templateFiles, $debug, $f1_url_root, $f1_design_url;

    logMsg("Working on article id: " . $article->id);
    logMsg("Article last updated: " . date('Y-m-d H:i:s', strtotime($article->updatedAt)));
    $error = false;

    $f1_latest_url = $f1_url_root . "en/latest/";
    
    // example filename:
    // -  article.mercedes-welcome-hamilton-home-with-guard-of-honour.5RVSIgelXicec4osusE4wa.amp.html
    $filename = generateArticleName($article);
    $liveUrl = $f1_latest_url . $filename;

    // add fallbacks if value isn't set.
    $title = isset($article->title) ? $article->title : 'Formula 1';
    $author = isset($article->author->fullName) ? $article->author->fullName : 'Formula 1';
    $canonicalUrl = isset($article->canonicalUrl) ? $article->canonicalUrl : $f1_latest_url;
    $updatedAt = isset($article->updatedAt) ? $article->updatedAt : $article->createdAt;
    $publishedDate = isset($article->createdAt) ? $article->createdAt : 0;
    $articleImage = isset($article->thumbnail) ? $article->thumbnail->image->url : $f1_design_url.'icon128x128.png';

    $articleContents = getFileData($templateFiles["article_template"]);
    if (!$articleContents) {
        logMsg("Unable to open: {$templateFiles["article_template"]}; terminating process.", 1);
        die;
    }

    $customCSS = getFileData($templateFiles["custom_css"]);
    if (!$customCSS) {
        logMsg("Unable to open: {$templateFiles["custom_css"]}; terminating process.", 1);
        die;
    }
    $css = "<style amp-custom>";
    if (!$debug) {
        $css .= trim(preg_replace('/\s+/', ' ', $customCSS)); // minify the css outside of debug
    } else {
        $css .= $customCSS;
    }
    $css .= "</style>";

    // Find and replace tags in head
    setTag("meta_title", urlencode($title), $articleContents);
    setTag("title", $title, $articleContents);
    setTag("author", $author, $articleContents);
    setTag("live_url", $liveUrl, $articleContents);
    setTag("canonical_url", $canonicalUrl, $articleContents);
    setTag("modified_date", date("j F Y", strtotime($updatedAt)), $articleContents);
    setTag("published_date", date("j F Y", strtotime($publishedDate)), $articleContents);
    setTag("meta_description",isset($article->metaDescription) ? urlencode($article->metaDescription) : urlencode("No Description!"), $articleContents);
    setTag("custom_css", $css, $articleContents);
    setTag("article_image", $articleImage, $articleContents);
    setTag("f1_url_root", $f1_url_root, $articleContents);

    // check for url queries for header and use a header template if specified
    $tag = "header";

    if (getVar("header")){
        $header = getVar("header");
        if ($header == "none") {
            setTag($tag, "", $articleContents); 
        }
        else {
            injectTemplateHTML($tag, $templateFiles[$header], $articleContents);
        }
    } else {
        // default header template
        injectTemplateHTML($tag, $templateFiles["header_sidebar"], $articleContents); 
    }

    /// Convert body & hero section fields
    convertContent($article, $articleContents, $error);

    if(isset($article->articleTags) && sizeof($article->articleTags) > 0){
        convertArticleTags($article->articleTags, $articleContents);
    } else {
        setTag("article_tags", "", $articleContents);
    }

    if (getVar("footer") == "none"){
        if (isset($article->relatedArticles) && sizeof($article->relatedArticles) > 0 ){
            convertRelatedArticles($article->relatedArticles, $articleContents);
        } else {
            setTag("related_articles", "", $articleContents);
        }

        injectTemplateHTML("footer", $templateFiles["footer_template"], $articleContents);
    }

    setTag("f1_design_url", $f1_design_url, $articleContents);
    setTag("current_year", date("Y"), $articleContents );
    
    if (!$error) {
        // create amp html file.
        $file = fopen($amp_folder . $filename, "w");

        /// Write out the final output here!
        fwrite($file, $articleContents);

        fclose($file);
        logMsg("Article generated [$filename]", 3);
    }
    else {
        logMsg("Article [$filename] not generated", 1);
        return false; 
    }
    return true;
}

/// Adds the specified page to the index page
function addArticleToIndex($filename, &$article){
    global $articleIndex, $amp_folder, $f1_url_root; 

    $link = $amp_folder . $filename;
    $imgURL = $f1_url_root.'etc/designs/fom-website/images/patterns/f1-cc-skeleton.jpg';
    if (isset($article->thumbnail)){
        $imgURL = $article->thumbnail->image->url;
    }
    $articleIndex .='
        <div class="articleContainer">
            <div class="articleImage"><amp-img 
                src="'.$imgURL.'"  
                width="160" 
                height="90" 
                alt="preview"> </amp-img> </div>
            <div class="articleTitle"><a href="'.$link.'">'.$article->title.'</a></div>
            <div><p> </p></div>
        </div>
    ';
}

function convertContent($article, &$articleContents, &$error){
    global $ampModules;
    // Article contents
    // body.
    $articleBodyString = "";
    $heroString = "";
    $ampModuleScript = "";
    $ampModules = 0;

    // Exist on all pages 
    addAmpModule(AmpModules::AMP_SIDEBAR, 'amp-sidebar' , $ampModuleScript);
    
    if(isset($article->hero)){
        $hero = $article->hero; 

        $err = !(processContent($hero, $articleBodyString, $ampModuleScript, 'hero'));
        if ($err){
            logMsg ("Unhandled hero type: ".$hero->contentType."\n",1);
            $error = true;
        }
    }
    if(isset($article->body)){
        $bodies = $article->body;

        // Iterate over body & do conversion! 
        foreach ($bodies as $body) {
            // check content type 
            if(isset($body->contentType)){
                $err = !(processContent($body, $articleBodyString, $ampModuleScript, 'body'));
                if ($err){
                    logMsg ("Unhandled content type: ".$body->contentType."\n",1);
                    $error = true;
                }
            }
        }
    }

    setTag("hero_section", $heroString, $articleContents); 
    setTag("article_body", $articleBodyString, $articleContents);
    setTag("amp_modules", $ampModuleScript, $articleContents);

}

function convertArticleTags($articleTags, &$articleContents) {
    $articleTagsString = '<ul class="f1-tag-list">';
    foreach ($articleTags as $tag) {  
        $articleTagsString .= '<li><a href="/en/latest/tags.'.$tag->fields->tagName.'.'.$tag->id.'.html" class="tag" data-tag="'.$tag->fields->tagName.'">'.$tag->fields->tagName.'</a></li>';        
    }
    $articleTagsString .= "\n</ul>";

    setTag("article_tags", $articleTagsString, $articleContents);
}

function convertRelatedArticles($relatedArticles, &$articleContents) {
    global $f1_url_root;
    
    $relatedArticlesString = '<div class="f1-related-articles"><h2>You May Also Like</h2>';
    // show 4 related articles.
    for ($i=0; $i <= 3; $i++){

        // STILL TO DO: 
        // - IF THUMBNAIL IS VIDEO... IGNORE!
        // - CHECK breaking FLAG AND ADD CSS CLASS (INVERTED).

        $imgSrc = isset($relatedArticles[$i]->thumbnail->image->url) ? $relatedArticles[$i]->thumbnail->image->url : $f1_url_root.'etc/designs/fom-website/images/patterns/f1-cc-skeleton.jpg';
        $relatedArticlesString .= '<a href="/en/latest/article'.$relatedArticles[$i]->slug.'.'.$relatedArticles[$i]->id.'.html" class="rel-art--wrapper">';
        $relatedArticlesString .= '<div class="rel-art--img"><amp-img src="'.$imgSrc.'" height="82" width="146" layout="responsive"></amp-img></div>';
        $relatedArticlesString .= '<div class="rel-art--caption"><p class="misc--tag">'.$relatedArticles[$i]->articleType.'</p>';
        $relatedArticlesString .= '<p class="no-margin">'.$relatedArticles[$i]->title.'</p></div></a>';
    }
    $relatedArticlesString .= "\n</div>";

    setTag("related_articles", $relatedArticlesString, $articleContents);
}

function injectTemplateHTML($tag, $htmlFile, &$articleContents) {
    $htmlFile = getFileData($htmlFile);
    if (!$htmlFile) {
        $htmlFile = "";
    }
    setTag($tag, $htmlFile, $articleContents);   
}

function setTag($tagName, $replace, &$contents ){
    $contents = str_replace("replace:{".$tagName."}", $replace ,$contents);
    return $contents;
}
