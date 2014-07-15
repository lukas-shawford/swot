angular.module('swot').controller('MyQuizzesCtrl', function ($scope, $http, $timeout) {
    $scope.init = function () {
        $scope.topics = $scope.topics || [];
        $scope.currentTopic = $scope.topics[0];
    };

    $scope.topicTreeOptions = {
        dropped: function (event) {

            // Topic being dragged
            var topic = event.source.nodeScope.$modelValue;

            // Since we don't have any drag delay on the topic tree, there is hardly any distinction
            // between clicking on a topic to select it, and beginning a drag operation - single
            // clicking a topic actually triggers the drag event. Accommodate both possibilities by
            // automatically selecting the topic being dragged. (Note: we don't want to have any
            // drag delay as that would hurt the discoverability of the dragging feature.)
            $scope.currentTopic = topic;

            // Old parent topic (null if topic was previously a root topic)
            var oldParent = event.source.nodesScope.$parent.$modelValue || null;

            // New parent topic (null if topic was dragged into root-level position)
            var newParent = event.dest.nodesScope.$parent.$modelValue || null;

            // Old index before the topic was moved
            var oldIndex = event.source.index;

            // Destination index that the topic was dragged to within its new parent
            var index = event.dest.index;

            // Return if nothing actually changed
            if (oldParent === newParent && index === oldIndex) {
                return;
            }

            // Create the patch array containing the changes
            var patch = [];
            if (newParent !== oldParent) {
                patch.push({ op: 'replace', path: '/parent', value: (newParent ? newParent._id : null) });
            }
            patch.push({ op: 'add', path: '/position', value: index });     // always specify position

            return $http({
                url: '/topics/' + topic._id,
                method: "PATCH",
                data: patch
            }).then(function () {
                return true;
            }, function (response) {
                return response.data.error || "Oops, something went wrong! Please try again later.";
            });
        }
    };

    $scope.selectTopic = function (topic) {
        $scope.currentTopic = topic;
    };

    $scope.toggle = function(scope) {
        scope.toggle();
    };

    $scope.renameTopic = function (topic, name) {
        if ($scope.isBlank(name)) {
            return "Please enter a name."
        }

        return $http({
            url: '/topics/' + topic._id,
            method: "PATCH",
            data: [{ op: 'replace', path: '/name', value: name }]
        }).then(function (response) {
            topic.name = name;
            return true;
        }, function (response) {
            return response.data.error || "Oops, something went wrong! Please try again later.";
        });
    };

    $scope.renameCurrentTopicInSidebar = function () {
        if (!$scope.currentTopic) { return; }
        var el = $('#topic-' + $scope.currentTopic._id);
        if (el.size() > 0) {
            angular.element(el).scope().renameTopicForm.$show();
        } else {
            $scope.btnEditTopic.$show();    // fallback
        }
    };

    $scope.addTopic = function (name, parentTopic) {
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

            if (parentTopic) {
                parentTopic.subtopics.push(topic);
            } else {
                $scope.topics.push(topic);
            }

            // If no topic was previously selected, then select it immediately. Otherwise, the
            // placeholder message in the main content area changes to a different one, and it's
            // distracting.
            $scope.currentTopic = $scope.currentTopic || topic;

            // Rename the newly added branch after the element has been created.
            $timeout(function () {
                angular.element($('#topic-' + topic._id)).scope().renameTopicForm.$show();  // sue me
            });
        }, function (response) {
            bootbox.alert(response.data.error || "Oops, something went wrong! Please try again later.");
        });
    };

    $scope.addSubtopic = function (parent, name) {
        parent = parent || $scope.currentTopic;
        name = name || "New Topic";
        $scope.addTopic(name, parent);
    };

    $scope.deleteTopic = function (topic) {
        bootbox.confirm('Are you sure you want to delete this topic? All quizzes and subtopics ' +
            'will also be deleted.', function (result) {
                if (!result) { return; }
                return $http.delete('/topics/' + topic._id).then(function (response) {

                    // If the branch that was deleted is the currently selected branch, or is an
                    // ancestor of the currently selected branch, then we should select another
                    // one so that we don't wind up with a deleted topic in the main content area.
                    var currentTopicDeleted = (topic === $scope.currentTopic) ||
                        $scope.isDescendantOf($scope.currentTopic, topic);
                    if (currentTopicDeleted) {
                        var parent = $scope.getParentTopic(topic);
                        if (parent === 'root') { parent = null; }
                        var children = parent ? parent.subtopics : $scope.topics;
                        var i = _.indexOf(children, topic);
                        var prev = children[i - 1],
                            next = children[i + 1];
                        $scope.currentTopic = next || prev || parent;
                    }

                    // Remove the topic from the model
                    $scope.findTopicByIdAndRemove(topic._id);

                    bootbox.alert("The topic has been successfully deleted.");
                }, function (response) {
                    bootbox.alert(response.data.error || "Oops, something went wrong! Please try again later.");
                });
            });
    };

    /**
     * Remove the topic with the given ID from the $scope.topics tree.
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

    /**
     * Returns the parent topic of the given topic object. If the topic is a root level topic, then
     * this function returns the string 'root'. If no parent can be found, then this function returns
     * undefined.
     */
    $scope.getParentTopic = function (topic) {
        if (!topic) { return; }
        return (function getParentTopic (root) {
            var parent = root || 'root';
            var topics = root ? root.subtopics : $scope.topics;
            for (var i = 0; i < topics.length; i++) {
                if (topics[i] === topic) {
                    return parent;
                } else {
                    var p = getParentTopic(topics[i]);
                    if (p) {
                        return p;
                    }
                }
            }
        })();
    };

    $scope.forAllDescendants = function (topic, fn) {
        if (!topic) { return; }
        _.each(topic.subtopics, function (subtopic) {
            fn(subtopic);
            $scope.forAllDescendants(subtopic, fn);
        });
    };

    $scope.isDescendantOf = function (topic, ancestor) {
        var ret = false;
        $scope.forAllDescendants(ancestor, function (t) {
            if (t === topic) {
                ret = true;
            }
        });
        return ret;
    };

    $scope.isBlank = function (str) {
        return (!str || /^\s*$/.test(str));
    };
});
