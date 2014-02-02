/**
 * prepare.js
 * ----------
 *
 * Preparation script for end-to-end tests using Protractor. This script gets run once, after
 * Protractor has finished loading, but before any of the actual tests are run.
 *
 * This script performs the following functions:
 *
 *     - Performs setup on the 'swot_test' database to put it in a known state (including setting up
 *       a user account for the test user).
 *
 *     - [NOT FINISHED] Sets up environment variables and launches the application using the testing configuration
 *       (separate port so it doesn't conflict with the actual app, and with the test database URL).
 *
 */

var mongoose = require('mongoose');
var User = require('../../lib/user');

var TEST_PORT = process.env.TEST_PORT || 3033;
var MONGODB_URL = process.env.MONGODB_TEST_URL || 'localhost:27017/swot_test';

console.log('\nRunning e2e test preparation script');
console.log('-----------------------------------\n');

// Database Setup
// --------------
console.log('Connecting to database', MONGODB_URL, '...');
mongoose.connect(MONGODB_URL, function () {

    console.log('Wiping database...');
    mongoose.connection.db.dropDatabase(function () {

        console.log('Setting up test user...');
        User.createUser({
            email: 'test@example.com',
            password: 'tester'
        }, function (err, user) {
            if (err) throw err;

            console.log('Finished.');
        });
    });
});