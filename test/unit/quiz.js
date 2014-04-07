var chai = require('chai');
var expect = chai.expect;
var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var User = require('../../lib/user');
var Quiz = require('../../lib/quiz');
var Question = require('../../lib/question').Question;
var FillInQuestion = require('../../lib/questions/fillIn').FillInQuestion;

var MONGODB_URL = process.env.MONGODB_TEST_URL || 'localhost:27017/swot_test';
chai.Assertion.includeStack = true;

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
        
        User.remove({}, function (err) {
            if (err) throw err;

            Quiz.remove({}, function (err) {
                if (err) throw err;

                // Create some test users to test any user-related functionality with quizzes.
                var users = _.map([
                    'angela@example.com',
                    'george@example.com',
                    'david@example.com',
                    'corey@example.com'
                ], function (email) { return { email: email, password: 'test' }; });
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
    });

    after(function () {
        mongoose.connection.close();
    });

    describe('quiz db (lib/quiz.js)', function () {

        var quizId;
        var quiz;

        before(function (done) {
            Quiz.createQuiz('My Test Quiz', corey, function (err, result) {
                expect(err).to.be.null;
                quizId = result._id;

                // Save the questions
                result.questions.push(new FillInQuestion({
                    questionHtml: "What is the capital of North Dakota?",
                    answer: "Bismarck"
                }));
                result.questions.push(new FillInQuestion({
                    questionHtml: "What is the default squawk code for VFR aircraft in the United States?",
                    answer: "1200"
                }));
                result.questions.push(new FillInQuestion({
                    questionHtml: "You are a senior executive at a Pharmacy Benefit Management (PBM) firm. After a recent acquisition of another PBM, your firm is now able to offer clients a wider range of sophisticated administrative and clinically-based services. Does this represent a strength or an opportunity according to SWOT analysis?",
                    answer: "strength"
                }));
                result.save(function (err) {
                    if (err) throw err;

                    // Reload the quiz from the database and save a reference to it.
                    Quiz.findOne({ _id: quizId }, function (err, result) {
                        if (err) throw err;
                        quiz = result;
                        done();
                    });
                });
            });
        });

        describe('createQuiz', function () {
            it('should be able to create a quiz and associate it with a user.', function (done) {
                // Note: the setup for this test is in the 'before' hook.

                expect(quiz).to.exist;

                // Ensure questions got saved
                expect(quiz.questions).to.have.length(3);
                expect(quiz.questions[0].questionHtml).to.equal("What is the capital of North Dakota?");
                expect(quiz.questions[0].answer).to.equal("Bismarck");
                expect(quiz.questions[1].questionHtml).to.equal("What is the default squawk code for VFR aircraft in the United States?");
                expect(quiz.questions[1].answer).to.equal("1200");
                expect(quiz.questions[2].questionHtml).to.equal("You are a senior executive at a Pharmacy Benefit Management (PBM) firm. After a recent acquisition of another PBM, your firm is now able to offer clients a wider range of sophisticated administrative and clinically-based services. Does this represent a strength or an opportunity according to SWOT analysis?");
                expect(quiz.questions[2].answer).to.equal("strength");

                // Ensure quiz is associated with the user
                expect(quiz.createdBy.toString()).to.equal(corey._id.toString());  // Check quiz.createdBy
                User.findOne({ _id: corey._id }, function (err, corey) {           // Check User.quizzes (need to reload document first because it's out of sync)
                    if (err) throw err;
                    expect(corey.quizzes).to.contain(quiz._id);
                    done();
                });
            });
        });

        describe('submitQuestion', function () {
            it('should return true if the submission matches the correct answer', function () {
                expect(quiz.submitQuestion(0, "Bismarck")).to.deep.equal({
                    success: true,
                    isCorrect: true
                });
                expect(quiz.submitQuestion(1, "1200")).to.deep.equal({
                    success: true,
                    isCorrect: true
                });
                expect(quiz.submitQuestion(2, "strength")).to.deep.equal({
                    success: true,
                    isCorrect: true
                });
            });

            it('should return false if the submission does not match', function () {
                var result = quiz.submitQuestion(0, "Pierre");
                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.false;
                expect(result.correctAnswer).to.equal("Bismarck");

                result = quiz.submitQuestion(1, "7700");
                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.false;
                expect(result.correctAnswer).to.equal("1200");

                result = quiz.submitQuestion(2, "opportunity");
                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.false;
                expect(result.correctAnswer).to.equal("strength");
            });

            it('should return an error if the question index is out of range or invalid', function () {
                expect(quiz.submitQuestion(-1, "Pierre")).to.deep.equal({
                    success: false,
                    message: "Invalid question index."
                });
                expect(quiz.submitQuestion(3, "Pierre")).to.deep.equal({
                    success: false,
                    message: "Invalid question index."
                });
                expect(quiz.submitQuestion("asparagus", "Pierre")).to.deep.equal({
                    success: false,
                    message: "Invalid question index."
                });
            });
        });
    });
});
