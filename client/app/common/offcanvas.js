$(document).ready(function() {
    $('[data-toggle=offcanvas]').click(function() {
        $('.row-offcanvas').toggleClass('active');
    });

    // This seems to fix an issue with the offcanvas sidebar taking up height and pushing the
    // main content down (i.e., they're stacking, even though they're also side by side). I noticed
    // that it was the height: auto; property on the sidebar that was causing this behavior. This
    // sets the height to 0. It does have the side effect of breaking the sticky footer, but that
    // won't be a problem for now since I'm planning on removing the sticky footer anyway.
    $('.sidebar-offcanvas').height(0);
});
