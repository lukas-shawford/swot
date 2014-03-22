// Detect IE (uses jquery.browser plugin), and add a class to the body element so we can write
// IE-specific CSS if needed.
$(document).ready(function () {
    if ($.browser.msie) {
        $("body").addClass("ie");
    }
});
