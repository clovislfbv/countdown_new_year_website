<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" type="text/css" href="../css/bootstrap/bootstrap.min.css">
    <link rel="stylesheet" type="text/css" href="../css/mdb.min.css">
    <link rel="stylesheet" type="text/css" href="../css/index.css">
    <script src="../js/bootstrap/bootstrap.min.js"></script>
    <script src="../js/jquery.js"></script>
    <script src="../js/jquery.qrcode.min.js"></script>
    <script type="module" src="../js/mdb.umd.min.js"></script>
    <script src="../js/script_website.js" type="module"></script>
    <title>Countdown to the New Year !!</title>
</head>
<body>
    <div class="main">
        <div class="counter">
            <div class="title" data-toggle="animation" data-mdb-animation-start='onLoad' data-mdb-animation='slide-in-down' data-mdb-animation-reset="true">
                <h1 class='placeholder_new_year'>Countdown to new year</h1>
                <?php
                    $current_year = date('Y');
                    echo "<h1 class='new_year'>" . $current_year + 1 . "</h1>";
                ?>           
            </div>
            <div class="time_before_new_year">
                <?php
                    date_default_timezone_set('America/Vancouver');

                    // $days = 365 - date('z');
                    // $hours = 24 - date('G');
                    // if (60 - date('i') != 0)
                    //     $minutes = 60 - date('i')-1;
                    // else
                    //     $minutes = 60 - date('i');
                    // if (60 - date('s') != 0)
                    //     $seconds = 60 - date('s')-2;
                    // else
                    //     $seconds = 60 - date('s');
                    // echo "<h1>Il reste " . $days . " jours, " . $hours . " heures, " . $minutes . " minutes et " . $seconds . " secondes</h1>";
                    $current_time = new DateTime(); // Current time
                    $final_day = 1;
                    $final_month = 1; // January (PHP months are 1-based)
                    $final_hour = 0;
                    $final_minute = 0;
                    $final_second = 0;
                    $final_year = date("Y") + 1; // Next year

                    $final_time = new DateTime("$final_year-$final_month-$final_day $final_hour:$final_minute:$final_second");
                    $difference = $final_time->getTimestamp() - $current_time->getTimestamp();

                    $days = floor($difference / (60 * 60 * 24));
                    $hours = floor(($difference % (60 * 60 * 24)) / (60 * 60));
                    $minutes = floor(($difference % (60 * 60)) / 60);
                    $seconds = $difference % 60;

                    echo "<h1>Il reste $days jours $hours heures $minutes minutes $seconds secondes</h1>";
                ?>
            </div>
        </div>
        <div id="qrcode"></div>
        <div id="player"></div>
            <script>
            // Load the IFrame Player API code asynchronously.
            var tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            // Replace 'YOUR_VIDEO_ID' with the id of the YouTube video you want to play
            var videoId = 'dQw4w9WgXcQ';

            // Create an <iframe> (and YouTube player) after the API code downloads.
            var player;
            function onYouTubeIframeAPIReady() {
                player = new YT.Player('player', {
                height: '0',
                width: '0',
                videoId: videoId,
                playerVars: {
                    autoplay: 1,
                    loop: 1,
                    playlist: videoId,
                    controls: 0,
                    showinfo: 0,
                    autohide: 1,
                    modestbranding: 1,
                    vq: 'hd1080'
                },
                });
                console.log(player);
            }
            </script>
    </div>
</body>
</html>