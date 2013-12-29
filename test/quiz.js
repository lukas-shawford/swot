var expect = require('chai').expect;
var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var User = require('../lib/user');
var Quiz = require('../lib/quiz');

var MONGODB_URL = process.env.MONGODB_TEST_URL || 'localhost:27017/swot_test';

describe('quiz', function () {

    // Test users (angela, george, david, corey)
    var testUsers;
    var angela;
    var george;
    var david;
    var corey;

    // Test quizzes. After the 'before' function finishes, there should be 9 quizzes in here with
    // the names 'test quiz 1', 'test quiz 2', ..., 'test quiz 9'. The properties are as follows:
    //     - createdBy: Quizzes 1-3 were written by angela, quizzes 4-6 were written by george, and 7-9 were written by david.
    //     - questions: [] (an empty array)
    //     - date: Quiz 1 was written on 12/1/2013, quiz 2 was written on 12/2/2013, and so on...
    var testQuizzes;
    var quiz1, quiz2, quiz3, quiz4, quiz5, quiz6, quiz7, quiz8, quiz9;

    before(function (done) {
        this.timeout(5000);
        mongoose.connect(MONGODB_URL);
        Quiz.remove({}, function (err) {
            if (err) throw err;

            // Create some test users to test any user-related functionality with quizzes.
            var users = _.map(['angela', 'george', 'david', 'corey'], function (username) { return { username: username, password: 'test' }; });
            async.map(users, User.createUser.bind(User), function (err, results) {
                if (err) throw err;
                testUsers  = results;
                angela = testUsers[0];
                george = testUsers[1];
                david  = testUsers[2];
                corey  = testUsers[3];

                // Create test quizzes
                var quizzes = _.map(_.range(1, 10), function (i) {
                    return {
                        name: 'test quiz ' + i,
                        questions: [],
                        createdBy: (i <= 3 ? angela._id : (i <= 6 ? george._id : david._id)),
                        dateCreated: Date.UTC(2013, 12, i)
                    };
                });
                Quiz.create(quizzes, function (err) {
                    if (err) throw err;

                    // Set testQuizzes and quiz1, ..., quiz9 variables to the created quizzes.
                    testQuizzes = _.toArray(arguments).slice(1);
                    quiz1 = testQuizzes[0];
                    quiz2 = testQuizzes[1];
                    quiz3 = testQuizzes[2];
                    quiz4 = testQuizzes[3];
                    quiz5 = testQuizzes[4];
                    quiz6 = testQuizzes[5];
                    quiz7 = testQuizzes[6];
                    quiz8 = testQuizzes[7];
                    quiz9 = testQuizzes[8];

                    // This is the last thing we need to do for setup, so call done()
                    done();
                });
            });
        });
    });

    after(function () {
        mongoose.connection.close();
    });

    describe('quiz db (lib/quiz.js)', function () {

        describe('createQuiz', function () {
            it('should be able to create a quiz and associate it with a user.', function (done) {
                var questions = [
                    {
                        questionText: "What is the capital of North Dakota?",
                        answer: "Bismarck"
                    },
                    {
                        questionText: "What is the default squawk code for VFR aircraft in the United States?",
                        answer: "1200"
                    },
                    {
                        questionText: "You are a senior executive at a Pharmacy Benefit Management (PBM) firm. After a recent acquisition of another PBM, your firm is now able to offer clients a wider range of sophisticated administrative and clinically-based services. Does this represent a strength or an opportunity according to SWOT analysis?",
                        answer: "strength"
                    }
                ];

                Quiz.createQuiz('My Test Quiz', questions, corey, function (err, quiz) {
                    expect(err).to.be.null;
                    expect(quiz).to.exist;

                    // Ensure questions got saved
                    expect(quiz.questions).to.have.length(3);
                    expect(quiz.questions[0].questionText).to.equal("What is the capital of North Dakota?");
                    expect(quiz.questions[0].answer).to.equal("Bismarck");
                    expect(quiz.questions[1].questionText).to.equal("What is the default squawk code for VFR aircraft in the United States?");
                    expect(quiz.questions[1].answer).to.equal("1200");
                    expect(quiz.questions[2].questionText).to.equal("You are a senior executive at a Pharmacy Benefit Management (PBM) firm. After a recent acquisition of another PBM, your firm is now able to offer clients a wider range of sophisticated administrative and clinically-based services. Does this represent a strength or an opportunity according to SWOT analysis?");
                    expect(quiz.questions[2].answer).to.equal("strength");

                    // Ensure quiz is associated with the user
                    expect(quiz.createdBy).to.equal(corey._id);                     // Check quiz.createdBy
                    User.findOne({ _id: corey._id }, function (err, corey) {        // Check User.quizzes (need to reload document first because it's out of sync)
                        if (err) throw err;
                        expect(corey.quizzes).to.contain(quiz._id);
                        done();
                    });
                });
            });
        });
    });
});
