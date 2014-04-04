angular.module('swot').directive('editquestion', function ($timeout) {
    return {
        restrict: 'E',
        templateUrl: '/partials/editQuestion.html',
        scope: {
            question: '=',
            form: '=?',
            questionNumber: '=',
            ckEditorConfig: '=',
            answerKeypress: '&',
            allowCopy: '=',
            allowReorder: '=',
            allowDelete: '=',
            onCopy: '&',
            onDelete: '&'
        },
        link: function (scope, elem, attrs) {
            scope.showQuestionNumber = angular.isNumber(scope.$eval(attrs.questionNumber));
            scope.showCopy = scope.$eval(attrs.allowCopy) && scope.showQuestionNumber;
            scope.showReorder = scope.$eval(attrs.allowReorder) && scope.showQuestionNumber;
            scope.showDelete = scope.$eval(attrs.allowDelete) && scope.showQuestionNumber;

            if (!scope.question.choices) {
                scope.question.choices = ["", "", "", ""];  // Default in 4 empty choices
                scope.question.correctAnswerIndex = 0;
            }

            scope.ui = {
                showingSettings: false
            };

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

            scope.addChoice = function () {
                scope.question.choices.push("");
                $timeout(function () {
                    $(elem).find('.choice-editor').last().focus();
                });
                if (attrs.form) {
                    scope.form.$setDirty();
                }
            };

            scope.removeChoice = function (i) {
                scope.question.choices.splice(i, 1);
                if (scope.question.correctAnswerIndex > i) {
                    scope.question.correctAnswerIndex--;
                } else if (scope.question.correctAnswerIndex == i) {
                    // Clear the correct answer if it was removed
                    scope.question.correctAnswerIndex = null;
                }
                if (attrs.form) {
                    scope.form.$setDirty();
                }
            };
        }
    };
});
