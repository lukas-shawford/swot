/*
 * confirm-button directive
 * ------------------------
 *
 * Add the confirm-button attribute to a button to make a confirmation popover appear before
 * performing the specified action. Requires AngularUI and Bootstrap.
 *
 * Example usage:
 * <button type="button" confirm-button="delete($index)" message="Are you sure?"></button>
 *
 * In the above example, delete($index) will *not* immediately be called when clicking the button.
 * Instead, a confirmation popover will appear first with the message "Are you sure?", and the
 * buttons "Yes" and "No". Only if the user clicks "Yes" will delete($index) actually be called.
 *
 * Additional options configurable via attributes:
 *     - title="Confirm": Changes the title text on the popover
 *     - yes="Yep": Changes the text of the "Yes" button
 *     - no="Nope": Changes the text of the "No" button
 *     - classes="mypopover warning": CSS classes to apply to the popover (separated by space)
 *     - placement="bottom": Changes the popover placement
 *     - placement-callback="getPopoverPlacement()": A more flexible method for determining the
 *          placement of the popover. getPopoverPlacement should be a function that returns a
 *          function, which in turn returns a string (one of either "left", "top", "right", or
 *          "bottom"). This can be used to, for example, have the popover appear to the left
 *          on small screens, and to the right on big screens:
 *              $scope.popoverPlacementCallback = function () {
 *                  return function () {
 *                      return ($(window).width() > 1024) ? "right" : "left";
 *                  };
 *              };
 *
 * This was borrowed and slightly modified from here:
 * http://wegnerdesign.com/blog/angular-js-directive-tutorial-on-attribute-bootstrap-confirm-button/
 */
angular.module( 'confirmButton', [] ).directive('confirmButton', function($document, $parse) {
    return {
        restrict: 'A',
        scope: {
            confirmAction: '&confirmButton',
            placementCallback: '&'
        },
        link: function (scope, element, attrs) {
            var buttonId = Math.floor(Math.random() * 10000000000),
                message = attrs.message || "Are you sure?",
                yep = attrs.yes || "Yes",
                nope = attrs.no || "No",
                title = attrs.title || "Confirm",
                classes = attrs.classes || "",
                placement = attrs.placement || "bottom";

            attrs.buttonId = buttonId;

            var html = "<div id=\"button-" + buttonId + "\" class=\"" + classes + "\">" +
                            "<p class=\"confirmbutton-msg\">" + message + "</p>" +
                            "<button class=\"confirmbutton-yes btn btn-danger\">" + yep + "</button>" +
                            "<button class=\"confirmbutton-no btn\">" + nope + "</button>" +
                        "</div>";

            element.popover({
                content: html,
                html: true,
                trigger: "manual",
                title: title,
                placement: (angular.isDefined(attrs.placementCallback) ? scope.placementCallback() : placement)
            });

            element.bind('click', function(e) {
                var dontBubble = true;
                e.stopPropagation();

                element.popover('show');

                var pop = $("#button-" + buttonId);

                pop.closest(".popover").click(function(e) {
                    if (dontBubble) {
                        e.stopPropagation();
                    }
                });

                pop.find('.confirmbutton-yes').click(function(e) {
                    dontBubble = false;
                    scope.$apply(scope.confirmAction);
                });

                pop.find('.confirmbutton-no').click(function(e) {
                    dontBubble = false;
                    $document.off('click.confirmbutton.' + buttonId);
                    element.popover('hide');
                });

                $document.on('click.confirmbutton.' + buttonId, ":not(.popover, .popover *)", function() {
                    $document.off('click.confirmbutton.' + buttonId);
                    element.popover('hide');
                });
            });
        }
    };
});
