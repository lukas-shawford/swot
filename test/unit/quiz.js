var Q = require('q');
var chai = require('chai');
var expect = chai.expect;
var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var User = require('../../lib/user');
var Quiz = require('../../lib/quiz').Quiz;
var Topic = require('../../lib/quiz').Topic;
var Question = require('../../lib/question').Question;
var FillInQuestion = require('../../lib/questions/fillIn').FillInQuestion;
var MultipleChoiceQuestion = require('../../lib/questions/multipleChoice').MultipleChoiceQuestion;

var MONGODB_URL = process.env.MONGODB_TEST_URL || 'localhost:27017/swot_test';
chai.Assertion.includeStack = true;

describe('quiz', function () {

    var testUserId;
    var testQuizId;

    before(function (done) {
        this.timeout(5000);
        mongoose.connect(MONGODB_URL);

        // Delete all users and quizzes so we start off with a clean slate, and create a test user
        User.remove({}, function (err) {
            if (err) throw err;
            Quiz.remove({}, function (err) {
                if (err) throw err;

                User.createUser({
                    email: 'test@example.com',
                    password: 'tester'
                }, function (err, user) {
                    if (err) throw err;
                    testUserId = user._id;
                    done();
                });
            });
        });
    });

    after(function () {
        mongoose.connection.close();
    });

    describe('createTopic', function () {

        it('should be able to create a topic and associate it with a user', function (done) {
            Q(User.findById(testUserId).exec())
                .then(function (user) {
                    return Topic.createTopic({
                        name: "Philosophy"
                    }, user);
                })
                .then(function (result) {
                    var topic = result[0];
                    expect(topic).to.exist;
                    expect(topic.name).to.equal('Philosophy');
                    expect(topic.createdBy.toString()).to.equal(testUserId.toString());
                })
                .done(function () { done(); });
        });

        it('should verify parent topic exists when creating a subtopic', function (done) {
            var testUser;
            Q(User.findById(testUserId).exec())
                .then(function (user) {
                    testUser = user;
                    return Topic.createTopic({
                        name: "Parent"
                    }, testUser);
                })
                .then(function (result) {
                    var parentTopic = result[0];
                    return Topic.findByIdAndRemove(parentTopic._id).exec();
                })
                .then(function (deletedTopic) {
                    return Topic.createTopic({
                        name: "Orphan",
                        parent: deletedTopic
                    }, testUser);
                })
                .then(function (result) {
                    throw new Error("Oops - subtopic was created even though parent topic does " +
                        "not exist anymore. This should *not* have been allowed to happen!");
                })
                .catch(function (err) {
                    expect(err.message).to.equal("Parent topic not found.");
                })
                .done(function () { done(); });
        });

        it('should verify parent topic belongs to same user when creating a subtopic', function (done) {
            Q(User.findById(testUserId).exec())
                .then(function (user) {
                    return Topic.createTopic({
                        name: "Test Topic"
                    }, user);
                })
                .then(function (result) {
                    var topic = result[0];
                    User.createUser({
                        email: 'mallory@example.com',
                        password: 'tester'
                    }, function (err, mallory) {
                        if (err) throw err;
                        return Topic.createTopic({
                            name: "Mallory's Topic",
                            parent: topic
                        }, mallory).then(function (result) {
                            throw new Error("Oops - subtopic was created even though parent topic is " +
                                "not owned by the user. This should *not* have been allowed to happen!");
                        }).catch(function (err) {
                            expect(err.message).to.equal("Failed to create subtopic: parent topic not owned by user.");
                        }).done(function () { done(); });
                    });
                })
                .done();
        });

        it('should ignore createdBy from the data param and instead use the user param', function (done) {
            Q(User.findById(testUserId).exec())
                .then(function (user) {
                    User.createUser({
                        email: 'someoneelse@example.com',
                        password: 'tester'
                    }, function (err, someoneElse) {
                        if (err) throw err;
                        return Topic.createTopic({
                            name: "Literature",
                            createdBy: someoneElse
                        }, user).then(function (result) {
                            var topic = result[0];
                            expect(topic.createdBy.toString()).to.equal(testUserId.toString());
                        }).done(function () { done(); });
                    });
                })
                .done();
        });

        it('should ignore dateCreated from the data param and instead use the current date', function (done) {
            Q(User.findById(testUserId).exec())
                .then(function (user) {
                    return Topic.createTopic({
                        name: "History",
                        dateCreated: new Date(2005, 5, 24)
                    }, user);
                })
                .then(function (result) {
                    var topic = result[0];
                    var today = new Date();
                    expect(topic.dateCreated.getFullYear()).to.equal(today.getFullYear());
                })
                .done(function () { done(); });
        });

    });

    describe('createQuiz', function () {

        it('should be able to create a quiz and associate it with a user.', function (done) {
            Q(User.findById(testUserId).exec())
                .then(function (user) {
                    return Quiz.createQuiz({
                        name: 'My Test Quiz'
                    }, user);
                })
                .then(function (result) {
                    var quiz = result[0];
                    var user = result[1];
                    expect(quiz).to.exist;
                    expect(user._id.toString()).to.equal(testUserId.toString());
                    testQuizId = quiz._id;

                    // Ensure quiz is associated with the user
                    expect(quiz.createdBy.toString()).to.equal(testUserId.toString());  // Check quiz.createdBy
                    User.findOne({ _id: testUserId }, function (err, user) {           // Check User.quizzes (need to reload document first because it's out of sync)
                        if (err) throw err;
                        expect(user.quizzes).to.contain(testQuizId);
                    });
                })
                .done(function () { done(); });

        });

        it('should save questions when creating a quiz', function (done) {
            Q(User.findById(testUserId).exec())
                .then(function (user) {
                    return Quiz.createQuiz({
                        name: 'Night Flying',
                        questions: [
                            new FillInQuestion({
                                questionHtml: "What is the name of the photoreceptors in the retina of the eye that allow for color as well as detail vision?",
                                answer: "cones",
                                alternativeAnswers: ["cone"]
                            }),
                            new FillInQuestion({
                                questionHtml: "During a constant rate turn, you tilt your head down " +
                                    "to change a fuel tank. The rapid head movement creates an overwhelming " +
                                    "sensation of rotating, turning, or accelerating in a " +
                                    "different direction. What is this illusion called?",
                                answer: "Coriolis Illusion",
                                ignoreCase: true,
                                alternativeAnswers: [
                                    'coriolis',
                                    'the coriolis illusion'
                                ]
                            })
                        ]
                    }, user);
                })
                .then(function (result) {
                    var quiz = result[0];
                    expect(quiz.questions).to.have.length(2);
                    expect(quiz.questions[0]).to.be.an.instanceof(FillInQuestion);
                    expect(quiz.questions[0].answer).to.equal('cones');
                    expect(quiz.questions[1]).to.be.an.instanceof(FillInQuestion);
                    expect(quiz.questions[1].answer).to.equal('Coriolis Illusion');
                })
                .done(function () { done(); });
        });

        it('should ignore createdBy from the data param and instead use the user param', function (done) {
            Q(User.findById(testUserId).exec())
                .then(function (user) {
                    User.createUser({
                        email: 'someoneelse2@example.com',
                        password: 'tester'
                    }, function (err, someoneElse) {
                        if (err) throw err;
                        return Quiz.createQuiz({
                            name: "Literature",
                            createdBy: someoneElse
                        }, user).then(function (result) {
                            var quiz = result[0];
                            expect(quiz.createdBy.toString()).to.equal(testUserId.toString());
                        }).done(function () { done(); });
                    });
                })
                .done();
        });

        it('should ignore dateCreated from the data param and instead use the current date', function (done) {
            Q(User.findById(testUserId).exec())
                .then(function (user) {
                    return Quiz.createQuiz({
                        name: "History",
                        dateCreated: new Date(2005, 5, 24)
                    }, user);
                })
                .then(function (result) {
                    var quiz = result[0];
                    var today = new Date();
                    expect(quiz.dateCreated.getFullYear()).to.equal(today.getFullYear());
                })
                .done(function () { done(); });
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
