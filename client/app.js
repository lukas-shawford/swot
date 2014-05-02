var app = angular.module('swot', [
    'ui.bootstrap',
    'ui.utils',
    'ui.sortable',
    'focus',
    'confirmExit',
    'ngDebounce',
    'ngAnimate',
    'xeditable'
]);

app.config(['$httpProvider', function ($httpProvider) {
    // Add support for HTTP PATCH verb for sending partial updates.
    $httpProvider.defaults.headers.patch = {
        'Content-Type': 'application/json;charset=utf-8'
    };
}]);

app.run(function (editableOptions) {
    // Set options for angular-xeditable
    editableOptions.theme = 'bs3';
});
