// Page Object for the My Quizzes page
var MyQuizzesPage = function () {
    var ptor = protractor.getInstance();

    // Use WebDriver directly, since the Quizzes page does not (yet) use Angular.
    var driver = browser.driver;

    this.quizzesList = element(by.id('quizzes'));
    this.createButton = element(by.id('create'));

    this.get = function () {
        driver.get(ptor.baseUrl + 'quizzes');
    };

    this.getQuizzes = function () {
        return element.all(by.css('.quiz-name')).map(function (quiz) {
            return quiz.getText();
        });
    };
};

module.exports = MyQuizzesPage;