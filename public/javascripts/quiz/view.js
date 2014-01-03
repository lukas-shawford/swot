var viewQuiz = angular.module('ViewQuiz', ['ui.bootstrap', 'ui.utils', 'focus']);

viewQuiz.controller('ViewQuizCtrl', function ($scope, $http, focus) {
    $scope._id = _quizId || null;
    $scope.questions = [{}];
    $scope.alerts = [];
    $scope.currentQuestionIndex = 0;

    $scope.load = function () {
        var handleError = function (error) {
            $scope.showError('An error occurred while loading the quiz: ' + error);
        };

        if (!$scope._id) { handleError("Quiz ID is missing."); }

        $http.get('/questions', {
            params: { id: $scope._id }
        }).success(function (response) {
            if (response.success) {
                $scope.questions = _.map(response.questions, function (question) { return { question: question }; });
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
        var currentQuestion = $scope.currentQuestion();
        var submission = currentQuestion.submission;

        var handleError = function (error) {
            $scope.showError('An error occurred while submitting the question: ' + error);
        };

        $scope.closeAllAlerts();

        $http.post('/submit', {
            _id: $scope._id,
            currentQuestionIndex: $scope.currentQuestionIndex,
            submission: submission
        }).success(function (response) {
            if (response.success) {
                currentQuestion.submitted = true;
                currentQuestion.submission = submission;
                currentQuestion.isCorrect = response.isCorrect;
                currentQuestion.correctAnswer = response.correctAnswer;
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
            focus('switchedQuestion');
        }
    };

    $scope.handleEnter = function ($event) {
        var currentQuestion = $scope.currentQuestion();

        if (currentQuestion.submitted) {            // Question has been submitted already.
            $scope.next();
        } else if (currentQuestion.submission) {    // Submit question, but only if the submission field is not empty.
            $scope.submit();
        }
    };

    $scope.numCorrect = function () {
        return _.where($scope.questions, { isCorrect: true }).length;
    };

    $scope.numIncorrect = function () {
        return _.where($scope.questions, { isCorrect: false }).length;
    };

    $scope.score = function () {
        var score = 100 * $scope.numCorrect() / $scope.questions.length;
        return +score.toFixed(1);
    };


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
