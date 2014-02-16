var _ = require('underscore');
var util = require('util');
var LoginPage = require('../login/login');
var QuizEditorPage = require('./quizEditor');
var MyQuizzesPage = require('./myQuizzes');

describe('Quiz Editor', function () {
    var ptor;
    var loginPage;
    var quizEditorPage;
    var myQuizzesPage;
    var testQuizId;

    beforeEach(function () {
        loginPage = new LoginPage();
        quizEditorPage = new QuizEditorPage();
        myQuizzesPage = new MyQuizzesPage();
        ptor = protractor.getInstance();
        ptor.ignoreSynchronization = true;
    });

    it('logs in as the test user (beforeAll)', function () {
        // This is not an actual test, it's a poor man's "beforeAll" hook. (Jasmine does not support
        // beforeAll).
        loginPage.loginAsTestUser();
    });

    it('should be able to save a quiz', function () {
        quizEditorPage.create();
        
        quizEditorPage.quizNameField.sendKeys('My Test Quiz');

        quizEditorPage.getQuestion(1).then(function (question) {
            question.sendKeys('What is the capital of North Dakota?');
            return quizEditorPage.getAnswer(1);
        }).then(function (answer) {
            answer.sendKeys('Bismarck');
            quizEditorPage.save().then(function () {
                myQuizzesPage.get();
                myQuizzesPage.getQuizzes().then(function (quizzes) {
                    expect(_.pluck(quizzes, 'name')).toContain('My Test Quiz');

                    // Save the ID of "My Test Quiz" for later tests
                    testQuizId = _.findWhere(quizzes, {name: 'My Test Quiz'}).id;
                });
            });
        });
    });

    it('should be able to load an existing quiz', function () {
        // Load the quiz saved in the previous test and verify everything actually got saved
        quizEditorPage.edit(testQuizId);
        expect(quizEditorPage.quizNameField.getAttribute('value')).toBe('My Test Quiz');

        quizEditorPage.getQuestion(1).then(function (question) {
            expect(question.getText()).toBe('What is the capital of North Dakota?');
            return quizEditorPage.getAnswer(1);
        }).then(function (answer) {
            expect(answer.getAttribute('value')).toBe('Bismarck');
        });
    });

    it('should be able to add a question', function () {
        quizEditorPage.edit(testQuizId);
        quizEditorPage.addQuestion().then(function () {
            return quizEditorPage.getQuestion(2);
        }).then(function (question2) {
            question2.sendKeys('What is the default squawk code of VFR aircraft in the United States?');
            return quizEditorPage.getAnswer(2);
        }).then(function (answer2) {
            answer2.sendKeys('1200');

            // Save the quiz
            return quizEditorPage.save();

        }).then(function () {
            // Navigate to a different page
            myQuizzesPage.get();

            // Reopen the quiz
            quizEditorPage.edit(testQuizId);

            // Check the first question is still the same
            return quizEditorPage.getQuestion(1);
        }).then(function (question1) {
            expect(question1.getText()).toBe('What is the capital of North Dakota?');
            return quizEditorPage.getAnswer(1);
        }).then(function (answer1) {
            expect(answer1.getAttribute('value')).toBe('Bismarck');

            // Check the new question was saved successfully.
            return quizEditorPage.getQuestion(2);
        }).then(function (question2) {
            expect(question2.getText()).toBe('What is the default squawk code of VFR aircraft in the United States?');
            return quizEditorPage.getAnswer(2);
        }).then(function (answer2) {
            expect(answer2.getAttribute('value')).toBe('1200');
        });
    });

    it('should be able to reorder questions', function () {
        quizEditorPage.edit(testQuizId);
        quizEditorPage.moveQuestion(2, 1).then(function () {
            quizEditorPage.getQuestion(1).then(function (question) {
                expect(question.getText()).toBe('What is the default squawk code of VFR aircraft in the United States?');
            });
        });
    });
});
