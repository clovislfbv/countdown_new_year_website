<?php
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    $port = getenv('ws_port');
    $python_bin = '/opt/venv/bin/python';
    
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

            case "search_spotify_songs":
                search_spotify_songs();
                break;

            case "search_youtube_songs":
                search_youtube_songs();
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
        global $port;
        $ws_port = (int)($port ?: 8765);
        $socket = @fsockopen('127.0.0.1', $ws_port, $errno, $errstr, 0.2);
        if ($socket !== false) {
            fclose($socket);
            return;
        }

        // Start once in background when first event needs to be emitted.
        exec('nohup /opt/venv/bin/python ws_song_events.py >/dev/null 2>&1 &');
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

        exec('/opt/venv/bin/python ws_publish.py ' . escapeshellarg(json_encode($payload)) . ' > /dev/null 2>&1 &');
    }

    function normalize_downloaded_filename($value) {
        $value = trim((string)$value);
        $value = preg_replace('/[\\/:*?"<>|]/', '', $value);
        $value = preg_replace('/\s+/', ' ', $value);
        return $value;
    }
    function build_spotdl_song_data($output, $source_url) {
        $downloaded_title = '';
        $youtube_url = '';
        $already_downloaded = false;

        foreach ($output as $line) {
            if (!is_string($line)) {
                continue;
            }

            // Case 1: Downloaded "Titre": URL
            if (stripos($line, 'Downloaded') !== false) {
                // Extract title between quotes
                if (preg_match('/Downloaded\s+"([^"]+)"/', $line, $matches)) {
                    $downloaded_title = $matches[1];
                }
                // Extract YouTube URL
                if (preg_match('/https?:\/\/[^\s]+/', $line, $matches)) {
                    $youtube_url = $matches[0];
                }
            }

            // Case 2: Skipping Titre (already downloaded)
            if (stripos($line, 'Skipping') !== false) {
                $already_downloaded = true;
                // Extract title: "Skipping Ninho - PILIER (file already exists) (duplicate)"
                if (preg_match('/Skipping\s+(.+?)\s*\(/', $line, $matches)) {
                    $downloaded_title = trim($matches[1]);
                }
            }

            if (!$youtube_url && preg_match('/^https?:\/\/.+$/', trim($line))) {
                $youtube_url = trim($line);
            }
        }

        // If no title found, extraction failed
        if (empty($downloaded_title)) {
            return [
                'status' => 'error',
                'message' => 'Could not extract song title from spotdl output.',
                'url' => $source_url,
                'source' => 'spotify',
            ];
        }

        // Try to find the file: first in new files, then by title glob
        $latest_file = '/var/www/html/downloads' . '/' . $downloaded_title . '.mp3';

        $relative_file = preg_replace('#^/var/www/html/#', '', $latest_file);

        return [
            'status' => 'success',
            'title' => $downloaded_title,
            'artist' => 'Imported from Spotify',
            'url' => $source_url,
            'thumbnail' => '',
            'original_file' => $relative_file,
            'final_file' => $latest_file,
            'already_downloaded' => $already_downloaded,
            'source' => 'spotify',
            'youtube_url' => $youtube_url,
        ];
    }

    function get_song(){
        $output=null;
        $retval=null;
        $url = $_POST["url"] ?? '';

        if (is_spotify_url($url)) {
            $spotdl_env = 'HOME=/tmp/spotdl XDG_CONFIG_HOME=/tmp/spotdl/.config XDG_CACHE_HOME=/tmp/spotdl/.cache';
            exec($spotdl_env . ' sh -lc ' . escapeshellarg('cd /var/www/html/downloads && /opt/venv/bin/spotdl ' . escapeshellarg($url)), $output, $retval);

            $song_data = build_spotdl_song_data($output, $url);
            if (is_array($song_data) && ($song_data['status'] ?? '') === 'success') {
                publish_song_requested_event($song_data);
            }

            echo json_encode([json_encode($song_data)]);
            return;
        } else {
            exec('/opt/venv/bin/python dl_youtube.py ' . escapeshellarg($url), $output, $retval);
        }

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
        exec('/opt/venv/bin/python dl_youtube.py https://www.youtube.com/watch\?v\=dQw4w9WgXcQ\&ab_channel\=RickAstley', $output, $retval);
        $output_json = json_encode($output);
        echo $output_json;
    }

    function run_python_json_script($script, $argument) {
        $output = null;
        $retval = null;
        exec('/opt/venv/bin/python ' . escapeshellarg($script) . ' ' . escapeshellarg($argument), $output, $retval);

        if (empty($output)) {
            return null;
        }

        $decoded = json_decode(implode("\n", $output), true);
        if (!is_array($decoded)) {
            return null;
        }

        return $decoded;
    }

    function normalize_spotify_search_results($items) {
        $results = [];

        if (!is_array($items)) {
            return $results;
        }

        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $url = $item['url'] ?? '';
            $results[] = [
                'kind' => 'spotify',
                'source' => 'spotify',
                'title' => $item['name'] ?? $item['title'] ?? 'Unknown Title',
                'artist' => $item['artist'] ?? 'Spotify',
                'album_image' => $item['album_image'] ?? '',
                'url' => $url,
                'value' => $url,
                'id' => $item['id'] ?? '',
            ];
        }

        return $results;
    }

    function normalize_youtube_search_results($items) {
        $results = [];

        if (!is_array($items)) {
            return $results;
        }

        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $url = $item['url'] ?? '';
            $results[] = [
                'kind' => 'youtube',
                'source' => 'youtube',
                'title' => $item['title'] ?? $item['name'] ?? 'Unknown Title',
                'artist' => $item['artist'] ?? $item['channel'] ?? 'YouTube',
                'thumbnail' => $item['thumbnail'] ?? '',
                'url' => $url,
                'value' => $url,
            ];
        }

        return $results;
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
        $query = trim($_POST["query"] ?? '');
        $search_results = [];
        $sources = [];

        if ($query !== '') {
            $spotify_results = run_python_json_script('spotify.py', $query);
            if (is_array($spotify_results) && count($spotify_results) > 0) {
                $search_results = normalize_spotify_search_results($spotify_results);
                $sources[] = 'spotify';
            }

            $youtube_results = run_python_json_script('youtube_search.py', $query);
            if (is_array($youtube_results) && count($youtube_results) > 0) {
                $search_results = array_merge($search_results, normalize_youtube_search_results($youtube_results));
                $sources[] = 'youtube';
            }
        }

        if (count($sources) > 1) {
            $source = 'mixed';
        } elseif (count($sources) === 1) {
            $source = $sources[0];
        } else {
            $source = 'none';
        }

        if (empty($search_results)) {
            $source = 'none';
        }

        $response = [
            'source' => $source,
            'results' => $search_results,
        ];

        echo json_encode([json_encode($response)]);
    }

    function search_spotify_songs() {
        $query = trim($_POST["query"] ?? '');
        $search_results = [];

        if ($query !== '') {
            $spotify_results = run_python_json_script('spotify.py', $query);
            if (is_array($spotify_results) && count($spotify_results) > 0) {
                $search_results = normalize_spotify_search_results($spotify_results);
            }
        }

        $response = [
            'source' => 'spotify',
            'results' => $search_results,
        ];

        echo json_encode([json_encode($response)]);
    }

    function search_youtube_songs() {
        $query = trim($_POST["query"] ?? '');
        $search_results = [];

        if ($query !== '') {
            $youtube_results = run_python_json_script('youtube_search.py', $query);
            if (is_array($youtube_results) && count($youtube_results) > 0) {
                $search_results = normalize_youtube_search_results($youtube_results);
            }
        }

        $response = [
            'source' => 'youtube',
            'results' => $search_results,
        ];

        echo json_encode([json_encode($response)]);
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

    function is_spotify_url($value) {
        $value = trim((string)$value);
        return $value !== '' && preg_match('/^(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify:)/i', $value) === 1;
    }

    function spotify_to_youtube_url($spotify_input) {
        $spo_url = normalize_spotify_input($spotify_input);
        if ($spo_url === '') {
            return null;
        }

        $output = null;
        $retval = null;
        exec('/opt/venv/bin/python spo2ytb.py ' . escapeshellarg($spo_url), $output, $retval);

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