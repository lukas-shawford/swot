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

        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 1 of 5');
        expect(quizPage.currentQuestion.getText()).toContain('What is the capital of North Dakota?');

        quizPage.jumpToQuestion(2);
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 2 of 5');
        expect(quizPage.currentQuestion.getText()).toContain('What color identifies the normal flap operating range?');

        quizPage.jumpToQuestion(5);
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 5 of 5');
        expect(quizPage.currentQuestion.getText()).toContain('What is the minimum number of statute miles of visibility for Class B airspace operations when operating under VFR?');
    });

    it('should be able to navigate the quiz using "next" and "previous" links', function () {
        quizPage.get(testQuizId);

        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 1 of 5');
        expect(quizPage.currentQuestion.getText()).toContain('What is the capital of North Dakota?');

        // Clicking "Previous" should not do anything since we're already on the first question
        quizPage.prevLink.click();
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 1 of 5');
        expect(quizPage.currentQuestion.getText()).toContain('What is the capital of North Dakota?');

        // Click next
        quizPage.nextLink.click();
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 2 of 5');
        expect(quizPage.currentQuestion.getText()).toContain('What color identifies the normal flap operating range?');

        // Click previous
        quizPage.prevLink.click();
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 1 of 5');
        expect(quizPage.currentQuestion.getText()).toContain('What is the capital of North Dakota?');

        // Click next all the way to the end
        quizPage.nextLink.click();
        quizPage.nextLink.click();
        quizPage.nextLink.click();
        quizPage.nextLink.click();
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 5 of 5');
        expect(quizPage.currentQuestion.getText()).toContain('What is the minimum number of statute miles of visibility for Class B airspace operations when operating under VFR?');

        // Clicking "Next" should not do anything since we're already on the last question
        quizPage.nextLink.click();
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 5 of 5');
        expect(quizPage.currentQuestion.getText()).toContain('What is the minimum number of statute miles of visibility for Class B airspace operations when operating under VFR?');
    });

    it('should be able to go to next question by clicking "Next" after submitting', function () {
        quizPage.get(testQuizId);

        quizPage.submissionField.sendKeys('Bismarck');
        quizPage.submitButton.click();
        expect(quizPage.nextButton.isDisplayed()).toBe(true);

        quizPage.nextButton.click();
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 2 of 5');
        expect(quizPage.currentQuestion.getText()).toContain('What color identifies the normal flap operating range?');
    });

    it('should not show "Finish" button after submitting the last question without having finished the entire quiz', function () {
        quizPage.get(testQuizId);

        // Jump to the last question and submit it
        quizPage.jumpToQuestion(5);
        quizPage.submissionField.sendKeys('3');
        quizPage.submitButton.click();

        // The "Next" button is labeled "Finish" if this is the last question. However, it should not
        // be displayed at this point because there are questions that haven't been answered yet.
        expect(quizPage.nextButton.isDisplayed()).toBe(false);
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

    it('should show question submission status in the sidebar', function () {
        quizPage.get(testQuizId);
        var isFalse = function (v) { return !v; };

        // Initially, all questions should be pending (neither correct nor incorrect)
        quizPage.getSidebar().then(function (sidebar) {
            expect(_.every(_.pluck(sidebar, 'correct'), isFalse)).toBe(true);
            expect(_.every(_.pluck(sidebar, 'incorrect'), isFalse)).toBe(true);
        });

        // Submit question 1 and verify that it got marked correct
        quizPage.submissionField.sendKeys('Bismarck');
        quizPage.submitButton.click();
        quizPage.getSidebar().then(function (sidebar) {
            expect(_.pluck(sidebar, 'correct')).toEqual([true, false, false, false, false]);
            expect(_.every(_.pluck(sidebar, 'incorrect'), isFalse)).toBe(true);
        });

        // Submit question 3 and verify that it got marked incorrect
        quizPage.jumpToQuestion(3);
        quizPage.submissionField.sendKeys('7700');
        quizPage.submitButton.click();
        quizPage.getSidebar().then(function (sidebar) {
            expect(_.pluck(sidebar, 'correct')).toEqual(  [true, false, false, false, false]);
            expect(_.pluck(sidebar, 'incorrect')).toEqual([false, false, true, false, false]);
        });
    });

    it('should show score tooltip when hovering over progress bar', function () {
        quizPage.get(testQuizId);
        quizPage.getScoreTooltip().then(function (content) {
            expect(content).toContain('Current score: 0 / 5');

            // Submit question 1 correctly
            quizPage.submissionField.sendKeys('Bismarck');
            quizPage.submitButton.click();
            return quizPage.getScoreTooltip();
        })
        .then(function (content) {
            expect(content).toContain('Current score: 1 / 5');
            expect(content).toContain('Correct: 1');

            // Submit question 2 incorrectly
            quizPage.nextButton.click();
            quizPage.submissionField.sendKeys('red');
            quizPage.submitButton.click();
            return quizPage.getScoreTooltip();
        })
        .then(function (content) {
            expect(content).toContain('Current score: 1 / 5');
            expect(content).toContain('Incorrect: 1');
        });
    });

    it('should be able to finish quiz after submitting all the questions', function () {
        quizPage.get(testQuizId);

        // Submit question 1
        quizPage.submissionField.sendKeys('Bismarck');
        quizPage.submitButton.click();
        quizPage.nextButton.click();

        // Submit question 2
        quizPage.submissionField.sendKeys('white');
        quizPage.submitButton.click();
        quizPage.nextButton.click();

        // Submit question 3 - incorrectly
        quizPage.submissionField.sendKeys('7700');
        quizPage.submitButton.click();
        quizPage.nextButton.click();

        // Submit question 4
        quizPage.submissionField.sendKeys('30');
        quizPage.submitButton.click();
        quizPage.nextButton.click();

        // Submit question 5
        quizPage.submissionField.sendKeys('3');
        quizPage.submitButton.click();

        // Verify the Finish button is visible
        expect(quizPage.nextButton.isDisplayed()).toBe(true);
        expect(quizPage.nextButton.getText()).toContain('Finish');
        
        // Finish the quiz and verify we're on the summary screen
        quizPage.nextButton.click();
        expect(quizPage.summaryContainer.isDisplayed()).toBe(true);

        // Verify the score is correct
        expect(quizPage.summaryScore.getText()).toBe('4 / 5');
        expect(quizPage.summaryScore.getText()).toBe('4 / 5');
        expect(quizPage.summaryScorePercent.getText()).toContain('80%');
    });
});
