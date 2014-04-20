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

    before(function (done) {
        this.timeout(5000);
        mongoose.connect(MONGODB_URL);

        // Delete all users and quizzes so we start off with a clean slate
        User.remove({}, function (err) {
            if (err) throw err;
            Quiz.remove({}, function (err) {
                if (err) throw err;
                done();
            });
        });
    });

    after(function () {
        mongoose.connection.close();
    });

    describe('quiz db (lib/quiz.js)', function () {
        var testUserId;
        var testQuizId;

        describe('createQuiz', function () {
            it('should be able to create a quiz and associate it with a user.', function (done) {
                User.createUser({
                    email: 'test@example.com',
                    password: 'tester'
                }, function (err, user) {
                    if (err) throw err;
                    testUserId = user._id;

                    Quiz.createQuiz({
                        name: 'My Test Quiz'
                    }, user, function (err, quiz) {
                        expect(err).to.be.null;
                        expect(quiz).to.exist;
                        testQuizId = quiz._id;

                        // Ensure quiz is associated with the user
                        expect(quiz.createdBy.toString()).to.equal(testUserId.toString());  // Check quiz.createdBy
                        User.findOne({ _id: testUserId }, function (err, user) {           // Check User.quizzes (need to reload document first because it's out of sync)
                            if (err) throw err;
                            expect(user.quizzes).to.contain(testQuizId);
                            done();
                        });
                    });
                });
            });
        });

        describe('submitQuestion', function () {

            var testQuiz;

            before(function (done) {
                // Add some questions to the test quiz
                Quiz.findOne({ _id: testQuizId }, function (err, quiz) {
                    if (err) throw err;

                    quiz.questions.push(new FillInQuestion({
                        questionHtml: "What is the capital of North Dakota?",
                        answer: "Bismarck"
                    }));
                    quiz.questions.push(new FillInQuestion({
                        questionHtml: "What is the default squawk code for VFR aircraft in the United States?",
                        answer: "1200"
                    }));
                    quiz.questions.push(new FillInQuestion({
                        questionHtml: "You are a senior executive at a Pharmacy Benefit Management (PBM) firm. After a recent acquisition of another PBM, your firm is now able to offer clients a wider range of sophisticated administrative and clinically-based services. Does this represent a strength or an opportunity according to SWOT analysis?",
                        answer: "strength"
                    }));
                    quiz.save(function (err) {
                        if (err) throw err;

                        // Save a reference to the test quiz
                        Quiz.findOne({ _id: testQuizId }, function (err, quiz) {
                            if (err) throw err;
                            testQuiz = quiz;
                            done();
                        });
                    });
                });
            });

            it('should return true if the submission matches the correct answer', function () {
                var result = testQuiz.submitQuestion(0, "Bismarck");
                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.true;

                result = testQuiz.submitQuestion(1, "1200");
                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.true;

                result = testQuiz.submitQuestion(2, "strength");
                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.true;
            });

            it('should return false if the submission does not match', function () {
                var result = testQuiz.submitQuestion(0, "Pierre");
                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.false;
                expect(result.correctAnswer).to.equal("Bismarck");

                result = testQuiz.submitQuestion(1, "7700");
                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.false;
                expect(result.correctAnswer).to.equal("1200");

                result = testQuiz.submitQuestion(2, "opportunity");
                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.false;
                expect(result.correctAnswer).to.equal("strength");
            });

            it('should return an error if the question index is out of range or invalid', function () {
                expect(testQuiz.submitQuestion(-1, "Pierre")).to.deep.equal({
                    success: false,
                    message: "Invalid question index."
                });
                expect(testQuiz.submitQuestion(3, "Pierre")).to.deep.equal({
                    success: false,
                    message: "Invalid question index."
                });
                expect(testQuiz.submitQuestion("asparagus", "Pierre")).to.deep.equal({
                    success: false,
                    message: "Invalid question index."
                });
            });
        });
    });
});
