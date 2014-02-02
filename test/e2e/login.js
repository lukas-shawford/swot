/**
 * login.js
 * --------
 *
 * Preparation script for end-to-end tests using Protractor. This script gets run once, after
 * Protractor has finished loading, but before any of the actual tests are run. The purpose of this
 * script is to log in as a test user so the rest of the tests are run as an authenticated user.
 *
 * Since the login page does not use Angular, we have to use WebDriver directly rather than using
 * Protractor (e.g., call browser.driver.get instead of browser.get). Additionally, we must inform
 * Protractor when we are all ready to go using browser.driver.wait, which takes in a function
 * that gets continuously invoked - when this function returns true, that signals Protractor that
 * we are ready, at which point the actual tests will get executed.
 *  
 */

// Use WebDriver directly, since the login page does not use Angular.
var driver = browser.driver;

// URL for the login page.
var loginUrl = protractor.getInstance().baseUrl + '/login';

// Test user credentials. The test user must be set up.
var username = 'test@example.com';
var password = 'tester';

// Regex for the landing page URL after a successful login. After entering the credentials, we'll
// tell WebDriver to keep testing the URL until it matches this pattern.
var successfulLoginUrlRegex = /quizzes$/;

// Log in
driver.get(loginUrl);
driver.findElement(by.name('email')).sendKeys(username);
driver.findElement(by.name('password')).sendKeys(password);
driver.findElement(by.xpath("//button[@type='submit']")).click();

// Wait until we are logged in.
driver.wait(function() {
    return driver.getCurrentUrl().then(function(url) {
        return /quizzes$/.test(url);
    });
});
