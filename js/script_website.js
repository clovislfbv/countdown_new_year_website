import { createNewPage, deletePage, getAllPages } from "./helper.js";

var $j = jQuery.noConflict();

$j(document).ready(function () {

    getAllPages();

    // fetch('/api/run_python_code', {
    //     method: 'POST',
    // })
    // .then(response => response.json())
    // .then(data => console.log(data.result));

    var name = Math.floor((Math.random() * 1000000000) + 100000000);
    var content = "<!DOCTYPE html><html lang='fr'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>Document</title></head><body><h1>Hello World !</h1></body></html>"

    createNewPage(name, content);

    $j('#qrcode').qrcode({
        text: "../html/" + name + ".html",
    });

    var final_year = new Date().getFullYear() + 1;

    // $j(".placeholder").css({
    //     'top': -$j(".placeholder").outerHeight(),
    // });

    window.onbeforeunload = function (event) {
        deletePage(name);
    };

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