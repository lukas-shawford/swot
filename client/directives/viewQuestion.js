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
                } else if (scope.question.submission) {
                    // Submit question, but only if the submission field is not empty.
                    scope.submit();
                }
            };
        }
    };
});
