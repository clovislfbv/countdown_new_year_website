<?php
    session_start();

    $bearer_token = null;
    $retval = null;
    exec("python3 ../python/bearer.py", $bearer_token, $retval);
    $bearer_token_json = json_decode(str_replace("'", '"', $bearer_token[0]), true);
    $_SESSION["bearer_token"] = $bearer_token_json['access_token'];
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" type="text/css" href="../css/bootstrap/bootstrap.min.css">
    <link rel="stylesheet" type="text/css" href="../css/mdb.min.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="../css/index.css">
    <script src="../js/bootstrap/bootstrap.min.js"></script>
    <script src="../js/jquery.js"></script>
    <script src="../js/jquery.qrcode.min.js"></script>
    <script type="module" src="../js/mdb.umd.min.js"></script>
    <script src="../js/script_website.js" type="module"></script>
    <title>Countdown to the New Year !!</title>
</head>
<body>
    <div class="left_column"></div>
    <div class="main">
        <div class="first_line">
            <h1 class='placeholder_new_year yellow'>Countdown to new year</h1>
        </div>
        <div class="second_line">
            <div class="title" data-toggle="animation" data-mdb-animation-start='onLoad' data-mdb-animation='slide-in-down' data-mdb-animation-reset="true">
                <?php
                    $current_year = date('Y');
                    echo "<h1 class='yellow new_year'>" . $current_year + 1 . "</h1>";
                ?>           
            </div>
        </div>
        <div class="third_line">
            <div class="time_before_new_year yellow">
                <h1 class="test">
                    <?php
                        date_default_timezone_set('America/Vancouver');

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

                        echo "Il reste $days jours $hours heures $minutes minutes $seconds secondes";
                    ?>
                </h1>
            </div>
        </div>
        <div class="last_line yellow">
            <i id="btn" class="bi bi-pause-circle-fill"></i>
        </div>
        <div id="player">
            <input type="text" name="submitbar" id="submitbar">
            <button id="submit">Submit</button>
        </div>
    </div>
    <div class="right_column">
        <div id="qrcode"></div>
    </div>
</body>
</html>