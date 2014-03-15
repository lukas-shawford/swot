angular.module('swot').directive('editquestion', function () {
    return {
        restrict: 'E',
        templateUrl: '/partials/editQuestion.html',
        scope: {
            question: '=',
            ckEditorConfig: '=',
            answerKeypress: '&'
        },
        link: function (scope, elem, attrs) {
            scope.handleAnswerKeypress = function ($event) {
                scope.answerKeypress({
                    $event: $event,
                    question: scope.question
                });
            };
        }
    };
});
