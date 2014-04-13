var _ = require('underscore');
var util = require('util');
var QuizPage = require('./QuizPage');
var LoginPage = require('../login/login');
var QuizEditorPage = require('../editQuiz/quizEditor');
var MyQuizzesPage = require('../editQuiz/myQuizzes');
var testQuiz = require('../sampleQuizzes/VFROperations.json');

describe('Take Quiz', function () {
    var ptor;
    var quizPage;
    var loginPage;
    var quizEditorPage;
    var myQuizzesPage;
    var testQuizId;
    var numQuestions = testQuiz.length;

    /**
     * Helper method for submitting a question in the test quiz correctly
     */
    var submitCorrectly = function () {
        quizPage.getCurrentQuestionNumber().then(function (number) {
            var question = testQuiz[number - 1];
            switch (question.type) {
                case 'FillInQuestion':
                    return quizPage.submit(question.answer);
                case 'MultipleChoiceQuestion':
                    return quizPage.submit(question.correctAnswerIndex);
                default:
                    throw 'Invalid question type: ' + question.type;
            }
        });
    };

    /**
     * Helper method for submitting a question in the test quiz incorrectly. Note: This
     * makes a lot of simplifying assumptions to keep the code simpler (see comments within).
     * If these assumptions don't hold for a particular question, then don't use this helper.
     */
    var submitIncorrectly = function () {
        quizPage.getCurrentQuestionNumber().then(function (number) {
            var question = testQuiz[number - 1];
            switch (question.type) {
                case 'FillInQuestion':
                    // Assumes: The question does not have 'wrong' as one of its accepted answers
                    return quizPage.submit('wrong');
                case 'MultipleChoiceQuestion':
                    // Assumes: The question has at least two choices
                    var i = question.correctAnswerIndex + 1;
                    return quizPage.submit((i < question.choices.length) ? i : 0);
                default:
                    throw 'Invalid question type: ' + question.type;
            }
        });
    };

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
        expect(quizPage.questions.count()).toBe(numQuestions);
    });

    it('should be able to navigate the quiz using "next" and "previous" links', function () {
        quizPage.get(testQuizId);

        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 1 of ' + numQuestions);
        expect(quizPage.currentQuestion.getText()).toContain(testQuiz[0].questionHtml);

        // Clicking "Previous" should not do anything since we're already on the first question
        quizPage.prevLink.click();
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 1 of ' + numQuestions);
        expect(quizPage.currentQuestion.getText()).toContain(testQuiz[0].questionHtml);

        // Click next
        quizPage.nextLink.click();
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 2 of ' + numQuestions);
        expect(quizPage.currentQuestion.getText()).toContain(testQuiz[1].questionHtml);

        // Click previous
        quizPage.prevLink.click();
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 1 of ' + numQuestions);
        expect(quizPage.currentQuestion.getText()).toContain(testQuiz[0].questionHtml);

        // Click next all the way to the end
        for (var i = 0; i < numQuestions - 1; i++) {
            quizPage.nextLink.click();
        }
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question ' + numQuestions + ' of ' + numQuestions);
        expect(quizPage.currentQuestion.getText()).toContain(testQuiz[numQuestions-1].questionHtml);

        // Clicking "Next" should not do anything since we're already on the last question
        quizPage.nextLink.click();
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question ' + numQuestions + ' of ' + numQuestions);
        expect(quizPage.currentQuestion.getText()).toContain(testQuiz[numQuestions-1].questionHtml);
    });

    it('should be able to go to next question by clicking "Next" after submitting', function () {
        quizPage.get(testQuizId);
        submitCorrectly();
        expect(quizPage.nextButton.isDisplayed()).toBe(true);
        quizPage.nextButton.click();
        expect(quizPage.currentQuestionHeader.getText()).toBe('Question 2 of ' + numQuestions);
        expect(quizPage.currentQuestion.getText()).toContain(testQuiz[1].questionHtml);
    });

    it('should not show "Finish" button after submitting the last question without having finished the entire quiz', function () {
        quizPage.get(testQuizId);

        // Jump to the last question and submit it
        quizPage.jumpToQuestion(numQuestions);
        submitCorrectly();

        // The "Next" button is labeled "Finish" if this is the last question. However, it should not
        // be displayed at this point because there are questions that haven't been answered yet.
        expect(quizPage.nextButton.isDisplayed()).toBe(false);
    });

    describe('Fill In Questions', function () {
        it('should show "correct" message for correct submissions', function () {
            quizPage.get(testQuizId);

            // Submit question 3
            quizPage.jumpToQuestion(3);
            submitCorrectly();
            expect(quizPage.isCorrect()).toBe(true);
            expect(quizPage.isIncorrect()).toBe(false);

            // Submit question 4
            quizPage.nextButton.click();
            submitCorrectly();
            expect(quizPage.isCorrect()).toBe(true);
            expect(quizPage.isIncorrect()).toBe(false);
        });

        it('should show "incorrect" message and state the correct answer for wrong submissions', function () {
            quizPage.get(testQuizId);

            // Submit question 3
            quizPage.jumpToQuestion(3);
            submitIncorrectly();
            expect(quizPage.isCorrect()).toBe(false);
            expect(quizPage.isIncorrect()).toBe(true);
            expect(quizPage.correctAnswerFillIn.getText()).toBe('1200');

            // Submit question 4
            quizPage.nextButton.click();
            submitIncorrectly();
            expect(quizPage.isCorrect()).toBe(false);
            expect(quizPage.isIncorrect()).toBe(true);
            expect(quizPage.correctAnswerFillIn.getText()).toBe('30');
        });

        it('should ignore case when the "Ignore capitalization" setting is turned on', function () {
            // Submit question 5
            quizPage.nextButton.click();
            quizPage.submit('aNsWeR');  // Correct answer is "Answer", but submit with different casing
            expect(quizPage.isCorrect()).toBe(true);
            expect(quizPage.isIncorrect()).toBe(false);
        });

        it('should do case-sensitive comparison when the "Ignore capitalization" setting is turned off', function () {
            // Submit question 6
            quizPage.nextButton.click();
            quizPage.submit('aNsWeR');  // Correct answer is "ANSWER", but submit with different casing
            expect(quizPage.isCorrect()).toBe(false);
            expect(quizPage.isIncorrect()).toBe(true);
        });

        it('should accept a submission if it matches one of the alternative answers', function () {
            // Submit question 7
            quizPage.nextButton.click();
            quizPage.submit('18000');
            expect(quizPage.isCorrect()).toBe(true);
            expect(quizPage.isIncorrect()).toBe(false);
        });

        it('should show alternative answers in a tooltip for wrong submissions', function () {
            quizPage.get(testQuizId);
            quizPage.jumpToQuestion(7);
            quizPage.submit('24,000 feet');
            expect(quizPage.isIncorrect()).toBe(true);
            expect(quizPage.altAnswerIcon.isDisplayed()).toBe(true);
            quizPage.getAltAnsTooltip().then(function (text) {
                expect(text).toContain("18000 feet");
                expect(text).toContain("18,000 ft");
                expect(text).toContain("18,000ft");
                expect(text).toContain("18000");
                expect(text).toContain("18,000");
            });
        });

        it('should not show alternative answers icon for correct submissions', function () {
            quizPage.get(testQuizId);
            quizPage.jumpToQuestion(7);
            quizPage.submit('18,000 feet');
            expect(quizPage.isCorrect()).toBe(true);
            expect(quizPage.altAnswerIcon.isDisplayed()).toBe(false);
        });

        it('should not show alternative answers icon if there are no alternative answers', function () {
            quizPage.get(testQuizId);
            quizPage.jumpToQuestion(6);
            quizPage.submit('wrong');
            expect(quizPage.isIncorrect()).toBe(true);
            expect(quizPage.altAnswerIcon.isDisplayed()).toBe(false);
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
            expect(quizPage.isCorrect()).toBe(true);
            expect(quizPage.isIncorrect()).toBe(false);

            // Submit question 2
            quizPage.nextLink.click();
            quizPage.submit(2);
            expect(quizPage.isCorrect()).toBe(true);
            expect(quizPage.isIncorrect()).toBe(false);
        });

        it('should show "incorrect" message and state which choice is correct for wrong submissions', function () {
            quizPage.get(testQuizId);

            // Submit question 1 incorrectly
            quizPage.submit(3);
            expect(quizPage.isCorrect()).toBe(false);
            expect(quizPage.isIncorrect()).toBe(true);
            expect(quizPage.correctAnswerMultipleChoice.getText()).toBe('Bismarck');

            // Submit question 2 incorrectly
            quizPage.nextLink.click();
            quizPage.submit(1);
            expect(quizPage.isCorrect()).toBe(false);
            expect(quizPage.isIncorrect()).toBe(true);
            expect(quizPage.correctAnswerMultipleChoice.getText()).toBe('White');
        });

        it('should hide Submit button and show Next button after making a submission', function () {
            quizPage.get(testQuizId);

            // Submit question 1 correctly
            submitCorrectly();
            expect(quizPage.isSubmitVisible()).toBe(false);
            expect(quizPage.nextButton.isDisplayed()).toBe(true);

            // Submit question 2 incorrectly
            quizPage.nextLink.click();
            submitIncorrectly();
            expect(quizPage.isSubmitVisible()).toBe(false);
            expect(quizPage.nextButton.isDisplayed()).toBe(true);
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

    describe('Supplemental Information', function () {
        it('should show supplemental information for correct submissions', function () {
            quizPage.get(testQuizId);
            quizPage.jumpToQuestion(8);
            submitCorrectly();
            expect(quizPage.supplementalInfo.getText()).toContain(testQuiz[7].supplementalInfoHtml);
        });

        it('should show supplemental information for incorrect submissions', function () {
            quizPage.get(testQuizId);
            quizPage.jumpToQuestion(8);
            submitIncorrectly();
            expect(quizPage.supplementalInfo.getText()).toContain(testQuiz[7].supplementalInfoHtml);
        });
    });

    describe('Quiz Sidebar', function () {
        it('should be able to navigate the quiz using the sidebar', function () {
            quizPage.get(testQuizId);

            expect(quizPage.currentQuestionHeader.getText()).toBe('Question 1 of ' + numQuestions);
            expect(quizPage.currentQuestion.getText()).toContain(testQuiz[0].questionHtml);

            quizPage.jumpToQuestion(2);
            expect(quizPage.currentQuestionHeader.getText()).toBe('Question 2 of ' + numQuestions);
            expect(quizPage.currentQuestion.getText()).toContain(testQuiz[1].questionHtml);

            quizPage.jumpToQuestion(5);
            expect(quizPage.currentQuestionHeader.getText()).toBe('Question 5 of ' + numQuestions);
            expect(quizPage.currentQuestion.getText()).toContain(testQuiz[4].questionHtml);
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
            submitCorrectly();
            quizPage.getSidebar().then(function (sidebar) {
                expect(sidebar[0].correct).toBe(true);
                expect(sidebar[0].incorrect).toBe(false);
            });

            // Submit question 3 and verify that it got marked incorrect
            quizPage.jumpToQuestion(3);
            submitIncorrectly();
            quizPage.getSidebar().then(function (sidebar) {
                expect(sidebar[2].incorrect).toBe(true);
                expect(sidebar[2].correct).toBe(false);
            });
        });

        it('should show score tooltip when hovering over progress bar', function () {
            quizPage.get(testQuizId);
            quizPage.getScoreTooltip().then(function (content) {
                expect(content).toContain('Current score: 0 / ' + numQuestions);

                // Submit question 1 correctly
                submitCorrectly();
                return quizPage.getScoreTooltip();
            })
            .then(function (content) {
                expect(content).toContain('Current score: 1 / ' + numQuestions);
                expect(content).toContain('Correct: 1');

                // Submit question 2 incorrectly
                quizPage.nextButton.click();
                submitIncorrectly();
                return quizPage.getScoreTooltip();
            })
            .then(function (content) {
                expect(content).toContain('Current score: 1 / ' + numQuestions);
                expect(content).toContain('Incorrect: 1');
            });
        });
    });

    it('should be able to finish quiz after submitting all the questions', function () {
        quizPage.get(testQuizId);

        // Submit all questions correctly except #3
        for (var i = 0; i < numQuestions; ++i) {
            if (i === 2) {
                submitIncorrectly()
            } else {
                submitCorrectly();
            }

            // Don't click Next if this is the last question - perform some additional validations first.
            if (i !== numQuestions - 1)
                quizPage.nextButton.click();
        }

        // Verify the Finish button is visible
        expect(quizPage.nextButton.isDisplayed()).toBe(true);
        expect(quizPage.nextButton.getText()).toContain('Finish');
        
        // Finish the quiz and verify we're on the summary screen
        quizPage.nextButton.click();
        expect(quizPage.summaryContainer.isDisplayed()).toBe(true);

        // Verify the score is correct
        expect(quizPage.summaryScore.getText()).toBe((numQuestions - 1) + ' / ' + (numQuestions));
        var score = 100 * (numQuestions - 1) / (numQuestions);
        score = +score.toFixed(1);
        expect(quizPage.summaryScorePercent.getText()).toContain(score);
    });
});
