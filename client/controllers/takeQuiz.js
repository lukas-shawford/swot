angular.module('swot').controller('ViewQuizCtrl', [ '$scope', 'quiz', 'focus', function ($scope, quiz, focus) {
    $scope._id = _quizId || null;
    $scope.questions = [{}];
    $scope.alerts = [];
    $scope.currentQuestionIndex = 0;
    $scope.showingSummary = false;

    $scope.load = function () {
        $scope.closeAllAlerts();

        quiz.questions($scope._id, function (questions) {
            $scope.questions = questions;

            _.each($scope.questions, function (question) {
                question.submission = null;
            });

            focus('switchedQuestion');
        }, function (error) {
            $scope.showError('An error occurred while loading the quiz: ' + error);
        });
    };

    $scope.submit = function () {
        $scope.closeAllAlerts();
        var currentQuestion = $scope.currentQuestion();
        var submission = currentQuestion.submission;

        quiz.submit($scope._id, $scope.currentQuestionIndex, submission, function (result) {
            currentQuestion.submitted = true;
            currentQuestion.result = result;
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
        if ($scope.isLastQuestion() && $scope.isFinished()) {
            return $scope.finish();
        }

        if ($scope.currentQuestionIndex < $scope.questions.length - 1) {
            $scope.jumpToQuestion($scope.currentQuestionIndex + 1);
        }
    };

    $scope.finish = function () {
        $scope.showingSummary = true;
    };

    $scope.exit = function () {
        window.location.href = "/quizzes";
    };

    $scope.restart = function () {
        _.each($scope.questions, function (question) {
            question.submitted = false;
            question.result = null;
            question.submission = null;
        });

        $scope.jumpToQuestion(0);
    };

    $scope.currentQuestion = function () {
        var index = $scope.currentQuestionIndex;
        if (index < 0 || index >= $scope.questions.length) { return ""; }
        return $scope.questions[index];
    };

    $scope.isLastQuestion = function () {
        return $scope.currentQuestionIndex === $scope.questions.length - 1;
    };

    $scope.jumpToQuestion = function (index) {
        if (index >= 0 && index < $scope.questions.length) {
            $scope.showingSummary = false;
            $scope.currentQuestionIndex = index;
            focus('switchedQuestion');

            // On small screens, the sidebar is offcanvas. When selecting a question from the
            // sidebar, we should scroll the selected question into view. This breaks the golden
            // rule of never doing DOM manipulation in the controller. However, the offcanvas
            // sidebar is currently not implemented as an Angular directive, so...
            $('.row-offcanvas').removeClass('active');
        }
    };

    $scope.submittedQuestions = function () {
        return _.where($scope.questions, { submitted: true });
    };

    $scope.questionResults = function () {
        return _.pluck($scope.submittedQuestions(), 'result');
    };

    $scope.numCorrect = function () {
        return _.where($scope.questionResults(), { isCorrect: true }).length;
    };

    $scope.numIncorrect = function () {
        return _.where($scope.questionResults(), { isCorrect: false }).length;
    };

    $scope.numRemaining = function() {
        return $scope.questions.length - $scope.submittedQuestions().length;
    };

    $scope.isFinished = function () {
        return $scope.numRemaining() === 0;
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
}]);
