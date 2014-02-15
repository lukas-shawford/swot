// Page Object for the quiz editor page
var QuizEditorPage = function () {
    var ptor = protractor.getInstance();
    
    this.quizNameField = element(by.model('quiz.name'));
    this.saveButton = element(by.id('save'));
    this.loadMessage = element(by.id('load-message'));
    this.saveStatus = element(by.id('save-message'));
    this.saveError = element(by.binding('{{saveError}}'));

    /**
     * Loads the quiz editor for a new quiz.
     */
    this.create = function () {
        browser.get(ptor.baseUrl + 'create').then(function () {
            ptor.waitForAngular();
        });
    };

    /**
     * Loads an existing quiz for editing, waiting until it has finished loading.
     */
    this.edit = function (id) {
        var self = this;
        browser.get(ptor.baseUrl + 'edit/' + id).then(function () {
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
            return ptor.wait(function () {
                return (saveStatus.getText() || saveError.getText());
            });
        });
    };

    /**
     * Retrieves the question editor field for the given question number (questions start at number
     * one, not zero). Note that this returns a promise object, not the field itself.
     */
    this.getQuestion = function (number) {
        return element(by.repeater('question in quiz.questions').row(number - 1))
                .findElement(by.css('.question-editor'));
    };

    /**
     * Retrieves the answer field for the given question number (questions start at number one, not
     * zero). Returns a promise.
     */
    this.getAnswer = function (number) {
        return element(by.repeater('question in quiz.questions').row(number - 1)).findElement(by.css('.answer-editor'));
    };
};

module.exports = QuizEditorPage;
