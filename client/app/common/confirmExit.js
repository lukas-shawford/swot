angular.module( 'confirmExit', [] )

.directive('confirmOnExit', function() {
    return {
        link: function($scope, elem, attrs) {
            window.onbeforeunload = function(){
                if ($scope.editQuizForm.$dirty) {
                    return attrs.confirmOnExit || "The form has been modified.";
                }
            }
            $scope.$on('$locationChangeStart', function(event, next, current) {
                if ($scope.editQuizForm.$dirty) {
                    if(!confirm(attrs.confirmOnExit || "The form has been modified.")) {
                        event.preventDefault();
                    }
                }
            });
        }
    };
})

;
