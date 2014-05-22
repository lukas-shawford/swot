var chai = require('chai');
var expect = chai.expect;
var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var quizService = require('../../../lib/quiz/quizService');
var User = require('../../../lib/user');
var Quiz = require('../../../lib/quiz').Quiz;
var Topic = require('../../../lib/quiz').Topic;

var MONGODB_URL = process.env.MONGODB_TEST_URL || 'localhost:27017/swot_test';
chai.Assertion.includeStack = true;

describe('quizService', function () {

    before(function (done) {
        this.timeout(5000);
        mongoose.connect(MONGODB_URL);

        // Delete all users and quizzes so we start off with a clean slate
        User.remove({}, function (err) {
            if (err) throw err;
            Quiz.remove({}, function (err) {
                if (err) throw err;
                User.remove({}, done);
            });
        });
    });

    after(function () {
        mongoose.connection.close();
    });

    describe("getQuizzesAndTopics", function () {

        var testUser;
        var topics = {};
        var quizzes = {};
        var hierarchy;

        before(function (done) {

            // Create a test user, and create the following hierarchy of topics/quizzes:
            //
            // |- Underwater Basket Weaving (Topic)
            // |- Flying (Topic)
            // |  |- Night Flying (Quiz)
            // |  |- Weather (Quiz)
            // |  |- Regulations (Topic)
            // |- Programming (Topic)
            // |  |- Algorithms & Data Structures (Quiz)
            // |  |- Security (Quiz)
            // |  |- Web Development (Topic)
            // |  |  |- HTML (Quiz)
            // |  |  |- CSS (Quiz)
            // |  |  |- JavaScript (Quiz)
            // |  |- C#.NET (Topic)

            User.createUser({
                email: 'hernando@example.com',
                password: 'letmein'
            }, function (err, user) {
                if (err) throw err;
                return Topic.createTopic({ name: "Underwater Basket Weaving", parent: null }, user)
                    .then(function (result) {
                        topics['Underwater Basket Weaving'] = result[0];
                        return Topic.createTopic({ name: "Flying", parent: null }, result[1])
                    })
                    .then(function (result) {
                        topics['Flying'] = result[0];
                        return Quiz.createQuiz({ name: "Night Flying", topic: topics['Flying'] }, result[1]);
                    })
                    .then(function (result) {
                        quizzes['Night Flying'] = result[0];
                        return Quiz.createQuiz({ name: "Weather", topic: topics['Flying'] }, result[1]);
                    })
                    .then(function (result) {
                        quizzes['Weather'] = result[0];
                        return Topic.createTopic({ name: "Regulations", parent: topics['Flying'] }, result[1]);
                    })
                    .then(function (result) {
                        topics['Regulations'] = result[0];
                        return Topic.createTopic({ name: "Programming", parent: null }, result[1]);
                    })
                    .then(function (result) {
                        topics['Programming'] = result[0];
                        return Quiz.createQuiz({ name: "Algorithms & Data Structures", topic: topics['Programming'] }, result[1]);
                    })
                    .then(function (result) {
                        quizzes['Algorithms & Data Structures'] = result[0];
                        return Quiz.createQuiz({ name: "Security", topic: topics['Programming'] }, result[1]);
                    })
                    .then(function (result) {
                        quizzes['Security'] = result[0];
                        return Topic.createTopic({ name: "Web Development", parent: topics['Programming'] }, result[1]);
                    })
                    .then(function (result) {
                        topics['Web Development'] = result[0];
                        return Quiz.createQuiz({ name: "HTML", topic: topics['Web Development'] }, result[1]);
                    })
                    .then(function (result) {
                        quizzes['HTML'] = result[0];
                        return Quiz.createQuiz({ name: "CSS", topic: topics['Web Development'] }, result[1]);
                    })
                    .then(function (result) {
                        quizzes['CSS'] = result[0];
                        return Quiz.createQuiz({ name: "JavaScript", topic: topics['Web Development'] }, result[1]);
                    })
                    .then(function (result) {
                        quizzes['JavaScript'] = result[0];
                        return Topic.createTopic({ name: "C#.NET", parent: topics['Programming'] }, result[1]);
                    })
                    .then(function (result) {
                        topics['C#.NET'] = result[0];
                        testUser = result[1];
                        return quizService.getQuizzesAndTopics(testUser);
                    })
                    .then(function (result) {
                        hierarchy = result;
                        return;
                    })
                    .done(done, function (err) { throw err; });
            });
        });

        it('should load top-level topics correctly', function () {
            var topLevelTopics = _.pluck(hierarchy, 'name');
            expect(topLevelTopics).to.eql([ 'Underwater Basket Weaving', 'Flying', 'Programming' ]);
        });

        it('should set subtopics and quizzes to empty arrays if there are no subtopics or quizzes for a topic', function () {
            var underwaterBasketWeaving = _.findWhere(hierarchy, { name: 'Underwater Basket Weaving' });
            expect(underwaterBasketWeaving.subtopics).to.be.empty;
            expect(underwaterBasketWeaving.quizzes).to.be.empty;
        });

        it('should load quizzes for top-level topics correctly', function () {
            var flyingTopic = _.findWhere(hierarchy, { name: 'Flying' });
            var flyingQuizzes = _.pluck(flyingTopic.quizzes, 'name');
            expect(flyingQuizzes).to.eql([ 'Night Flying', 'Weather' ]);

            var programmingTopic = _.findWhere(hierarchy, { name: 'Programming' });
            var programmingQuizzes = _.pluck(programmingTopic.quizzes, 'name');
            expect(programmingQuizzes).to.eql([ 'Algorithms & Data Structures', 'Security' ]);
        });

        it('should load subtopics correctly', function () {
            var flyingTopic = _.findWhere(hierarchy, { name: 'Flying' });
            var flyingSubtopics = _.pluck(flyingTopic.subtopics, 'name');
            expect(flyingSubtopics).to.eql([ 'Regulations' ]);

            var programmingTopic = _.findWhere(hierarchy, { name: 'Programming' });
            var programmingSubtopics = _.pluck(programmingTopic.subtopics, 'name');
            expect(programmingSubtopics).to.eql([ 'Web Development', 'C#.NET' ]);
        });

        it('should load quizzes for subtopics correctly', function () {
            var programmingTopic = _.findWhere(hierarchy, { name: 'Programming' });
            var webdevSubtopic = _.findWhere(programmingTopic.subtopics, { name: 'Web Development' });
            var webdevQuizzes = _.pluck(webdevSubtopic.quizzes, 'name');
            expect(webdevQuizzes).to.eql([ 'HTML', 'CSS', 'JavaScript' ]);
        });

        it('should set quizzes to empty array for subtopics that have no quizzes', function () {
            var programmingTopic = _.findWhere(hierarchy, { name: 'Programming' });
            var csharpSubtopic = _.findWhere(programmingTopic.subtopics, { name: 'C#.NET' });
            expect(csharpSubtopic.quizzes).to.be.empty;
        });
    });
});
