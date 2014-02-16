var _ = require('underscore');
var util = require('util');
var QuizPage = require('./QuizPage');
var LoginPage = require('../login/login');
var QuizEditorPage = require('../editQuiz/quizEditor');
var MyQuizzesPage = require('../editQuiz/myQuizzes');

describe('Take Quiz', function () {
    var ptor;
    var quizPage;
    var loginPage;
    var quizEditorPage;
    var myQuizzesPage;
    var testQuizId;

    beforeEach(function () {
        quizPage = new QuizPage();
        loginPage = new LoginPage();
        quizEditorPage = new QuizEditorPage();
        myQuizzesPage = new MyQuizzesPage();
        ptor = protractor.getInstance();
        ptor.ignoreSynchronization = true;
    });

    it('logs in as the test user and find the test quiz (beforeAll)', function () {
        // This is not an actual test, it's a poor man's "beforeAll" hook. (Jasmine does not support
        // beforeAll).
        loginPage.loginAsTestUser();
        myQuizzesPage.get();
        return myQuizzesPage.getQuizzes().then(function (quizzes) {
            testQuizId = _.findWhere(quizzes, {name: 'VFR Operations'}).id;
        });
    });

    it('should be able to load the quiz', function () {
        quizPage.get(testQuizId);
        expect(quizPage.quizName.getText()).toBe('VFR Operations');
        expect(quizPage.questions.count()).toBe(5);
    });

    it('should be able to navigate the quiz using the sidebar', function () {
        quizPage.get(testQuizId);
        expect(quizPage.currentQuestion.getText()).toContain('What is the capital of North Dakota?');
        quizPage.jumpToQuestion(2);
        expect(quizPage.currentQuestion.getText()).toContain('What color identifies the normal flap operating range?');
        quizPage.jumpToQuestion(5);
        expect(quizPage.currentQuestion.getText()).toContain('What is the minimum number of statute miles of visibility for Class B airspace operations when operating under VFR?');
    });

    it('should show "correct" message for correct submissions', function () {
        quizPage.get(testQuizId);

        // Submit question 1
        quizPage.submissionField.sendKeys('Bismarck');
        quizPage.submitButton.click();
        expect(quizPage.correctAlert.isDisplayed()).toBe(true);
        expect(quizPage.incorrectAlert.isDisplayed()).toBe(false);

        // Submit question 3
        quizPage.jumpToQuestion(3);
        quizPage.submissionField.sendKeys('1200');
        quizPage.submitButton.click();
        expect(quizPage.correctAlert.isDisplayed()).toBe(true);
        expect(quizPage.incorrectAlert.isDisplayed()).toBe(false);
    });

    it('should show "incorrect" message for wrong submissions', function () {
        quizPage.get(testQuizId);

        // Submit question 1
        quizPage.submissionField.sendKeys('Pierre');
        quizPage.submitButton.click();
        expect(quizPage.correctAlert.isDisplayed()).toBe(false);
        expect(quizPage.incorrectAlert.isDisplayed()).toBe(true);

        // Submit question 3
        quizPage.jumpToQuestion(3);
        quizPage.submissionField.sendKeys('7700');
        quizPage.submitButton.click();
        expect(quizPage.correctAlert.isDisplayed()).toBe(false);
        expect(quizPage.incorrectAlert.isDisplayed()).toBe(true);
    });
});
