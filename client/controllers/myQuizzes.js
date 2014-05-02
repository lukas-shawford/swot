angular.module('swot').controller('MyQuizzesCtrl', function ($scope, $http) {
    $scope.init = function () {
        $scope.subjects = $scope.subjects || [];
        $scope.currentPage = ($scope.subjects.length > 0) ? $scope.subjects[0] : null;
    };

    $scope.selectPage = function (page, $event) {
        console.log("Selecting " + page.name)
        $scope.currentPage = page;
        $scope.currentPage.isExpanded = !$scope.currentPage.isExpanded;
        $event.stopPropagation();
    };

    $scope.updateSubjectName = function (subject, name) {
        return $http({
            url: '/subjects/' + subject._id,
            method: "PATCH",
            data: { name: name }
        }).then(function (response) {
            return true;
        }, function (response) {
            return response.data.error || "Service unavaiable. Please try again later.";
        });
    };

    $scope.updateTopicName = function (topic, name) {
        return $http({
            url: '/topics/' + topic._id,
            method: "PATCH",
            data: { name: name }
        }).then(function (response) {
            return true;
        }, function (response) {
            return response.data.error || "Service unavaiable. Please try again later.";
        });
    };

    $scope.addSubject = function (name) {
        return $http.post('/subjects', { name: name });
    };
});
