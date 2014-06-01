var Q = require('q');
var chai = require('chai');
var expect = chai.expect;
var mongoose = require('mongoose-q')();
var async = require('async');
var _ = require('underscore');
var User = require('../../lib/user');
var Quiz = require('../../lib/quiz').Quiz;
var QuizService = require('../../lib/quiz/quizService');
var Topic = require('../../lib/quiz').Topic;
var Question = require('../../lib/question').Question;
var FillInQuestion = require('../../lib/questions/fillIn').FillInQuestion;
var MultipleChoiceQuestion = require('../../lib/questions/multipleChoice').MultipleChoiceQuestion;

var MONGODB_URL = process.env.MONGODB_TEST_URL || 'localhost:27017/swot_test';
chai.Assertion.includeStack = true;

describe('quiz', function () {

    var testUserId;

    before(function (done) {
        this.timeout(5000);
        mongoose.connect(MONGODB_URL);

        // Delete all users and quizzes so we start off with a clean slate, and create a test user
        return Q(User.remove({}).exec())
            .then(function () {
                return Quiz.remove({}).exec();
            })
            .then(function () {
                return User.createUser({
                    email: 'test@example.com',
                    password: 'tester'
                });
            })
            .then(function (user) {
                testUserId = user._id;
            })
            .done(function () { done(); });
    });

    after(function () {
        mongoose.connection.close();
    });

    describe('submitQuestion', function () {

        var testQuiz;

        before(function (done) {
            // Create a test quiz and add some questions to it.
            Q(User.findById(testUserId).exec())
                .then(function (user) {
                    return QuizService.createQuiz({
                        name: 'My Test Quiz',
                        topic: user.topics[0]
                    }, user);
                })
                .then(function (result) {
                    var quiz = result[0];

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

                    return quiz.saveQ();
                })
                .then(function (quiz) {
                    // Save a reference to the test quiz
                    testQuiz = quiz;
                })
                .done(function () { done(); });
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
