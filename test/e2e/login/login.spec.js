var LoginPage = require('./login');

describe('Login page', function () {
    var loginPage;
    var ptor;

    beforeEach(function () {
        loginPage = new LoginPage();
        loginPage.get();
        ptor = protractor.getInstance();
        ptor.ignoreSynchronization = true;
    });

    it('should redirect to quizzes after successful login', function () {
        loginPage.enterEmail('test@example.com');
        loginPage.enterPassword('tester');
        loginPage.clickLogin().then(function () {
            ptor.getCurrentUrl()
                .then(function (url) {
                    expect(url).toBe(ptor.baseUrl + 'quizzes');
                });
        });
    });

    it('should show error message for an invalid login', function () {
        loginPage.enterEmail('test@example.com');
        loginPage.enterPassword('wrongpassword');
        loginPage.clickLogin().then(function () {
            ptor.getCurrentUrl()
                .then(function (url) {
                    expect(url).toBe(ptor.baseUrl + 'login');
                    expect(loginPage.alert.getText()).toMatch(/Invalid email or password/);
                });
        });
    });
});
