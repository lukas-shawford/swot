angular.module('swot').controller('MyQuizzesCtrl', function ($scope, $http) {
    $scope.init = function () {
        $scope.topics = $scope.topics || [];
        $scope.initTopicTree();
    };

    $scope.initTopicTree = function () {
        // Transform topics into a proper tree structure for the abn_tree directive

        var transformTopicNode = function transformTopicNode (topic) {
            var node = {};
            node.label = topic.name;
            node.data = topic;
            if (topic.subtopics.length > 0) {
                node.children = _.map(topic.subtopics, transformTopicNode);
            }
            return node;
        };

        $scope.topicTree = _.map($scope.topics, transformTopicNode);
    };

    /*
    $scope.selectPage = function (page, $event) {
        if ($($event.target).parents('.editable-buttons').size() > 0) {
            // Ignore event if it originated from angular-xeditable buttons
            return;
        }

        $scope.currentPage = page;
        $event.stopPropagation();
    };
    */

    $scope.renameTopic = function (topic, name) {
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

    /*
    $scope.addSubject = function (name) {
        return $http.post('/subjects', { name: name });
    };
    */

    $scope.isBlank = function (str) {
        return (!str || /^\s*$/.test(str));
    };
});
