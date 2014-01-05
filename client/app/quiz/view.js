angular.module('swot').controller('ViewQuizCtrl', function (quiz, $scope, focus) {
    $scope._id = _quizId || null;
    $scope.questions = [{}];
    $scope.alerts = [];
    $scope.currentQuestionIndex = 0;

    $scope.load = function () {
        $scope.closeAllAlerts();

        quiz.questions($scope._id, function (questions) {
            $scope.questions = _.map(questions, function (question) { return { question: question }; });
            focus('switchedQuestion');
        }, function (error) {
            $scope.showError('An error occurred while loading the quiz: ' + error);
        });
    };

    $scope.submit = function () {
        $scope.closeAllAlerts();
        var currentQuestion = $scope.currentQuestion();
        var submission = currentQuestion.submission;

        quiz.submit($scope._id, $scope.currentQuestionIndex, submission, function (isCorrect, correctAnswer) {
            currentQuestion.submitted = true;
            currentQuestion.isCorrect = isCorrect;
            currentQuestion.correctAnswer = correctAnswer;
            currentQuestion.submission = submission;    // Restore in case it was edited while waiting for the response.
        }, function (error) {
            $scope.showError('An error occurred while submitting the question: ' + error);
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

    $scope.numRemaining = function() {
        return $scope.questions.length - _.where($scope.questions, { submitted: true }).length;
    };

    $scope.score = function () {
        var score = 100 * $scope.numCorrect() / $scope.questions.length;
        return +score.toFixed(1);
    };

    $scope.getScoreTooltip = function() {
        return '<div class="score-tooltip">' +
            "Current score: <strong>" + $scope.numCorrect() + " / " +
            $scope.questions.length + "</strong> (" + $scope.score() + "%)" +
            "<br/>Correct: " + $scope.numCorrect() +
            "<br/>Incorrect: " + $scope.numIncorrect() +
            "<br/>Remaining: " + $scope.numRemaining() +
            "</div>";
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
