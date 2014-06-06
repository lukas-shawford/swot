angular.module('swot').controller('MyQuizzesCtrl', function ($scope, $http, $timeout) {
    $scope.init = function () {
        $scope.topics = $scope.topics || [];
        $scope.topicTree = {};
        $scope.initTopicTree();
    };

    /**
     * Copies the topic data from the model, $scope.topics, and transforms it into a structure
     * that the abn-tree directive can use for the sidebar UI, storing it in $scope.topicTreeData.
     */
    $scope.initTopicTree = function () {
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

    $scope.selectTopic = function (topic) {
        $scope.currentTopic = topic;
    };

    $scope.renameTopic = function (topic, name, branch) {
        if ($scope.isBlank(name)) {
            return "Please enter a name."
        }

        if (!branch) {
            branch = $scope.getBranchByTopic(topic);
        }

        return $http({
            url: '/topics/' + topic._id,
            method: "PATCH",
            data: { name: name }
        }).then(function (response) {
            topic.name = name;      // Update model
            branch.label = name;    // Update UI (abn-tree)
            return true;
        }, function (response) {
            return response.data.error || "Oops, something went wrong! Please try again later.";
        });
    };

    $scope.addTopic = function (name, parentTopic, parentBranch) {
        if (parentTopic && !parentBranch) {
            parentBranch = $scope.getBranchByTopic(parentTopic);
        }

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
            var topic = response.data;
            topic.subtopics = [];
            topic.quizzes = [];
            var newBranch;

            if (parentBranch) {     // Child subtopic

                // Update UI (abn-tree)
                newBranch = $scope.topicTree.add_branch(parentBranch, {
                    label: topic.name,
                    data: topic
                });

                // Update model
                parentTopic.subtopics.push(topic);
            } else {                // Root-level topic

                // Update UI (abn-tree)
                newBranch = $scope.topicTree.add_root_branch({
                    label: topic.name,
                    data: topic
                });

                // Update model
                $scope.topics.push(topic);
            }

            // If no topic was previously selected, then select it immediately. Otherwise, the
            // placeholder message in the main content area changes to a different one, and it's
            // distracting.
            $scope.currentTopic = $scope.currentTopic || topic;

            // Rename the newly added branch after the element has been created.
            $timeout(function () {
                angular.element($('#' + newBranch.uid)).scope().btnEditRow.$show();
            });
        }, function (response) {
            bootbox.alert(response.data.error || "Oops, something went wrong! Please try again later.");
        });
    };

    $scope.onBranchAction = function (action, branch, data) {
        var topic = branch.data;
        switch (action) {
            case 'rename':
                return $scope.renameTopic(topic, data, branch);
            case 'delete':
                return $scope.deleteTopic(topic, branch);
            case 'add-subtopic':
                return $scope.addTopic("New Topic", topic, branch);
            default:
                console.error("Unsupported action \"" + action + "\" performed on branch: " + branch);
        }
    };

    $scope.deleteTopic = function (topic, branch) {
        if (!branch) {
            branch = $scope.getBranchByTopic(topic);
        }
        bootbox.confirm('Are you sure you want to delete this topic? All quizzes and subtopics ' +
            'will also be deleted.', function (result) {
                if (!result) { return; }
                return $http.delete('/topics/' + topic._id).then(function (response) {
                    if (branch) {
                        // If the branch that was deleted is the currently selected branch, then we
                        // should select another branch. Try the previous one if present, or otherwise
                        // the next one.
                        var shouldClearSelection = ($scope.topicTree.get_selected_branch() === branch);
                        var anotherBranch = $scope.topicTree.get_prev_branch(branch) || $scope.topicTree.get_next_branch(branch);

                        // Remove the topic from the model and the UI
                        $scope.topicTree.remove_branch(branch);     // Update UI (abn-tree)
                        $scope.findTopicByIdAndRemove(topic._id);   // Update model

                        // Clear selection if necessary
                        if (shouldClearSelection) {
                            if (!anotherBranch) {
                                $scope.currentTopic = null;
                            }
                            $scope.topicTree.select_branch(anotherBranch);
                        }
                    }
                    bootbox.alert("The topic has been successfully deleted.");
                }, function (response) {
                    bootbox.alert(response.data.error || "Oops, something went wrong! Please try again later.");
                });
            });
    };

    /**
     * Remove the topic with the given ID from the $scope.topics tree. This updates the model
     * only, not the UI. Use $scope.topicTree.remove_branch() to update the sidebar UI.
     * @param id The ID of the topic document to remove
     */
    $scope.findTopicByIdAndRemove = function (id) {
        return (function findTopicByIdAndRemove (root) {
            var topics = root ? root.subtopics : $scope.topics;
            for (var i = 0; i < topics.length; i++) {
                if (topics[i]._id === id) {
                    topics.splice(i, 1);
                    return true;
                } else {
                    if (findTopicByIdAndRemove(topics[i])) {
                        return true;
                    }
                }
            }
        })();
    };

    $scope.getBranchByTopic = function (topic) {
        return $scope.topicTree.find_branch(function (branch) {
            return branch.data === topic;
        });
    };

    $scope.isBlank = function (str) {
        return (!str || /^\s*$/.test(str));
    };

    //$scope.$watch('topics', $scope.initTopicTree, true);
});
