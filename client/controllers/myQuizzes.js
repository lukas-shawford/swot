angular.module('swot').controller('MyQuizzesCtrl', function ($scope, $http, $timeout) {
    $scope.init = function () {
        $scope.topics = $scope.topics || [];
        $scope.topicTree = {};
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

        $scope.topicTreeData = _.map($scope.topics, transformTopicNode);
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

    $scope.renameTopic = function (topic, name, branch) {
        if ($scope.isBlank(name)) {
            return "Please enter a name."
        }

        return $http({
            url: '/topics/' + topic._id,
            method: "PATCH",
            data: { name: name }
        }).then(function (response) {
            topic.name = name;
            branch.label = name;
            return true;
        }, function (response) {
            return response.data.error || "Oops, something went wrong! Please try again later.";
        });
    };

    $scope.addTopic = function (name, parentTopic, parentBranch) {
        name = name || "New Topic";
        return $http({
            url: '/topics',
            method: "POST",
            data: {
                name: name,
                parent: (parentTopic ? parentTopic._id : null)
            }
        }).then(function (response) {
            // Add the new branch to the topic tree
            var newBranch;
            if (parentBranch) {
                newBranch = $scope.topicTree.add_branch(parentBranch, {
                    label: response.data.name,
                    data: response.data
                });
            } else {
                newBranch = $scope.topicTree.add_root_branch({
                    label: response.data.name,
                    data: response.data
                });
            }
            // Rename the newly added branch after the element has been created.
            $timeout(function () {
                angular.element($('#' + newBranch.uid)).scope().btnEditRow.$show();
            });
        }, function (response) {
            bootbox.alert(response.data.error || "Oops, something went wrong! Please try again later.");
        });
    };

    $scope.onBranchAction = function (action, branch, data) {
        switch (action) {
            case 'rename':
                return $scope.renameTopic(branch.data, data, branch);
            case 'delete':
                return $scope.deleteTopic(branch.data, branch);
            case 'add-subtopic':
                return $scope.addTopic("New Topic", branch.data, branch);
            default:
                console.error("Unsupported action \"" + action + "\" performed on branch: " + branch);
        }
    };

    $scope.deleteTopic = function (topic, branch) {
        bootbox.confirm('Are you sure you want to delete this topic? All quizzes and subtopics ' +
            'will also be deleted.', function (result) {
                if (!result) { return; }
                return $http.delete('/topics/' + topic._id).then(function (response) {
                    if (branch) {
                        $scope.topicTree.remove_branch(branch);
                    }
                    bootbox.alert("The topic has been successfully deleted.");
                }, function (response) {
                    bootbox.alert(response.data.error || "Oops, something went wrong! Please try again later.");
                });
            });
    };

    $scope.isBlank = function (str) {
        return (!str || /^\s*$/.test(str));
    };
});
