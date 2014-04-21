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

app.run(function (editableOptions) {
    editableOptions.theme = 'bs3';
});
