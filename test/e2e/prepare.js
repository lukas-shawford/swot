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

var _ = require('underscore');
var Q = require('q');
var mongoose = require('mongoose');
var User = require('../../lib/user');
var Quiz = require('../../lib/quiz').Quiz;
var QuizService = require('../../lib/quiz/quizService');
var Question = require('../../lib/question').Question;
var FillInQuestion = require('../../lib/questions/fillIn').FillInQuestion;
var MultipleChoiceQuestion = require('../../lib/questions/multipleChoice').MultipleChoiceQuestion;

// Load the sample quiz
var sampleQuiz = require('./sampleQuizzes/VFROperations.json');

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
    return User.createUser({
        email: 'test@example.com',
        password: 'tester'
    });
})
.then(function (user) {
    console.log('Creating sample quiz...');
    return QuizService.createQuiz({ name: 'VFR Operations', topic: user.topics[0] }, user);
})
.then(function (quiz) {
    _.each(sampleQuiz, function (question) {
        switch (question.type) {
            case 'FillInQuestion':
                quiz.questions.push(new FillInQuestion(question));
                break;
            case 'MultipleChoiceQuestion':
                quiz.questions.push(new MultipleChoiceQuestion(question));
                break;
            default:
                throw 'Invalid question type in sample quiz: ' + question.type;
        }
    });
    return quiz.qsave();
})
.then(function () {
    console.log('Finished');
})
.catch(function (err) {
    console.error('Error occurred during setup:', err);
});
