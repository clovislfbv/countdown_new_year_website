<?php
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    $port = getenv('ws_port');
    
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
            
            case "get_default_song":
                get_default_song();
                break;

            case "add_default_song":
                add_default_song();
                break;

            case "get_available_tracks":
                get_available_tracks();
                break;
            
            case "search_songs":
                search_songs();
                break;
            
            case "spo2ytb":
                spo2ytb();
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

    function ensure_song_ws_server_running() {
        $socket = @fsockopen('127.0.0.1', $port, $errno, $errstr, 0.2);
        if ($socket !== false) {
            fclose($socket);
            return;
        }

        // Start once in background when first event needs to be emitted.
        exec('nohup python3 ws_song_events.py > /tmp/ws_song_events.log 2>&1 &');
        usleep(200000);
    }

    function publish_song_requested_event($song_data) {
        if (!is_array($song_data)) {
            return;
        }

        ensure_song_ws_server_running();

        $payload = [
            'type' => 'song_requested',
            'data' => [
                'title' => $song_data['title'] ?? '',
                'url' => $song_data['url'] ?? '',
                'thumbnail' => $song_data['thumbnail'] ?? '',
                'original_file' => $song_data['original_file'] ?? '',
                'final_file' => $song_data['final_file'] ?? '',
                'already_downloaded' => $song_data['already_downloaded'] ?? false,
                'requested_at' => gmdate('c'),
            ]
        ];

        exec('python3 ws_publish.py ' . escapeshellarg(json_encode($payload)) . ' > /dev/null 2>&1 &');
    }

    function get_song(){
        $output=null;
        $retval=null;
        exec('python3 dl_youtube.py ' . escapeshellarg($_POST["url"]), $output, $retval);

        if (!empty($output) && isset($output[0])) {
            $song_data = json_decode($output[0], true);
            if (is_array($song_data) && (($song_data['status'] ?? '') === 'success')) {
                publish_song_requested_event($song_data);
            }
        }

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

    function get_default_song(){
        $output=null;
        $retval=null;
        exec('python3 dl_youtube.py https://www.youtube.com/watch\?v\=dQw4w9WgXcQ\&ab_channel\=RickAstley', $output, $retval);
        $output_json = json_encode($output);
        echo $output_json;
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

    function search_songs() {
        $output=null;
        $retval=null;
        exec('python3 spotify.py ' . escapeshellarg($_POST["query"]), $output, $retval);
        $output_json = json_encode($output);
        echo $output_json;
    }

    function normalize_spotify_input($spotify_input) {
        $spotify_input = trim((string)$spotify_input);

        // Convert URI format like spotify:track:ID into open.spotify.com URL.
        if (strpos($spotify_input, 'spotify:') === 0) {
            $parts = explode(':', $spotify_input);
            if (count($parts) === 3) {
                $entity_type = $parts[1];
                $entity_id = $parts[2];
                return "https://open.spotify.com/{$entity_type}/{$entity_id}";
            }
        }

        return $spotify_input;
    }

    function spotify_to_youtube_url($spotify_input) {
        $spo_url = normalize_spotify_input($spotify_input);
        if ($spo_url === '') {
            return null;
        }

        $output = null;
        $retval = null;
        exec('python3 spo2ytb.py ' . escapeshellarg($spo_url), $output, $retval);

        if (empty($output)) {
            return null;
        }

        $decoded = json_decode(implode("\n", $output), true);
        if (!is_array($decoded) || ($decoded['status'] ?? 'error') !== 'success') {
            return null;
        }

        return $decoded['youtube_url'] ?? null;
    }

    function spo2ytb() {
        $spo_url = $_POST["spo_url"] ?? '';
        $youtube_url = spotify_to_youtube_url($spo_url);

        header('Content-Type: application/json');
        if ($youtube_url !== null) {
            echo json_encode([
                'results' => [
                    [
                        'url' => $youtube_url,
                    ]
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to convert Spotify URL to YouTube URL']);
        }
    }
?>