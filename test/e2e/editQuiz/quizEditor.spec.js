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

        quizEditorPage.getQuestionField(1).then(function (question) {
            question.sendKeys('What is the capital of North Dakota?');
            return quizEditorPage.getAnswerField(1);
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

        quizEditorPage.getQuestionField(1).then(function (question) {
            expect(question.getText()).toBe('What is the capital of North Dakota?');
            return quizEditorPage.getAnswerField(1);
        }).then(function (answer) {
            expect(answer.getAttribute('value')).toBe('Bismarck');
        });
    });

    it('should be able to add a question', function () {
        quizEditorPage.edit(testQuizId);
        quizEditorPage
            .addQuestion('What is the default squawk code of VFR aircraft in the United States?', '1200')
            .then(function () {
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
                expect(question1.question).toBe('What is the capital of North Dakota?');
                expect(question1.answer).toBe('Bismarck');

                // Check the new question was saved successfully.                
                return quizEditorPage.getQuestion(2);
            }).then(function (question2) {
                expect(question2.question).toBe('What is the default squawk code of VFR aircraft in the United States?');
                expect(question2.answer).toBe('1200');
            });
    });

    it('should be able to reorder questions', function () {
        quizEditorPage.edit(testQuizId);
        quizEditorPage.moveQuestion(2, 1).then(function () {
            return quizEditorPage.save();
        }).then(function () {
            return quizEditorPage.edit(testQuizId);
        }).then(function () {
            quizEditorPage.getQuestionField(1).then(function (question) {
                expect(question.getText()).toBe('What is the default squawk code of VFR aircraft in the United States?');
            });
        });
    });
    
    it('should autosave', function () {
        quizEditorPage.edit(testQuizId);
        quizEditorPage.getQuestionField(1).then(function (field) {

            // Update the first question and wait for it to autosave
            field.sendKeys(protractor.Key.chord(protractor.Key.CONTROL, protractor.Key.END));
            field.sendKeys(' (Updated)');
            quizEditorPage.waitForSaveConfirmation();
            
            // Do NOT click the save button - just reload the quiz and make sure the question got
            // updated
            quizEditorPage.edit(testQuizId);
            return quizEditorPage.getQuestion(1);
        }).then(function (question1) {
            expect(question1.question).toMatch(/\(Updated\)$/);
        });
    });

    it('should be able to add a question by hitting TAB', function () {
        var initialNumberOfQuestions;

        quizEditorPage.edit(testQuizId);
        quizEditorPage.getNumQuestions().then(function (last) {
            initialNumberOfQuestions = last;
            return quizEditorPage.getAnswerField(last);
        }).then(function (lastAnswerField) {
            lastAnswerField.sendKeys(protractor.Key.TAB);
            ptor.sleep(1000);
            return quizEditorPage.getNumQuestions();
        }).then(function (newNumberOfQuestions) {
            expect(newNumberOfQuestions).toBe(initialNumberOfQuestions + 1);
            quizEditorPage.save();
        });
    });

    it('should be able to delete a question', function () {
        var initialNumberOfQuestions;

        quizEditorPage.edit(testQuizId).then(function () {
            return quizEditorPage.getNumQuestions();
        }).then(function (last) {
            initialNumberOfQuestions = last;
            return quizEditorPage.deleteQuestion(last);
        }).then(function () {
            return quizEditorPage.save();
        }).then(function () {
            return quizEditorPage.edit(testQuizId);
        }).then(function () {
            return quizEditorPage.getNumQuestions();
        }).then(function (newNumberOfQuestions) {
            expect(newNumberOfQuestions).toBe(initialNumberOfQuestions - 1);
        });
    });
});
