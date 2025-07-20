<?php
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }
    
    if (isset($_POST["action"])){
        switch ($_POST["action"]) {
            case "create_new_page":
                create_new_page();
                break;
            
            case "delete_page":
                delete_page();
                break;
            
            case "get_song":
                get_song();
                break;
            
            case "get_default_songs":
                get_default_songs();
                break;

            case "add_default_song":
                add_default_song();
                break;

            case "get_available_tracks":
                get_available_tracks();
                break;
        }
    }

    function create_new_page(){
        $page_name = $_POST["page_name"];
        $page_content = $_POST["page_content"];
        $file = fopen("../html/$page_name.html", "w");
        fwrite($file, $page_content);
        fclose($file);
    }

    function delete_page(){
        $page_name = $_POST["page_name"];
        unlink("../html/$page_name.html");
    }

    function get_song(){
        $output=null;
        $retval=null;
        exec('python3 dl_youtube.py https://www.youtube.com/watch\?v\=dQw4w9WgXcQ\&ab_channel\=RickAstley', $output, $retval);
        $output_json = json_encode($output);
        echo $output_json;
    }

    function get_available_tracks(){
        session_start();
        $output=null;
        $retval=null;
        $query = $_POST["q"];
        for ($i = 0; $i < strlen($query); $i++){
            if ($query[$i] == " "){
                $query[$i] = "+";
            }
        }
        $bearer_token = $_SESSION["bearer_token"];
        $request = "curl --request GET --url 'https://api.spotify.com/v1/search?q=" . $query . "&type=track' --header 'Authorization: Bearer " . $bearer_token . "'";
        print_r($request);
        exec($request, $output, $retval);
        echo json_encode($output);
    }

    function get_default_songs(){
        
    }

    function add_default_song(){
        $url = $_POST["url_song"];
        $video_id = explode("?v=", $url)[1];
        $id = explode("&", $video_id)[0];
        $test = explode('<title>', file_get_contents("https://www.youtube.com/watch?v=VideoIDHERE"))[1];
        print_r($test);

        $title = explode('</title>', $test)[0];
        print_r($title);

        $request = "INSERT INTO default_songs (url, title) VALUES ('" . $url . "', '" . $title . "')";
        $GLOBALS['conn']->query($request);
    }
?>