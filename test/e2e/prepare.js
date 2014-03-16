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
 *       a user account for the test user, and a test quiz).
 *
 */

var Q = require('q');
var mongoose = require('mongoose');
var User = require('../../lib/user');
var Quiz = require('../../lib/quiz');
var Question = require('../../lib/question').Question;

// Extend mongoose with promises
require('../../lib/util/mongoosePromises');

var TEST_PORT = process.env.TEST_PORT || 3033;
var MONGODB_URL = process.env.MONGODB_TEST_URL || 'localhost:27017/swot_test';

console.log('\nRunning e2e test preparation script');
console.log('-----------------------------------\n');

// Database Setup
// --------------
console.log('Connecting to database', MONGODB_URL, '...');
Q.ninvoke(mongoose, 'connect', MONGODB_URL)
.then(function () {
    console.log('Wiping database...');
    return Q.ninvoke(mongoose.connection.db, 'dropDatabase');
})
.then(function () {
    console.log('Setting up test user...');
    return Q.ninvoke(User, 'createUser', {
        email: 'test@example.com',
        password: 'tester'
    });
})
.then(function (user) {
    console.log('Creating sample quiz...');
    return Q.ninvoke(Quiz, 'createQuiz', 'VFR Operations', user);
})
.then(function (quiz) {
    quiz.questions.push(new Question({
        questionHtml: 'What is the capital of North Dakota?',
        answer: 'Bismarck'
    }));
    quiz.questions.push(new Question({
        questionHtml: 'What color identifies the normal flap operating range?',
        answer: 'white'
    }));
    quiz.questions.push(new Question({
        questionHtml: 'What is the default squawk code of VFR aircraft in the United States?',
        answer: '1200'
    }));
    quiz.questions.push(new Question({
        questionHtml: 'An operable mode C transponder is required within how many nautical miles of the primary Class B airport?',
        answer: '30'
    }));
    quiz.questions.push(new Question({
        questionHtml: 'What is the minimum number of statute miles of visibility for Class B airspace operations when operating under VFR?',
        answer: '3'
    }));
    return quiz.qsave();
})
.then(function () {
    console.log('Finished');
})
.catch(function (err) {
    console.error('Error occurred during setup:', err);
});
