angular.module('swot').directive('editquestion', function () {
    return {
        restrict: 'E',
        templateUrl: '/partials/editQuestion.html',
        scope: {
            question: '=',
            questionNumber: '=',
            ckEditorConfig: '=',
            answerKeypress: '&',
            allowReorder: '=',
            allowDelete: '=',
            onDelete: '&'
        },
        link: function (scope, elem, attrs) {
            scope.handleAnswerKeypress = function ($event) {
                scope.answerKeypress({
                    $event: $event,
                    question: scope.question
                });
            };

            // Returns a function that determines the placement of confirmation popovers based on screen
            // size. This is for use with the confirmButton directive.
            scope.popoverPlacementCallback = function () {
                return function () {
                    if ($(window).width() > 1280) {
                        // Large screen - show on the right
                        return "right";
                    } else if ($(window).width() > 1024) {
                        // Medium screen - show on the bottom
                        return "bottom";
                    } else {
                        // Small screen - show on the left
                        return "left";
                    }
                };
            };

            scope.showQuestionNumber = angular.isNumber(scope.$eval(attrs.questionNumber));
            scope.showReorder = scope.$eval(attrs.allowReorder) && scope.showQuestionNumber;
            scope.showDelete = scope.$eval(attrs.allowDelete) && scope.showQuestionNumber;

            var questionNumberBlock = elem.find('.question-number');
            var questionTypeBlock = elem.find('.question-type-menu');
            var questionActionsBlock = elem.find('.question-actions');
        }
    };
});
