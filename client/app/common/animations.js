angular.module('swot').animation('.animate-list-item', function () {
    return {
        enter: function (element, done) {
            element.css({
                left: '-50px',
                'max-height': 0,
                opacity: 0
            });
            $(element).animate({
                left: 0,
                'max-height': '200px',
                opacity: 1
            }, done);

            return function (isCancelled) {
                $(element).css('max-height', '');
            };
        },
        leave: function (element, done) {
            element.css({
                'max-height': $(element).css('height')
            });
            $(element).animate({
                left: '50px',
                'max-height': 0,
                opacity: 0
            }, done);
        }
    };
});
