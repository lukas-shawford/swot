angular.module('swot').filter('htmlToPlainText', function () {
    return function(html) {
        return $('<div/>').html(html).text();
    }
});
