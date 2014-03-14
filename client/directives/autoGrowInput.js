/*
 * Auto-expanding textbox directive for single-line <input> controls.
 *
 * This is adapted from: https://gist.github.com/thomseddon/4703968
 *
 * See the above link for auto-growing multiline <textarea> controls, a similar but slightly
 * different objective.
 *
 * The original, pure jQuery (and non-AngularJS) version of this can be found here:
 * http://jsbin.com/ahaxe
 *
 * Usage example:
 * <input type="text" auto-grow max-width="500"></input>
 */
angular.module('swot').directive('autoGrow', function () {
    return function(scope, element, attr) {

        var opts = {
            maxWidth: parseInt(attr.maxWidth) || 1000,
            minWidth: parseInt(attr.minWidth) || element.width(),
            comfortZone: parseInt(attr.comfortZone) || 20
        };

        var minWidth = opts.minWidth;
        var val = '';
        var input = element;

        var $shadow = angular.element('<div></div>').css({
            position: 'absolute',
            top: -10000,
            left: -10000,
            width: 'auto',
            fontSize: element.css('fontSize'),
            fontFamily: element.css('fontFamily'),
            fontWeight: element.css('fontWeight'),
            letterSpacing: input.css('letterSpacing'),
            whitespace: 'nowrap'
        });

        $shadow.insertAfter(element);
 
        var update = function() {
            if (val === (val = input.val())) {return;}

            // Enter new content into the shadow element
            var escaped = val.replace(/&/g, '&amp;').replace(/\s/g,'&nbsp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            $shadow.html(escaped);

            // Calculate new width + whether to change
            var testerWidth = $shadow.width(),
                newWidth = (testerWidth + opts.comfortZone) >= minWidth ? testerWidth + opts.comfortZone : minWidth,
                currentWidth = input.width(),
                isValidWidthChange = (newWidth < currentWidth && newWidth >= minWidth)
                                     || (newWidth > minWidth && newWidth < opts.maxWidth);

            // Animate width
            if (isValidWidthChange) {
                input.width(newWidth);
            }
            if (newWidth >= opts.maxWidth) {
                input.width(opts.maxWidth);
            }
        }
 
        if (attr.ngModel) { scope.$watch(attr.ngModel, update); }
        else { element.bind('keyup keydown keypress change', update); }

        update();
    }
});
