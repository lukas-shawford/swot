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
        expect(quizPage.questions.count()).toBe(6);
    });

    it('should be able to navigate the quiz using "next" and "previous" links', function () {
        quizPage.get(testQuizId);

        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 1 of 6');
        expect(quizPage.currentQuestion.getText()).toContain('What is the capital of North Dakota?');

        // Clicking "Previous" should not do anything since we're already on the first question
        quizPage.prevLink.click();
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 1 of 6');
        expect(quizPage.currentQuestion.getText()).toContain('What is the capital of North Dakota?');

        // Click next
        quizPage.nextLink.click();
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 2 of 6');
        expect(quizPage.currentQuestion.getText()).toContain('What color identifies the normal flap operating range?');

        // Click previous
        quizPage.prevLink.click();
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 1 of 6');
        expect(quizPage.currentQuestion.getText()).toContain('What is the capital of North Dakota?');

        // Click next all the way to the end
        quizPage.nextLink.click();
        quizPage.nextLink.click();
        quizPage.nextLink.click();
        quizPage.nextLink.click();
        quizPage.nextLink.click();
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 6 of 6');
        expect(quizPage.currentQuestion.getText()).toContain('Fill In: Case sensitive');

        // Clicking "Next" should not do anything since we're already on the last question
        quizPage.nextLink.click();
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 6 of 6');
        expect(quizPage.currentQuestion.getText()).toContain('Fill In: Case sensitive');
    });

    it('should be able to go to next question by clicking "Next" after submitting', function () {
        quizPage.get(testQuizId);
        quizPage.submit(1);
        expect(quizPage.isNextVisible()).toBe(true);
        quizPage.clickNextButton();
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 2 of 6');
        expect(quizPage.currentQuestion.getText()).toContain('What color identifies the normal flap operating range?');
    });

    it('should not show "Finish" button after submitting the last question without having finished the entire quiz', function () {
        quizPage.get(testQuizId);

        // Jump to the last question and submit it
        quizPage.jumpToQuestion(6);
        quizPage.submit('ANSWER');

        // The "Next" button is labeled "Finish" if this is the last question. However, it should not
        // be displayed at this point because there are questions that haven't been answered yet.
        expect(quizPage.isNextVisible()).toBe(false);
    });

    describe('Fill In Questions', function () {
        it('should show "correct" message for correct submissions', function () {
            quizPage.get(testQuizId);

            // Submit question 3
            quizPage.jumpToQuestion(3);
            quizPage.submit('1200');
            expect(quizPage.correctAlert.isDisplayed()).toBe(true);
            expect(quizPage.incorrectAlert.isDisplayed()).toBe(false);

            // Submit question 4
            quizPage.clickNextButton();
            quizPage.submit('30');
            expect(quizPage.correctAlert.isDisplayed()).toBe(true);
            expect(quizPage.incorrectAlert.isDisplayed()).toBe(false);
        });

        it('should show "incorrect" message and state the correct answer for wrong submissions', function () {
            quizPage.get(testQuizId);

            // Submit question 3
            quizPage.jumpToQuestion(3);
            quizPage.submit('7700');
            expect(quizPage.correctAlert.isDisplayed()).toBe(false);
            expect(quizPage.incorrectAlert.isDisplayed()).toBe(true);
            expect(quizPage.correctAnswerFillIn.getText()).toBe('1200');

            // Submit question 4
            quizPage.clickNextButton();
            quizPage.submit('50');
            expect(quizPage.correctAlert.isDisplayed()).toBe(false);
            expect(quizPage.incorrectAlert.isDisplayed()).toBe(true);
            expect(quizPage.correctAnswerFillIn.getText()).toBe('30');
        });

        it('should ignore case when the "Ignore capitalization" setting is turned on', function () {
            // Submit question 5
            quizPage.clickNextButton();
            quizPage.submit('aNsWeR');  // Correct answer is "Answer", but submit with different casing
            expect(quizPage.correctAlert.isDisplayed()).toBe(true);
            expect(quizPage.incorrectAlert.isDisplayed()).toBe(false);
        });

        it('should do case-sensitive comparison when the "Ignore capitalization" setting is turned off', function () {
            // Submit question 6
            quizPage.clickNextButton();
            quizPage.submit('aNsWeR');  // Correct answer is "ANSWER", but submit with different casing
            expect(quizPage.correctAlert.isDisplayed()).toBe(false);
            expect(quizPage.incorrectAlert.isDisplayed()).toBe(true);
        });
    });

    describe('Multiple Choice Questions', function () {
        it('should show the appropriate choices for the question', function () {
            quizPage.get(testQuizId);

            // Check choices for question 1
            expect(quizPage.getChoices()).toEqual(['Pierre', 'Bismarck', 'Helena', 'Des Moines']);

            // Check choices for question 2
            quizPage.nextLink.click();
            expect(quizPage.getChoices()).toEqual(['Yellow', 'Black', 'White', 'Green']);
        });

        it('should not enable submit button until a choice is selected', function () {
            quizPage.get(testQuizId);

            // No choice selected yet - Submit button should be disabled
            expect(quizPage.isSubmitEnabled()).toBe(false);

            // Select a choice, and ensure the Submit button becomes enabled
            quizPage.selectChoice(2);
            expect(quizPage.isSubmitEnabled()).toBe(true);
        });

        it('should show "correct" message for correct submissions', function () {
            quizPage.get(testQuizId);

            // Submit question 1
            quizPage.submit(1);
            expect(quizPage.correctAlert.isDisplayed()).toBe(true);
            expect(quizPage.incorrectAlert.isDisplayed()).toBe(false);

            // Submit question 2
            quizPage.nextLink.click();
            quizPage.submit(2);
            expect(quizPage.correctAlert.isDisplayed()).toBe(true);
            expect(quizPage.incorrectAlert.isDisplayed()).toBe(false);
        });

        it('should show "incorrect" message and state which choice is correct for wrong submissions', function () {
            quizPage.get(testQuizId);

            // Submit question 1 incorrectly
            quizPage.submit(3);
            expect(quizPage.correctAlert.isDisplayed()).toBe(false);
            expect(quizPage.incorrectAlert.isDisplayed()).toBe(true);
            expect(quizPage.correctAnswerMultipleChoice.getText()).toBe('Bismarck');

            // Submit question 2 incorrectly
            quizPage.nextLink.click();
            quizPage.submit(1);
            expect(quizPage.correctAlert.isDisplayed()).toBe(false);
            expect(quizPage.incorrectAlert.isDisplayed()).toBe(true);
            expect(quizPage.correctAnswerMultipleChoice.getText()).toBe('White');
        });

        it('should hide Submit button and show Next button after making a submission', function () {
            quizPage.get(testQuizId);

            // Submit question 1 correctly
            quizPage.submit(1);
            expect(quizPage.isSubmitVisible()).toBe(false);
            expect(quizPage.isNextVisible()).toBe(true);

            // Submit question 2 incorrectly
            quizPage.nextLink.click();
            quizPage.submit(1);
            expect(quizPage.isSubmitVisible()).toBe(false);
            expect(quizPage.isNextVisible()).toBe(true);
        });

        it('should assign appropriate classes to each choice button after correct submission', function () {
            quizPage.get(testQuizId);

            // Submit question 1 correctly
            quizPage.submit(1);

            // The selected choice should get the "selected" class, whereas others shouldn't
            expect(quizPage.choiceHasClass(1, 'selected')).toBe(true);
            expect(quizPage.choiceHasClass(0, 'selected')).toBe(false);
            expect(quizPage.choiceHasClass(2, 'selected')).toBe(false);
            expect(quizPage.choiceHasClass(3, 'selected')).toBe(false);

            // The correct choice should have the "correct" class, whereas others shouldn't
            expect(quizPage.choiceHasClass(1, 'correct')).toBe(true);
            expect(quizPage.choiceHasClass(0, 'correct')).toBe(false);
            expect(quizPage.choiceHasClass(2, 'correct')).toBe(false);
            expect(quizPage.choiceHasClass(3, 'correct')).toBe(false);

            // All the wrong choices should have the "incorrect" class, whereas the correct one shouldn't
            expect(quizPage.choiceHasClass(1, 'incorrect')).toBe(false);
            expect(quizPage.choiceHasClass(0, 'incorrect')).toBe(true);
            expect(quizPage.choiceHasClass(2, 'incorrect')).toBe(true);
            expect(quizPage.choiceHasClass(3, 'incorrect')).toBe(true);
        });

        it('should assign appropriate classes to each choice button after incorrect submission', function () {
            quizPage.get(testQuizId);

            // Submit question 1 incorrectly
            quizPage.submit(3);

            // The selected choice should get the "selected" class, whereas others shouldn't
            expect(quizPage.choiceHasClass(3, 'selected')).toBe(true);
            expect(quizPage.choiceHasClass(0, 'selected')).toBe(false);
            expect(quizPage.choiceHasClass(1, 'selected')).toBe(false);
            expect(quizPage.choiceHasClass(2, 'selected')).toBe(false);

            // The correct choice should have the "correct" class, whereas others shouldn't
            expect(quizPage.choiceHasClass(1, 'correct')).toBe(true);
            expect(quizPage.choiceHasClass(0, 'correct')).toBe(false);
            expect(quizPage.choiceHasClass(2, 'correct')).toBe(false);
            expect(quizPage.choiceHasClass(3, 'correct')).toBe(false);

            // All the wrong choices should have the "incorrect" class, whereas the correct one shouldn't
            expect(quizPage.choiceHasClass(1, 'incorrect')).toBe(false);
            expect(quizPage.choiceHasClass(0, 'incorrect')).toBe(true);
            expect(quizPage.choiceHasClass(2, 'incorrect')).toBe(true);
            expect(quizPage.choiceHasClass(3, 'incorrect')).toBe(true);
        });
    });

    describe('Quiz Sidebar', function () {
        it('should be able to navigate the quiz using the sidebar', function () {
            quizPage.get(testQuizId);

            expect(quizPage.currentQuestionHeader.getText()).toBe('Question 1 of 6');
            expect(quizPage.currentQuestion.getText()).toContain('What is the capital of North Dakota?');

            quizPage.jumpToQuestion(2);
            expect(quizPage.currentQuestionHeader.getText()).toBe('Question 2 of 6');
            expect(quizPage.currentQuestion.getText()).toContain('What color identifies the normal flap operating range?');

            quizPage.jumpToQuestion(5);
            expect(quizPage.currentQuestionHeader.getText()).toBe('Question 5 of 6');
            expect(quizPage.currentQuestion.getText()).toContain('Fill In: Ignore case test');
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
            quizPage.submit(1);
            quizPage.getSidebar().then(function (sidebar) {
                expect(_.pluck(sidebar, 'correct')).toEqual([true, false, false, false, false, false]);
                expect(_.every(_.pluck(sidebar, 'incorrect'), isFalse)).toBe(true);
            });

            // Submit question 3 and verify that it got marked incorrect
            quizPage.jumpToQuestion(3);
            quizPage.submit('7700');
            quizPage.getSidebar().then(function (sidebar) {
                expect(_.pluck(sidebar, 'correct')).toEqual(  [true, false, false, false, false, false]);
                expect(_.pluck(sidebar, 'incorrect')).toEqual([false, false, true, false, false, false]);
            });
        });

        it('should show score tooltip when hovering over progress bar', function () {
            quizPage.get(testQuizId);
            quizPage.getScoreTooltip().then(function (content) {
                expect(content).toContain('Current score: 0 / 6');

                // Submit question 1 correctly
                quizPage.submit(1);
                return quizPage.getScoreTooltip();
            })
            .then(function (content) {
                expect(content).toContain('Current score: 1 / 6');
                expect(content).toContain('Correct: 1');

                // Submit question 2 incorrectly
                quizPage.clickNextButton();
                quizPage.submit(3);
                return quizPage.getScoreTooltip();
            })
            .then(function (content) {
                expect(content).toContain('Current score: 1 / 6');
                expect(content).toContain('Incorrect: 1');
            });
        });
    });

    it('should be able to finish quiz after submitting all the questions', function () {
        quizPage.get(testQuizId);

        // Submit question 1
        quizPage.submit(1);
        quizPage.clickNextButton();

        // Submit question 2
        quizPage.submit(2);
        quizPage.clickNextButton();

        // Submit question 3 - incorrectly
        quizPage.submit('7700');
        quizPage.clickNextButton();

        // Submit question 4
        quizPage.submit('30');
        quizPage.clickNextButton();

        // Submit question 5
        quizPage.submit('Answer');
        quizPage.clickNextButton();

        // Submit question 6
        quizPage.submit('ANSWER');

        // Verify the Finish button is visible
        expect(quizPage.isNextVisible()).toBe(true);
        expect(quizPage.getNextButtonText()).toContain('Finish');
        
        // Finish the quiz and verify we're on the summary screen
        quizPage.clickNextButton();
        expect(quizPage.summaryContainer.isDisplayed()).toBe(true);

        // Verify the score is correct
        expect(quizPage.summaryScore.getText()).toBe('5 / 6');
        expect(quizPage.summaryScore.getText()).toBe('5 / 6');
        expect(quizPage.summaryScorePercent.getText()).toContain('83.3%');
    });
});
