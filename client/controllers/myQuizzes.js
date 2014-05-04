angular.module('swot').controller('MyQuizzesCtrl', function ($scope, $http) {
    $scope.init = function () {
        $scope.subjects = $scope.subjects || [];
        $scope.currentPage = ($scope.subjects.length > 0) ? $scope.subjects[0] : null;
    };

    $scope.selectPage = function (page, $event) {
        if ($($event.target).parents('.editable-buttons').size() > 0) {
            // Ignore event if it originated from angular-xeditable buttons
            return;
        }

        $scope.currentPage = page;
        $event.stopPropagation();
    };

    $scope.sidebarClickEdit = function (editForm, $event) {
        editForm.$show();
        $event.stopPropagation();
    };

    $scope.updateSubjectName = function (subject, name) {
        if ($scope.isBlank(name)) {
            return "Please enter a name."
        }

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
        if ($scope.isBlank(name)) {
            return "Please enter a name."
        }

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

    $scope.isBlank = function (str) {
        return (!str || /^\s*$/.test(str));
    };
});
