// Page Object for the quiz page (in the context of taking a quiz, rather than editing it)
var QuizPage = function () {
    var ptor = protractor.getInstance();
    var page = this;

    // Quiz header
    this.quizName = element(by.id('title'));

    // Question header
    this.currentQuestionHeader = element(by.css('.header .current'));
    this.nextLink = element(by.id('next'));
    this.prevLink = element(by.id('prev'));

    // Question container
    this.questionContainer = element(by.css('.view-question'));

    // Question body
    this.currentQuestion = element(by.id('question'));

    // Sidebar
    this.questions = element.all(by.repeater('question in questions'));
    this.sidebar = element(by.id('quiz-sidebar'));
    this.sidebarToggleButton = element(by.id('toggle-sidebar'));
    this.quizProgressBar = element(by.css('.progress-container'));
    this.quizScoreTooltip = element(by.css('.score-tooltip'));

    // Fill-In question elements
    this.submissionField = element(by.css('#question input.submission'));
    this.correctAnswerFillIn = element(by.css('.result .correct-answer.fill-in'));

    // Multiple Choice question elements
    this.choiceButtons = element.all(by.css('.multiple-choice .choice'));
    this.correctAnswerMultipleChoice = element(by.css('.result .correct-answer.multiple-choice'));

    // Submit & Next buttons
    // Use getSubmitButton()/getNextButton() methods. The way things are currently set up, we have
    // multiple submit/next buttons in the DOM (because the placement of the buttons varies depending
    // on question type). It would probably be better to restructure the viewquestion directive so
    // that there is only one submit and one next button, and they get transplanted elsewhere (into
    // a container element) as needed in the linking function. This would remove some of the code
    // duplication as well... but until I get around to fixing it, just use the getter methods instead.
    //this.submitButton = element(by.css('#question button.submit'));
    //this.nextButton = element(by.css('#question button.next'));

    // Correct/incorrect messages
    this.correctAlert = element(by.css('#question .result .correct'));
    this.incorrectAlert = element(by.css('#question .result .incorrect'));

    // Quiz Summary    
    this.summaryContainer = element(by.css('.summary-container'));
    this.summaryScore = element(by.css('.summary-container .score'));
    this.summaryScorePercent = element(by.css('.summary-container .score-percent'));

    /**
     * Loads the "Take Quiz" page for the given quiz ID
     */
    this.get = function (quizId) {
        return browser.get(ptor.baseUrl + 'quiz/' + quizId).then(function () {
            ptor.waitForAngular();
        });
    };

    /**
     * Navigates to the given question number using the sidebar. Note that question numbers start
     * at one, not zero.
     */
    this.jumpToQuestion = function (number) {
        return this.showSidebar().then(function () {
            return element(by.repeater('question in questions').row(number-1).column('question')).click();
        });
    };

    /**
     * Helper method for submitting an answer to the current question. The meaning of the submission
     * argument varies depending on question type:
     *      * fill-in: submission should be a string.
     *      * multiple-choice: submission should be the zero-based index of the selected choice.
     */
    this.submit = function (submission) {
        return page.getQuestionType().then(function (questionType) {
            if (questionType === 'fill-in') {
                return page.submissionField.sendKeys(submission);
            } else if (questionType === 'multiple-choice') {
                if (typeof submission !== 'number') {
                    throw new Error('For multiple choice questions, submission should be a number representing the zero-based index of the selected choice.');
                }
                return page.selectChoice(submission);
            }

            throw new Error('Invalid question type: ' + questionType);
        }).then(function () {
            return page.getSubmitButton();
        }).then(function (btn) {
            return btn.click();
        });
    };

    /**
     * Gets the current question type. Returns a promise that resolves to one of the following:
     * [ "fill-in", "multiple-choice" ]. Returns null if question type cannot be determined.
     */
    this.getQuestionType = function () {
        return page.questionContainer.getAttribute('class').then(function (cls) {
            if (/fill-in/.test(cls)) {
                return 'fill-in';
            } else if (/multiple-choice/.test(cls)) {
                return 'multiple-choice';
            }

            return null;
        });
    };

    /**
     * Gets the submit button for the current question. Different question types have the submit
     * button in different places, so there are actually multiple Submit buttons in the DOM, but
     * only one is visible. Use this method to retrieve the correct Submit button element for
     * the current question type. (Returns a promise.)
     */
    this.getSubmitButton = function () {
        return page.getQuestionType().then(function (questionType) {
            if (questionType === 'fill-in') {
                return element(by.css('.submission .fill-in .submit'));
            } else if (questionType === 'multiple-choice') {
                return element(by.css('.submission .multiple-choice .submit'));
            }

            return null;
        });
    };

    /**
     * Returns a promise that resolves to true if the submit button for the current question is
     * enabled.
     */
    this.isSubmitEnabled = function () {
        return page.getSubmitButton().then(function (btn) {
            return btn.getAttribute('disabled');
        }).then(function (attr) {
            return attr !== 'true' && attr !== 'disabled';
        });
    };

    /**
     * Returns a promise that resolves to true if the submit button for the current question is
     * visible.
     */
    this.isSubmitVisible = function () {
        return page.getSubmitButton().then(function (btn) {
            return btn.isDisplayed();
        });
    };

    /**
     * Gets the next button for the current question. Different question types have the next
     * button in different places, so there are actually multiple Next buttons in the DOM, but
     * only one is visible. Use this method to retrieve the correct Next button element for
     * the current question type. (Returns a promise.)
     */
    this.getNextButton = function () {
        return page.getQuestionType().then(function (questionType) {
            if (questionType === 'fill-in') {
                return element(by.css('.next.fill-in'));
            } else if (questionType === 'multiple-choice') {
                return element(by.css('.next.multiple-choice'));
            }

            return null;
        });
    };

    /**
     * Clicks the Next button. The next button is only visible after submitting a question.
     * Different question types have the next button in different places, so there are actually
     * multiple Next buttons in the DOM, but only one is visible. Use this method to retrieve the
     * correct Next button element for the current question type and click it.
     */
    this.clickNextButton = function () {
        return page.getNextButton().then(function (btn) {
            return btn.click();
        });
    };

    /**
     * Returns a promise that resolves to true if the Next button for the current question is
     * visible.
     */
    this.isNextVisible = function () {
        return page.getNextButton().then(function (btn) {
            return btn.isDisplayed();
        });
    };

    /**
     * Gets the text of the next button.
     */
    this.getNextButtonText = function () {
        return page.getNextButton().then(function (btn) {
            return btn.getText();
        });
    };

    /**
     * Gets the quiz navigation sidebar and parses it into a more meaningful format.
     */
    this.getSidebar = function () {
        return element.all(by.css('#quiz-sidebar .sidebar-question')).map(function (item) {
            return {
                question: item.findElement(by.css('.question')).getText(),
                correct: item.findElement(by.css('.status .correct')).isDisplayed(),
                incorrect: item.findElement(by.css('.status .incorrect')).isDisplayed()
            };
        });
    };

    /**
     * Show the quiz navigation sidebar. On desktop, this essentially does nothing; on mobile/tablet,
     * this first checks if the sidebar is showing, and if not, clicks the toggle button.
     */
    this.showSidebar = function () {
        return page.isSidebarVisible().then(function (visible) {
            if (!visible) {
                return page.sidebarToggleButton.click();
            }
        });
    };

    /**
     * Hides the sidebar if we're on mobile/tablet sized screens by clicking the toggle button. If
     * the sidebar is already hidden, or we're on a desktop-sized screen, then does nothing (returns
     * a resolved empty promise).
     */
    this.hideSidebar = function () {
        // Check if the toggle sidebar button is displayed. It should only be displayed if we're on
        // mobile or tablet sized screens.
        return page.sidebarToggleButton.isDisplayed().then(function (displayed) {
            if (displayed) {
                // We're on a small screen, so the sidebar can be shown/hidden. Check if the sidebar
                // is currently in view, and if so, click the toggle button to hide it.
                return page.isSidebarVisible().then(function (visible) {
                    if (visible) {
                        return page.sidebarToggleButton.click();
                    }
                });
            }
        });
    };

    this.isSidebarVisible = function () {
        // Check if the toggle sidebar button is displayed. It should only be displayed if we're on
        // mobile or tablet sized screens.
        return page.sidebarToggleButton.isDisplayed().then(function (displayed) {
            if (displayed) {
                // We're on a small screen, so the sidebar *can* be shown/hidden. Check if the sidebar
                // is currently in view by seeing if the offcanvas container has the "active" class.
                return element(by.css('.row-offcanvas')).getAttribute('class').then(function (cls) {
                    return !!cls.match(/active/);
                });
            }
            // Otherwise, we're on desktop, so the sidebar is always visible.
            return true;
        });
    };

    /**
     * Shows the sidebar and hovers over the quiz progress bar to trigger the tooltip containing the
     * user's current score. Returns a promise that resolves to the HTML content of the tooltip.
     * Hides the sidebar when finished.
     */
    this.getScoreTooltip = function () {
        return page.showSidebar().then(function () {
            ptor.actions()
                .mouseMove(page.quizProgressBar.find())
                .perform();
            return page.quizScoreTooltip.getText().then(function (text) {
                return page.hideSidebar().then(function () {
                    return text;
                });
            });
        });
    };

    /**
     * Gets the choices for a multiple choice question as an array of strings
     */
    this.getChoices = function () {
        return page.choiceButtons.map(function (choice) {
            return choice.getText();
        });
    };

    /**
     * Gets the button element representing the given choice number for a multiple choice question.
     * Assumes the current question is a multiple choice question.
     */
    this.getChoice = function (index) {
        return element(by.css('.multiple-choice .choices .choice:nth-of-type(' + (index + 1) + ')'));
    };

    /**
     * Selects the given choice index for a multiple choice question, but does not submit the
     * question. Assumes the current question is a multiple choice question.
     */
    this.selectChoice = function (index) {
        return page.getChoice(index).click();
    };

    /**
     * For multiple choice questions, tests whether the button representing the given choice index
     * has a particular class. Used for testing that the correct choice gets marked with the "correct"
     * class, etc. Returns a promise.
     */
    this.choiceHasClass = function (index, className) {
        return page.getChoice(index).getAttribute('class')
        .then(function (classAttr) {
            return classAttr.split(' ').indexOf(className) !== -1;
        });
    };
};

module.exports = QuizPage;
