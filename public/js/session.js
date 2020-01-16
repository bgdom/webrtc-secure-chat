(function ($) {
    "use strict"; // Start of use strict
  
    $('#username1_btn').click(function() {
        // $('.intro').addClass('wow bounceOut')
        $('.intro').css('visibility', 'hidden')
        $('.users').css('visibility', 'visible')
    })

})(jQuery); // End of use strict




function switchToSession(){
    $('.users').css('visibility', 'hidden')
    $('.session').css('visibility', 'visible')
}


