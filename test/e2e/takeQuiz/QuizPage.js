// Page Object for the quiz page (in the context of taking a quiz, rather than editing it)
var QuizPage = function () {
    var ptor = protractor.getInstance();
    var page = this;
    this.quizName = element(by.id('title'));
    this.questions = element.all(by.repeater('question in questions'));
    this.submissionField = element(by.id('submission'));
    this.submitButton = element(by.id('submit'));
    this.correctAlert = element(by.id('correct'));
    this.incorrectAlert = element(by.id('incorrect'));
    this.currentQuestion = element(by.id('question'));
    this.nextLink = element(by.id('next'));
    this.prevLink = element(by.id('prev'));
    this.nextButton = element(by.id('next-button'));
    this.currentQuestionHeader = element(by.css('.header .current'));
    this.sidebar = element(by.id('quiz-sidebar'));
    this.sidebarToggleButton = element(by.id('toggle-sidebar'));
    this.quizProgressBar = element(by.css('.progress-container'));
    this.quizScoreTooltip = element(by.css('.score-tooltip'));
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
     * Navigates to the given question number using the sidebar. Note that question numbers start
     * at one, not zero.
     */
    this.jumpToQuestion = function (number) {
        return this.showSidebar().then(function () {
            return element(by.repeater('question in questions').row(number-1).column('question')).click();
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
};

module.exports = QuizPage;
