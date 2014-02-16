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

    /**
     * Loads the "Take Quiz" page for the given quiz ID
     */
    this.get = function (quizId) {
        return browser.get(ptor.baseUrl + 'quiz/' + quizId).then(function () {
            
            // TODO: Fix the quiz sidebar to be more responsive. Currently, the browser needs
            // to be maximized in order for it to be visible. This is atrocious!
            browser.driver.manage().window().maximize();
            
            ptor.waitForAngular();
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
        element(by.repeater('question in questions').row(number-1).column('question')).click();
    };
};

module.exports = QuizPage;
