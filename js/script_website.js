var $j = jQuery.noConflict();

$j(document).ready(function () {
    var final_year = new Date().getFullYear() + 1;

    $j(".test").css({
        'top': -$j(".test").outerHeight(),
    });

    setInterval(function () {
        var current_time = new Date(); //new Date(2025, 0, 1, 0, 0, 0);
        var final_day = 1;
        var final_month = 0;
        var final_hour = 0;
        var final_minute = 0;
        var final_second = 0;
        var final_time = new Date(final_year, final_month, final_day, final_hour, final_minute, final_second);
        var difference_time = final_time.getTime() - current_time.getTime();
        //$j(".time_before_new_year").html("<h1> Il reste " + difference_time.getDay() + " jours " + difference_time.getHours() + " heures " + difference_time.getMinutes() + " minutes " + difference_time.getSeconds() + " secondes " + "</h1>");
    
        var seconds = Math.floor((difference_time / 1000) % 60);
        var minutes = Math.floor((difference_time / (1000 * 60)) % 60);
        var hours = Math.floor((difference_time / (1000 * 60 * 60)) % 24);
        var days = Math.floor(difference_time / (1000 * 60 * 60 * 24));

        $j(".time_before_new_year").html("<h1> Il reste " + days + " jours " + hours + " heures " + minutes + " minutes " + seconds + " secondes" + "</h1>");
        console.log(final_year, new Date().getFullYear());
        if (final_year != new Date().getFullYear()) {
            //window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
        }
    }, 1000)
})