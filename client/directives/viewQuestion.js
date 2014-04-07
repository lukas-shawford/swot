angular.module('swot').directive('viewquestion', function ($sce) {
    return {
        restrict: 'E',
        templateUrl: '/partials/viewQuestion.html',
        scope: {
            question: '=',
            submit: '&',
            showNext: '=',
            nextButtonText: '=',
            next: '&'
        },
        link: function (scope, elem, attrs) {
            scope.nextButtonText = scope.nextButtonText || "Next";

            scope.trusted = function (html) {
                return $sce.trustAsHtml(html);
            };

            scope.handleEnter = function ($event) {
                if (scope.question.submitted) {
                    // Question has been submitted already
                    if (scope.showNext) {
                        scope.next();
                    }
                } else if (scope.question.submission !== null) {
                    // Submit question, but only if the submission field is not empty.
                    scope.submit();
                }
            };

            scope.getAlternativeAnswerTooltip = function () {
                if (!scope.question.result) {
                    return "";
                }

                var alts = scope.question.result.alternativeAnswers;
                if (!alts || alts.length < 1) {
                    return 'The correct answer is "' + scope.question.answer + '". There are no other accepted answers.';
                }

                return '<div class="alt-ans-tooltip">' + "Other acceptable answers include: <ul>" +
                    _.map(alts, function (ans) { return "<li>" + ans + "</li>"; }).join("") +
                    "</ul></div>";
            };
        }
    };
});
