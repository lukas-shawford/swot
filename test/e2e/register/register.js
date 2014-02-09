// Page Object for the registration page
var RegistrationPage = function () {
    var ptor = protractor.getInstance();
    var driver = browser.driver;    // Use WebDriver directly, since the registration page does not use Angular.

    this.emailInput = element(by.id('email'));
    this.passwordInput = element(by.id('password'));
    this.confirmPasswordInput = element(by.id('password_confirm'));
    this.registerButton = element(by.id("register"));
    this.alert = element(by.css('form>.alert'));

    this.get = function () {
        driver.get(ptor.baseUrl + 'register');
    };

    this.enterEmail = function (username) {
        this.emailInput.sendKeys(username);
    };

    this.enterPassword = function (password, confirm) {
        this.passwordInput.sendKeys(password);
        this.confirmPasswordInput.sendKeys(confirm);
    };

    this.clickRegister = function () {
        return this.registerButton.click();
    };
};

module.exports = RegistrationPage;