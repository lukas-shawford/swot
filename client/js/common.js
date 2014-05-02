$(document).ready(function () {
    // Detect IE (uses jquery.browser plugin), and add a class to the body element so we can write
    // IE-specific CSS if needed.
    if ($.browser.msie) {
        $("body").addClass("ie");
    }

    // Move sidebar content up when header is scrolled out of view
    var updateSidebarTop = function updateSidebarTop () {
        var navHeight = $('#nav').height();
        if ($(this).scrollTop() > navHeight) {
            $('#sidebar').removeClass("top");
        } else {
            $('#sidebar').addClass('top');
        }
    };
    updateSidebarTop();                     // Call it when page gets loaded...
    $(document).scroll(updateSidebarTop);   // ... and also whenever the window is scrolled.
});
