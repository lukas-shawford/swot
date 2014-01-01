var editQuiz = angular.module('EditQuiz', ['ui.bootstrap', 'ui.sortable', 'focus']);


// EditQuiz Controller
// -------------------

editQuiz.controller('EditQuizCtrl', function ($scope, $http, $timeout, focus) {
    $scope._id = _quizId || null;
    $scope.name = "";
    $scope.questions = [{}];
    $scope.alerts = [];
    $scope.saveStatus = "";
    $scope.saveMessage = "";
    $scope.savedSuccessfully = true;
    $scope.addQuestionTooltipsRemaining = 2;    // Stop showing the tooltip after adding a couple questions.
    
    $scope.isNew = function () {
        return $scope._id === null;
    }

    $scope.serialize = function () {
        return {
            _id: $scope._id,
            name: $scope.name,
            questions: $scope.questions
        };
    };

    $scope.deserialize = function (data) {
        $scope.name = data.name;
        $scope.questions = data.questions;
    }

    $scope.load = function () {
        var handleError = function (error) {
            $scope.showError('An error occurred while loading the quiz: \n' + error);
        };

        if (!$scope._id) { handleError("Quiz ID is missing."); }

        $http.get('/load', {
            params: { id: $scope._id }
        }).success(function (response) {
            if (response.success) {
                $scope.deserialize(response.quiz);
            } else {
                handleError(response.message);;
            }
        }).error(function (response) {
            handleError(response);
        });
    }

    $scope.save = function () {
        var handleError = function (error) {
            $scope.saveStatus = "";
            $scope.saveMessage = 'An error occurred while saving the quiz: ' + error;
            $scope.savedSuccessfully = false;
        };

        $scope.closeAllAlerts();

        $http.post($scope.isNew() ? '/create' : '/save', $scope.serialize())
            .success(function (response) {
                if (response.success) {
                    if ($scope.isNew()) { $scope._id = response.id; }
                    $scope.saveStatus = "Saved";
                    $scope.savedSuccessfully = true;
                    $timeout(function () {
                        $scope.saveStatus = "";
                    }, 2000);
                } else {
                    handleError(response.message);
                }
            })
            .error(function (response) {
                handleError(response);
            });
    };

    $scope.deleteQuiz = function () {
        var handleError = function (error) {
            $scope.showError("An error occurred while deleting the quiz: " + error);
        };

        $scope.closeAllAlerts();

        $http.post('/delete', { _id: $scope._id })
            .success(function (response) {
                if (response.success) {
                    bootbox.alert("The quiz has been deleted successfully.", function () {
                        window.location.href = "/quizzes";
                    });
                } else {
                    handleError(response.message);
                }
            })
            .error(function (response) {
                handleError(response);
            });
    };

    $scope.addQuestion = function () {
        $scope.questions.push({});

        // Focus on the first input field for the newly-added question
        focus('newQuestionAdded');

        // Stop showing the tooltip on the Add Question button after adding a couple questions
        // Note that tooltip is now shown where there are no questions, so adding the first question
        // should not decrement the count.
        if ($scope.questions.length > 1) {
            $scope.addQuestionTooltipsRemaining--;
        }
    };

    $scope.removeQuestion = function (index) {
        $scope.questions.splice(index, 1);
    }

    $scope.sortableOptions = {
        update: function(e, ui) { },
        placeholder: 'sortable-list-placeholder',
        forcePlaceholderSize: true,
        start: function (e, ui) {
            ui.placeholder.height(ui.item.outerHeight());
        }
    };

    $scope.addQuestionTooltip = function () {
        if ($scope.addQuestionTooltipsRemaining <= 0 || $scope.questions.length == 0) {
            return "";
        }

        return "You can also add a question by hitting the TAB key after typing in the last answer.";
    }


    // Alerts
    // ------

    $scope.showError = function (message) {
        return $scope.alerts.push({ type: 'danger', msg: message }) - 1;
    };

    $scope.showSuccess = function (message) {
        return $scope.alerts.push({ type: 'success', msg: message }) - 1;
    };

    $scope.showInfo = function (message) {
        return $scope.alerts.push({ type: 'info', msg: message }) - 1;
    };

    $scope.showWarning = function (message) {
        return $scope.alerts.push({ type: 'warning', msg: message }) - 1;
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.closeAllAlerts = function() {
        $scope.alerts = [];
    };


    // Events
    // ------

    $scope.answerKeypress = function ($index, $event) {
        // Add new question when hitting TAB on the last input
        if ($index === $scope.questions.length - 1) {
            if ($event.keyCode === 9 &&  !$event.ctrlKey && !$event.metaKey && !$event.altKey && !$event.shiftKey) {
                $scope.addQuestion();
            }
        }
    }


    // Initialization
    // --------------

    if ($scope._id) { $scope.load(); }
});
