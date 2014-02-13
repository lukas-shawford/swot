var LoginPage = require('../login/login');
var QuizEditorPage = require('./quizEditor');
var MyQuizzesPage = require('./myQuizzes');

describe('Quiz Editor', function () {
    var ptor;
    var loginPage;
    var quizEditorPage;
    var myQuizzesPage;

    beforeEach(function () {
        loginPage = new LoginPage();
        quizEditorPage = new QuizEditorPage();
        myQuizzesPage = new MyQuizzesPage();
        ptor = protractor.getInstance();
        ptor.ignoreSynchronization = true;
        loginPage.loginAsTestUser();
    });

    it('should be able to save an empty quiz', function () {
        quizEditorPage.create();
        quizEditorPage.quizNameField.sendKeys('An Empty Quiz');
        quizEditorPage.save().then(function () {
            myQuizzesPage.get();
            myQuizzesPage.getQuizzes().then(function (quizzes) {
                expect(quizzes).toContain('An Empty Quiz');
            });
        });
    });
});
