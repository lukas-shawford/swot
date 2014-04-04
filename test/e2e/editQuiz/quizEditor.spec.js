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

    it('should be able to save a quiz with one question', function () {
        quizEditorPage.create();
        quizEditorPage.quizNameField.sendKeys('My Test Quiz');
        quizEditorPage.setQuestion(1, {
            type: 'multiple-choice',
            question: 'What is the capital of North Dakota?',
            choices: [
                'Pierre',
                'Bismarck',
                'Helena',
                'Des Moines'
            ],
            correctAnswerIndex: 1
        });
        quizEditorPage.save();
        myQuizzesPage.get();
        myQuizzesPage.getQuizzes()
        .then(function (quizzes) {
            expect(_.pluck(quizzes, 'name')).toContain('My Test Quiz');

            // Save the ID of "My Test Quiz" for later tests
            testQuizId = _.findWhere(quizzes, {name: 'My Test Quiz'}).id;
        });
    });

    it('should be able to load an existing quiz', function () {
        // Load the quiz saved in the previous test and verify everything actually got saved
        quizEditorPage.edit(testQuizId);
        expect(quizEditorPage.quizNameField.getAttribute('value')).toBe('My Test Quiz');
        expect(quizEditorPage.getQuestion(1)).toEqual({
            type: 'multiple-choice',
            question: 'What is the capital of North Dakota?',
            choices: [
                'Pierre',
                'Bismarck',
                'Helena',
                'Des Moines'
            ],
            correctAnswerIndex: 1
        });
    });

    describe('Fill-In Questions', function () {
        
        it('should be able to save a fill-in question', function () {
            // Add a fill-in question as the 2nd question
            quizEditorPage.addQuestion({
                type: 'fill-in',
                question: 'What is the default squawk code for VFR aircraft in the United States?',
                answer: '1200',
                ignoreCase: true
            });

            quizEditorPage.save();
            
            // Make sure all the fields were saved
            quizEditorPage.edit(testQuizId);
            expect(quizEditorPage.getQuestion(2)).toEqual({
                type: 'fill-in',
                question: 'What is the default squawk code for VFR aircraft in the United States?',
                answer: '1200',
                ignoreCase: true
            });
        });

        it('should be able to duplicate a fill-in question', function () {
            quizEditorPage.copyQuestion(2);
            expect(quizEditorPage.getQuestion(3)).toEqual({
                type: 'fill-in',
                question: 'What is the default squawk code for VFR aircraft in the United States?',
                answer: '1200',
                ignoreCase: true
            });

            // Should be a distinct copy - try editing the copy's answer, and make sure the original
            // stays the same
            quizEditorPage.getFillInAnswerField(3)
            .then(function (answerField) {
                answerField.sendKeys(' - updated');
                expect(quizEditorPage.getFillInAnswer(2), '1200');

                // Delete the copy to restore the quiz back to its previous state
                quizEditorPage.deleteQuestion(3);
            });
        });

        it('should be able to add a question by hitting TAB on the answer field for the last question', function () {
            quizEditorPage.getFillInAnswerField(2)
            .then(function (lastAnswerField) {
                lastAnswerField.sendKeys(protractor.Key.TAB);
                ptor.sleep(1000);
                return quizEditorPage.getNumQuestions();
            })
            .then(function (numQuestions) {
                expect(numQuestions).toBe(3);
                quizEditorPage.save();
            });
        });

        it('should be able to save the value of the "Ignore capitalization" setting', function () {
            quizEditorPage.setQuestion(3, {
                type: 'fill-in',
                question: 'Case sensitive',
                answer: 'ANSWER',
                ignoreCase: false   // The default is true - set it to false and make sure it saved.
            });

            quizEditorPage.save();
            expect(quizEditorPage.getFillInIgnoreCase(3)).toBeFalsy();
        });

        it('should copy the "Ignore capitalization" setting when duplicating a question', function () {
            quizEditorPage.copyQuestion(3);
            expect(quizEditorPage.getFillInIgnoreCase(4)).toBeFalsy();
            quizEditorPage.deleteQuestion(4);   // Restore
        });

    });

    describe('Multiple Choice Questions', function () {
        
        it('should default in 4 empty choices', function () {
            quizEditorPage.setQuestionType(3, 'multiple-choice');
            expect(quizEditorPage.getNumChoices(3)).toBe(4);
        });

        it('should be able to save a multiple choice question', function () {
            quizEditorPage.setQuestion(3, {
                type: 'multiple-choice',
                question: 'What color identifies the normal flap operating range?',
                choices: [
                    'Yellow',
                    'Black',
                    'White',
                    'Green'
                ],
                correctAnswerIndex: 2
            }, true);
            
            quizEditorPage.save();
            
            // Make sure all the fields were saved
            quizEditorPage.edit(testQuizId);
            expect(quizEditorPage.getQuestion(3)).toEqual({
                type: 'multiple-choice',
                question: 'What color identifies the normal flap operating range?',
                choices: [
                    'Yellow',
                    'Black',
                    'White',
                    'Green'
                ],
                correctAnswerIndex: 2
            });
        });

        it('should be able to add a choice', function () {
            quizEditorPage.clickAddChoice(3);
            quizEditorPage.setChoice(3, 4, 'Orange');
            
            quizEditorPage.save();
            
            // Make sure all the fields were saved
            quizEditorPage.edit(testQuizId);
            expect(quizEditorPage.getQuestion(3)).toEqual({
                type: 'multiple-choice',
                question: 'What color identifies the normal flap operating range?',
                choices: [
                    'Yellow',
                    'Black',
                    'White',
                    'Green',
                    'Orange'
                ],
                correctAnswerIndex: 2
            });
        });

        it('should retain correct choice index after removing a choice higher in the list', function () {
            quizEditorPage.removeChoice(3, 0);
            expect(quizEditorPage.getCorrectChoiceIndex(3)).toBe(1);
        });

        it('should clear correct choice index after removing the correct choice', function () {
            quizEditorPage.removeChoice(3, 1);
            expect(quizEditorPage.getCorrectChoiceIndex(3)).toBe(-1);
        });

        it('should be able to edit a choice', function () {
            quizEditorPage.setChoice(3, 2, 'White', true);
            quizEditorPage.markChoiceAsCorrect(3, 2);
            quizEditorPage.save();
            quizEditorPage.edit(testQuizId);
            expect(quizEditorPage.getQuestion(3)).toEqual({
                type: 'multiple-choice',
                question: 'What color identifies the normal flap operating range?',
                choices: [
                    'Black',
                    'Green',
                    'White'
                ],
                correctAnswerIndex: 2
            });
        });

        it('should be able to duplicate a multiple choice question', function () {
            quizEditorPage.copyQuestion(3);
            expect(quizEditorPage.getQuestion(4)).toEqual({
                type: 'multiple-choice',
                question: 'What color identifies the normal flap operating range?',
                choices: [
                    'Black',
                    'Green',
                    'White'
                ],
                correctAnswerIndex: 2
            });

            // Should be a distinct copy - try editing one of the choices on the copy, and make sure
            // the corresponding choice on the original question stays the same
            quizEditorPage.setChoice(4, 1, 'Turqoise', true);
            
            // Delete the copy to restore the quiz back to its previous state
            quizEditorPage.deleteQuestion(4);
        });

    });

    it('should be able to reorder questions', function () {
        quizEditorPage.edit(testQuizId);
        quizEditorPage.moveQuestion(2, 1);
        quizEditorPage.save();
        quizEditorPage.edit(testQuizId);
        
        // What used to be question #2 should now be question #1
        expect(quizEditorPage.getQuestion(1)).toEqual({
            type: 'fill-in',
            question: 'What is the default squawk code for VFR aircraft in the United States?',
            answer: '1200',
            ignoreCase: true
        });

        // What used to be question #1 should now be question #2
        expect(quizEditorPage.getQuestion(2)).toEqual({
            type: 'multiple-choice',
            question: 'What is the capital of North Dakota?',
            choices: [
                'Pierre',
                'Bismarck',
                'Helena',
                'Des Moines'
            ],
            correctAnswerIndex: 1
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
            expect(quizEditorPage.getQuestion(1)).toEqual({
                type: 'fill-in',
                question: 'What is the default squawk code for VFR aircraft in the United States? (Updated)',
                answer: '1200',
                ignoreCase: true
            });
        });
    });

    it('should be able to delete a question', function () {
        quizEditorPage.edit(testQuizId);
        quizEditorPage.deleteQuestion(2);
        quizEditorPage.save();
        quizEditorPage.edit(testQuizId);
        expect(quizEditorPage.getNumQuestions()).toBe(2);
    });

    it('should not be able to delete a quiz that has not been saved yet', function () {
        quizEditorPage.create();
        expect(quizEditorPage.quizSettingsButton.isDisplayed()).toBeFalsy();

        // Save the quiz so we can test deleting it later.
        quizEditorPage.quizNameField.sendKeys('Delete Me');
        quizEditorPage.save();

        // The settings dropdown should be visible now that the quiz has been saved
        expect(quizEditorPage.quizSettingsButton.isDisplayed()).toBeTruthy();
    });

    it('should be able to delete a quiz', function () {
        myQuizzesPage.get();
        myQuizzesPage.getQuizzes().then(function (quizzes) {
            var quizId = _.findWhere(quizzes, {name: 'Delete Me'}).id;
            return quizEditorPage.edit(quizId);
        }).then(function () {
            return quizEditorPage.deleteQuiz();
        }).then(function () {
            myQuizzesPage.get();
            myQuizzesPage.getQuizzes().then(function (quizzes) {
                expect(_.pluck(quizzes, 'name')).not.toContain('Delete Me');
            });
        });
    });
});
