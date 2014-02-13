// Page Object for the login page
var LoginPage = function () {
    var ptor = protractor.getInstance();
    var driver = browser.driver;    // Use WebDriver directly, since the login page does not use Angular.

    this.emailInput = element(by.name('email'));
    this.passwordInput = element(by.name('password'));
    this.loginButton = element(by.xpath("//button[@type='submit']"));
    this.alert = element(by.css('form>.alert'));

    this.get = function () {
        driver.get(ptor.baseUrl + 'login');
    };

    this.enterEmail = function (username) {
        this.emailInput.sendKeys(username);
    };

    this.enterPassword = function (password) {
        this.passwordInput.sendKeys(password);
    };

    this.clickLogin = function () {
        return this.loginButton.click();
    };

    this.loginAsTestUser = function () {
        this.get();
        this.enterEmail('test@example.com');
        this.enterPassword('tester');
        return this.clickLogin();
    };
};

module.exports = LoginPage;