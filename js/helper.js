var $j = jQuery.noConflict();

export function createNewPage(name, content) {
    $j.ajax({
        url: '../php/helper.php',
        type: 'POST',
        data: {
            action: "create_new_page",
            page_name: name,
            page_content: content
        },
        success: function (data) {
            console.log(data);
        }
    });
}

export function deletePage(name) {
    $j.ajax({
        url: '../php/helper.php',
        type: 'POST',
        data: {
            action: "delete_page",
            page_name: name
        },
        success: function (data) {
            console.log(data);
        }
    });
}

export function getAllPages() {
    $j.ajax({
        url: '../php/helper.php',
        type: 'POST',
        async: false,
        data: {
            action: "get_all_pages",
        },
        success: function (data) {
            console.log(data);
        }
    });
}