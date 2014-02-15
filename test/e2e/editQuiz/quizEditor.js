// Page Object for the quiz editor page
var QuizEditorPage = function () {
    var ptor = protractor.getInstance();
    
    this.quizNameField = element(by.model('quiz.name'));
    this.questions = element(by.repeater('question in quiz.questions'));
    this.saveButton = element(by.id('save'));
    this.loadMessage = element(by.id('load-message'));
    this.saveStatus = element(by.id('save-message'));
    this.saveError = element(by.binding('{{saveError}}'));

    this.create = function () {
        browser.get(ptor.baseUrl + 'create').then(function () {
            ptor.waitForAngular();
        });
    };

    this.edit = function (id) {
        browser.get(ptor.baseUrl + 'edit/' + id).then(function () {
            ptor.waitForAngular();
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
                return saveStatus.getText() || saveError.getText();
            });
        });
    };
    
};

module.exports = QuizEditorPage;
