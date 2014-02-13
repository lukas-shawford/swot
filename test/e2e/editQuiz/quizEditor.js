// Page Object for the quiz editor page
var QuizEditorPage = function () {
    var ptor = protractor.getInstance();
    
    this.quizNameField = element(by.model('quiz.name'));
    this.questions = element(by.repeater('question in quiz.questions'));
    this.saveButton = element(by.id('save'));
    
    // Looking up saveStatus by binding does not work due to what I suspect is a bug in Angular.
    // Protractor looks for elements containing bindings by searching for the 'ng-binding' class,
    // but the save status span does not get decorated with that class, despite angular's tests
    // suggesting that it should, since it contains a {{binding}}. Look it up by CSS instead.
    //this.saveStatus = element(by.binding('{{saveStatus}}'));
    this.saveStatus = element(by.css('.save-message'));

    this.saveError = element(by.binding('{{saveMessage}}'));

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
