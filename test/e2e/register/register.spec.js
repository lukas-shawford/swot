var RegistrationPage = require('./register');

describe('Login page', function () {
    var registrationPage;
    var ptor;

    beforeEach(function () {
        registrationPage = new RegistrationPage();
        registrationPage.get();
        ptor = protractor.getInstance();
        ptor.ignoreSynchronization = true;
    });

    it('should redirect to quizzes after successful registration', function () {
        registrationPage.enterEmail('test2@example.com');
        registrationPage.enterPassword('tester', 'tester');
        registrationPage.clickRegister().then(function () {
            ptor.getCurrentUrl()
                .then(function (url) {
                    expect(url).toBe(ptor.baseUrl + 'quizzes');
                });
        });
    });

    it('should not allow registration with an existing email', function () {
        registrationPage.enterEmail('test2@example.com');
        registrationPage.enterPassword('tester', 'tester');
        registrationPage.clickRegister().then(function () {
            ptor.getCurrentUrl()
                .then(function (url) {
                    expect(url).toBe(ptor.baseUrl + 'register');
                    expect(registrationPage.alert.getText()).toMatch(/An account with that email address already exists/);
                });
        });
    });

    it('should show error message if passwords do not match', function () {
        registrationPage.enterEmail('test3@example.com');
        registrationPage.enterPassword('tester', 'tetser');
        registrationPage.clickRegister().then(function () {
            ptor.getCurrentUrl()
                .then(function (url) {
                    expect(url).toBe(ptor.baseUrl + 'register');
                    expect(registrationPage.alert.getText()).toMatch(/The passwords you entered do not match/);
                });
        });
    });
});
