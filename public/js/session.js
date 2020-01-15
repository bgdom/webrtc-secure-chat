(function ($) {
    "use strict"; // Start of use strict

    $('#get-session-btn').click(function () {
        console.log("test")
        $('.intro').css({opacity: 1.0, visibility: "visible"}).animate({opacity: 0}, 200);
        // $('.session').css('visibility', 'visible')
    })


})(jQuery); // End of use strict