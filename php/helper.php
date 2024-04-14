<?php
    if (isset($_POST["action"])){
        switch ($_POST["action"]) {
            case "create_new_page":
                create_new_page();
                break;
            
            case "delete_page":
                delete_page();
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
?>