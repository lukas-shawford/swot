var Q = require('q');
var expect = require('chai').expect;
var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var User = require('../../lib/user');
var Quiz = require('../../lib/quiz').Quiz;
var QuizService = require('../../lib/quiz/quizService');
var Topic = require('../../lib/quiz').Topic;

var MONGODB_URL = process.env.MONGODB_TEST_URL || 'localhost:27017/swot_test';

describe('userDb', function () {

    before(function (done) {
        mongoose.connect(MONGODB_URL);
        User.remove({}, done);
    });

    after(function () {
        mongoose.connection.close();
    });

    describe('createUser', function () {

        it('should be able to find user after creating one.', function (done) {
            return User.createUser({
                    email: 'tobi@example.com',
                    password: 'i am secret'
                })
                .then(function (user) {
                    User.findByEmail('tobi@example.com', function (err, user) {
                        expect(err).to.be.null;
                        expect(user).to.exist;
                        done();
                    });
                })
                .done();
        });

        it('should not be able to create multiple users with same email.', function (done) {
            User.createUser({
                    email: 'tobi@example.com',
                    password: 'i am secret'
                })
                .then(function (user) {
                    throw new Error("Oops - user was created, even though another user with that " +
                        "same email already exists. This should *not* have been allowed to happen!");
                })
                .catch(function (err) {
                    expect(err).to.not.be.null;
                    expect(err.message).to.equal('An account with that email already exists.');
                })
                .done(function () { done(); });
        });

        it('should create a topic called "General" when creating a new user', function (done) {
            return User.createUser({
                    email: 'wuggles@example.com',
                    password: 'wugglewuggle'
                })
                .then(function (user) {
                    expect(user.topics).to.have.length(1);
                    var topic = user.topics[0];
                    return Topic.findById(topic).exec();
                })
                .then(function (topic) {
                    expect(topic).to.exist;
                    expect(topic.name).to.equal("General");
                })
                .done(function () { done(); });
        });

    });

    describe('findByEmail', function () {

        before(function (done) {
            return User.createUser({
                email: 'bob@example.com',
                password: 'something'
            }).done(function () { done(); });
        });

        it('should be able to find user with matching email', function (done) {
            User.findByEmail('bob@example.com', function (err, user) {
                expect(err).to.be.null;
                expect(user).to.exist;
                expect(user.email).to.equal('bob@example.com');
                done();
            });
        });

        it("should not return anyone for an email that doesn't correspond to an actual user", function (done) {
            User.findByEmail('fred@example.com', function (err, user) {
                expect(err).to.be.null;
                expect(user).to.not.exist;
                done();
            });
        });
    });

    describe('checkPassword', function () {

        var albert;

        before(function (done) {
            return User.createUser({
                email: 'albert@example.com',
                password: 'letmein'
            }).done(function (user) {
                albert = user;
                done();
            });
        });

        it("should return true if passwords match", function (done) {
            albert.checkPassword('letmein', function (err, match) {
                expect(err).to.be.null;
                expect(match).to.be.true;
                done();
            });
        });

        it("should return false if passwords do not match", function (done) {
            albert.checkPassword('iforgot', function (err, match) {
                expect(err).to.be.null;
                expect(match).to.be.false;
                done();
            });
        });
    });

    describe('ownsQuiz', function () {

        var stephanie;
        var stephanieQuiz;

        var barbara;
        var barbaraQuiz;

        before(function (done) {

            // Create test users
            var users = _.map(['stephanie@example.com', 'barbara@example.com'],
                function (email) { return { email: email, password: 'test' };
            });

            return Q.all([
                User.createUser({ email: 'stephanie@example.com', password: 'test' }),
                User.createUser({ email: 'barbara@example.com', password: 'test' })
            ]).spread(function (_stephanie, _barbara) {
                // Create 2 test quizzes, one owned by stephanie, and the other by barbara
                return Q.all([
                    QuizService.createQuiz({ name: 'Test Quiz', topic: _stephanie.topics[0] }, _stephanie),
                    QuizService.createQuiz({ name: 'Test Quiz', topic: _barbara.topics[0] }, _barbara)
                ]);
            }).spread(function (_stephanieResult, _barbaraResult) {
                stephanieQuiz = _stephanieResult[0];
                stephanie = _stephanieResult[1];

                barbaraQuiz = _barbaraResult[0];
                barbara = _barbaraResult[1];
            }).done(function () { done(); });
        });

        it('should return true if user owns quiz', function () {
            expect(stephanie.ownsQuiz(stephanieQuiz._id)).to.be.true;
            expect(barbara.ownsQuiz(barbaraQuiz._id)).to.be.true;
        });

        it('should return false if user does not own quiz', function () {
            expect(stephanie.ownsQuiz(barbaraQuiz._id)).to.be.false;
            expect(barbara.ownsQuiz(stephanieQuiz._id)).to.be.false;
        });

        it('should be able to accept quiz objects, quiz ObjectIDs, and quiz IDs as strings', function () {
            expect(stephanie.ownsQuiz(stephanieQuiz)).to.be.true;                       // Quiz object
            expect(stephanie.ownsQuiz(stephanieQuiz._id)).to.be.true;                   // Quiz ObjectID
            expect(stephanie.ownsQuiz(stephanieQuiz._id.toString())).to.be.true;        // Quiz ID as a string

            expect(stephanie.ownsQuiz(barbaraQuiz)).to.be.false;                       // Quiz object
            expect(stephanie.ownsQuiz(barbaraQuiz._id)).to.be.false;                   // Quiz ObjectID
            expect(stephanie.ownsQuiz(barbaraQuiz._id.toString())).to.be.false;        // Quiz ID as a string
        });
    });
});
