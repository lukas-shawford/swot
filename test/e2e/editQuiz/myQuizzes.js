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
        return element.all(by.css('#quizzes .quiz')).map(function (quiz) {
            return {
                editUrl: quiz.findElement(by.css('.edit-quiz-btn')).getAttribute('href'),
                name: quiz.findElement(by.css('.quiz-name')).getText()
            };
        })
        .then(function (quizzes) {
            // Convert the resolved "Edit Quiz" URLs into quiz IDs
            return quizzes.map(function (quiz) {
                var editUrl = quiz.editUrl;
                var index = editUrl.lastIndexOf('/');
                var id = editUrl.substr(index + 1);

                return {
                    id: id,
                    name: quiz.name
                };
            });
        });
    };
};

module.exports = MyQuizzesPage;