// Page Object for the quiz editor page
var QuizEditorPage = function () {
    var ptor = protractor.getInstance();
    var page = this;

    this.quizNameField = element(by.model('quiz.name'));
    this.saveButton = element(by.id('save'));
    this.loadMessage = element(by.id('load-message'));
    this.saveStatus = element(by.id('save-message'));
    this.saveError = element(by.binding('{{saveError}}'));
    this.addQuestionButton = element(by.id('add-question'));

    /**
     * Loads the quiz editor for a new quiz.
     */
    this.create = function () {
        return browser.get(ptor.baseUrl + 'create').then(function () {
            ptor.waitForAngular();
        });
    };

    /**
     * Loads an existing quiz for editing, waiting until it has finished loading.
     */
    this.edit = function (id) {
        var self = this;
        return browser.get(ptor.baseUrl + 'edit/' + id).then(function () {
            ptor.waitForAngular();
            // Wait for the quiz to finish loading (as indicated by the "Loading..." message being
            // hidden).
            ptor.wait(function () {
                return self.loadMessage.isDisplayed().then(function (v) {
                    return v === false;
                });
            });
        });
    };

    /**
     * Clicks the save button and waits for either a save confirmation message (saveStatus), or an
     * error (saveError).
     */
    this.save = function () {
        var saveStatus = this.saveStatus;
        var saveError = this.saveError;
        return this.saveButton.click().then(function () {
            return page.waitForSaveConfirmation();
        });
    };

    /**
     * Returns both the question and the answer for the given question number (questions start at
     * number one, not zero). Returns a promise.
     */
    this.getQuestion = function (number) {
        var question = {};

        return page.getQuestionField(number).then(function (questionField) {
            return questionField.getText();
        }).then(function (text) {
            question.question = text;
            return page.getAnswerField(number);
        }).then(function (answerField) {
            return answerField.getAttribute('value');
        }).then(function (text) {
            question.answer = text;
            return question;
        });
    };

    /**
     * Clicks the Add Question button and types in the given question and answer.
     */
    this.addQuestion = function (question, answer) {
        var last;

        return page.clickAddQuestion().then(function () {
            return page.getNumQuestions();
        }).then(function (lastQuestion) {
            last = lastQuestion;
            return page.getQuestionField(last);
        }).then(function (questionField) {
            questionField.sendKeys(question);
            return page.getAnswerField(last);
        }).then(function (answerField) {
            answerField.sendKeys(answer);
        });
    };

    /**
     * Gets the number of questions currently in the quiz (returns a promise)
     */
    this.getNumQuestions = function () {
        //return element(by.repeater('question in quiz.questions')).count();
        return ptor.findElements(by.repeater('question in quiz.questions')).then(function (arr) {
            return arr.length;
        });
    };

    /**
     * Retrieves the question editor field for the given question number (questions start at number
     * one, not zero). Note that this returns a promise object, not the field itself.
     */
    this.getQuestionField = function (number) {
        return element(by.repeater('question in quiz.questions').row(number - 1))
                .findElement(by.css('.question-editor'));
    };

    /**
     * Retrieves the answer field for the given question number (questions start at number one, not
     * zero). Returns a promise.
     */
    this.getAnswerField = function (number) {
        return element(by.repeater('question in quiz.questions').row(number - 1)).findElement(by.css('.answer-editor'));
    };

    /**
     * Clicks the "Add Question" button and waits for the animation to finish playing. Moves the mouse
     * away from the button so the tooltip disappears.
     */
    this.clickAddQuestion = function () {
        return this.addQuestionButton.click().then(function () {
            return page.getNumQuestions();
        }).then(function (last) {
            browser.actions().mouseMove(page.getQuestionField(last)).perform();
            ptor.sleep(800);        // wait for animation
        });
    };

    /**
     * Deletes a question
     */
    this.deleteQuestion = function (number) {
        return element(by.repeater('question in quiz.questions').row(number - 1))
            .findElement(by.css('.delete-question'))
            .then(function (deleteButton) {
                return deleteButton.click();
            }).then(function () {
                ptor.sleep(800);
                element(by.css('.confirm-popover .confirmbutton-yes')).click();
                ptor.sleep(800);
            });
    };

    /**
     * Gets the drag handle for a question (which allows reordering questions using drag and drop).
     */
    this.getDragHandle = function (number) {
        return element(by.repeater('question in quiz.questions').row(number - 1))
                .findElement(by.css('.drag-handle'));
    };

    /**
     * Reorders questions by dragging and dropping.
     */
    this.moveQuestion = function (questionToMove, positionToMoveTo) {
        return page.getQuestionField(positionToMoveTo).then(function (dest) {
            page.getDragHandle(questionToMove).then(function (dragHandle) {
                ptor.actions().dragAndDrop(dragHandle, dest).perform();
                ptor.sleep(800);    // wait for animation
            });
        });
    };

    /**
     * Waits for the "Saved" message to become visible.
     */
    this.waitForSaveConfirmation = function () {
        var saveStatus = this.saveStatus;
        var saveError = this.saveError;

        var timeoutId = setTimeout(function () {
            throw new Error('Timed out while waiting for autosave.');
        }, 3000);

        ptor.wait(function () {
            return page.saveStatus.isDisplayed().then(function (v) {
                if (v) {
                    clearTimeout(timeoutId);
                    return true;
                }
                return false;
            });
        });
    };
};

module.exports = QuizEditorPage;
