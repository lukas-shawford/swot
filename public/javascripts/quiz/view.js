var viewQuiz = angular.module('ViewQuiz', ['ui.bootstrap', 'ui.utils', 'focus']);

viewQuiz.controller('ViewQuizCtrl', function ($scope, $http, focus) {
    $scope._id = _quizId || null;
    $scope.questions = [{}];
    $scope.alerts = [];
    $scope.currentQuestionIndex = 0;
    $scope.questionResult = null;

    $scope.load = function () {
        var handleError = function (error) {
            $scope.showError('An error occurred while loading the quiz: ' + error);
        };

        if (!$scope._id) { handleError("Quiz ID is missing."); }

        $http.get('/questions', {
            params: { id: $scope._id }
        }).success(function (response) {
            if (response.success) {
                $scope.questions = response.questions;
                focus('switchedQuestion');
            } else {
                handleError(response.message);
            }
        }).error(function (response) {
            console.log(response);
            handleError(response);
        });
    }

    $scope.submit = function () {
        var handleError = function (error) {
            $scope.showError('An error occurred while submitting the question: ' + error);
        };

        $scope.questionResult = null;
        $scope.closeAllAlerts();

        $http.post('/submit', {
            _id: $scope._id,
            currentQuestionIndex: $scope.currentQuestionIndex,
            submission: $scope.submission
        }).success(function (response) {
            if (response.success) {
                $scope.questionResult = {
                    isCorrect: response.isCorrect,
                    correctAnswer: response.correctAnswer
                };
            } else {
                handleError(response.message);
            }
        }).error(function (response) {
            handleError(response);
        });
    };

    $scope.prev = function () {
        if ($scope.currentQuestionIndex > 0) {
            $scope.jumpToQuestion($scope.currentQuestionIndex - 1);
        }
    };

    $scope.next = function () {
        if ($scope.currentQuestionIndex < $scope.questions.length - 1) {
            $scope.jumpToQuestion($scope.currentQuestionIndex + 1);
        }
    };

    $scope.currentQuestion = function () {
        var index = $scope.currentQuestionIndex;
        if (index < 0 || index >= $scope.questions.length) { return ""; }
        return $scope.questions[index];
    };

    $scope.jumpToQuestion = function (index) {
        if (index >= 0 && index < $scope.questions.length) {
            $scope.currentQuestionIndex = index;
            $scope.questionResult = null;
            $scope.submission = "";
            focus('switchedQuestion');
        }
    };

    $scope.handleEnter = function ($event) {
        if ($scope.questionResult) {        // Question has been submitted already.
            $scope.next();
        } else if ($scope.submission) {     // Submit question, but only if the submission field is not empty.
            $scope.submit();
        }
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


    // Initialization
    // --------------

    if ($scope._id) { $scope.load(); }
    else {
        $scope.showError('An error occurred while initializing the quiz: Quiz ID is missing.');
    }
});
