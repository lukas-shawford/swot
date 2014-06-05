angular.module('swot').service('quiz', ['$http', function ($http) {
    var self = this;
    
    /**
     * Creates a new quiz. (For updating an existing quiz, use the 'save' method.)
     * @param {Object} quiz - A serialized quiz instance.
     * @param {Function} success - Function to run on success. This function should accept a single
     *      'id' parameter which is the ID of the newly-created quiz.
     * @param {Function} error - Function to run on failure, accepting a single parameter containing
     *      the error message.
     */
    this.create = function (quiz, success, error) {
        $http.post('/create', quiz).success(function (response) {
            if (response.success) { success(response.id); }
            else { error(response.message); }
        }).error(function (data) {
            error(self.getError(data));
        });
    };

    /**
     * Loads a quiz from the server.
     *
     * This is intended to be used in the editing context because it loads both the questions and
     * the answers. Do NOT use this when loading a quiz in the context of actually taking the quiz
     * (since the answers could be gleaned by watching the network trace) - instead, use the
     * 'questions' method to load just the questions.
     *
     * @param {String} id - Quiz ID
     * @param {Function} success - Function to run on success. This should accept a 'response'
     *      parameter which holds the actual response from the server. It may be assumed that
     *      response.success is true (the error function will be called otherwise).
     * @param {Function} error - Function to run on error. This function will be run if something
     *      went wrong with sending the response itself (xhr error), or if the server's response
     *      had the 'success' property set to false (e.g., because the quiz ID was invalid). The
     *      function should accept a single 'error' parameter containing the error message.
     */
    this.load = function (id, success, error) {
        $http.get('/load', {
            params: { id: id }
        }).success(function (response) {
            if (response.success) { success(response); }
            else { error(response.message); }
        }).error(function (data) {
            error(self.getError(data));
        });
    };

    /**
     * Saves an existing quiz. (For creating a new quiz, use the 'create' method.)
     * @param {Object} quiz - A serialized quiz instance.
     * @param {Function} success - Function to run on success (no params).
     * @param {Function} error - Function to run on failure, accepting a single parameter containing
     *      the error message.
     */
    this.save = function (quiz, success, error) {
        $http.post('/save', quiz
        ).success(function (response) {
            if (response.success) { success(); }
            else { error(response.message); }
        }).error(function (data) {
            error(self.getError(data));
        });
    };

    /**
     * Deletes a quiz.
     * @param {String} id - Quiz ID of the quiz to delete.
     * @param {Function} success - Function to run on success (no params).
     * @param {Function} error - Function to run on failure, accepting a single parameter containing
     *      the error message.
     */
    this.deleteQuiz = function (id, success, error) {
        $http.post('/delete',
            { _id: id }
        ).success(function (response) {
            success();
        }).error(function (data) {
            error(self.getError(data));
        });
    };

    /**
     * Loads only the questions for the specified quiz.
     * @param {String} id - Quiz ID
     * @param {Function} success - Function to run on success. This should accept a 'questions'
     *     parameter which holds the array of questions.
     * @param {Function} error - Function to run on failure, accepting a single parameter containing
     *      the error message.
     */
    this.questions = function (id, success, error) {
        $http.get('/questions', {
            params: { id: id }
        }).success(function (response) {
            if (response.success) { success(response.questions); }
            else { error(response.message); }
        }).error(function (data) {
            error(self.getError(data));
        });
    };

    /**
     * Sends a user's submission for a given question within the given quiz to the server for
     * grading.
     * @param {String} quizId - Quiz ID
     * @param {Number} questionIndex - Index of the question within the quiz that this submission
     *      is meant for.
     * @param {Object} submission - The user's submission
     * @param {Function} success - Function to run if the submission was submitted successfully
     *      (which does not necessarily mean the submission was correct). The function should
     *      accept an object indicating the result of submitting the question (TO DO: DOCUMENT).
     * @param {Function} error - Function to run if an error occurred while sending the submission.
     *      This should accept a single parameter containing the error message.
     */
    this.submit = function (quizId, questionIndex, submission, success, error) {
        $http.post('/submit', {
            _id: quizId,
            currentQuestionIndex: questionIndex,
            submission: submission
        }).success(function (response) {
            if (response.success) { success(response); }
            else { error(response.message); }
        }).error(function (data) {
            error(self.getError(data));
        });
    };

    this.getError = function (data) {
        var defaultMessage = 'Request failed.';

        if (data) {
            if (typeof data === 'object') {
                if (typeof data.message === 'string') { return data.message; }
                if (typeof data.error === 'object') {
                    return data.error.message + data.error.stack || defaultMessage;
                }
            } else if (typeof data === 'string') {
                return data;
            }
        }

        return defaultMessage;
    };

}]);
