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