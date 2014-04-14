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

            if (!scope.question.alternativeAnswers) {
                scope.question.alternativeAnswers = [];
            }

            if (typeof scope.question.ignoreCase !== "boolean") {
                scope.question.ignoreCase = true;
            }

            if (typeof scope.question.supplementalInfoHtml !== "string") {
                scope.question.supplementalInfoHtml = "";
            }

            scope.ui = {
                showingSettings: false
            };

            scope.toggleSettings = function () {
                scope.ui.showingSettings = !scope.ui.showingSettings;
                if (scope.ui.showingSettings) {
                    // Emit the settingsOpened event, which notifies all ckEditor instances within the settings
                    // panel to initialize. There's an issue with inline ckeditor that causes it to not initialize
                    // properly in Chrome if the editor is within a hidden container, so we must wait until the
                    // container becomes visible before initializing. Also, add a slight timeout so that opening
                    // the settings panel is visually smooth instead of jumpy.
                    // http://dev.ckeditor.com/ticket/11789
                    //
                    // Note: This also notifies the editQuiz controller to update the min-height of the form.
                    // The intent of this is to prevent the page from jumping when reordering questions. See
                    // longer explanation in editQuiz.js (in the updateFormHeight method).
                    $timeout(function () {
                        scope.$emit('settingsOpened');
                    }, 250);
                } else {
                    $timeout(function () {
                        scope.$emit('settingsClosed');
                    }, 250);
                }
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

            scope.addAltAns = function () {
                scope.question.alternativeAnswers.push("");
                $timeout(function () {
                    $(elem).find('.alt-answer-editor').last().focus();
                });
                if (attrs.form) {
                    scope.form.$setDirty();
                }
            };

            scope.removeAltAns = function (i) {
                scope.question.alternativeAnswers.splice(i, 1);
                if (attrs.form) {
                    scope.form.$setDirty();
                }
            };
        }
    };
});
