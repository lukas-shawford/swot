var Q = require('q');
var chai = require('chai');
var expect = chai.expect;
var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var QuizService = require('../../../lib/quiz/quizService');
var User = require('../../../lib/user');
var Quiz = require('../../../lib/quiz').Quiz;
var Topic = require('../../../lib/quiz').Topic;
var FillInQuestion = require('../../../lib/questions/fillIn').FillInQuestion;

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
            User.createUser({
                email: 'hernando@example.com',
                password: 'letmein'
            }, function (err, user) {
                if (err) throw err;
                testUser = user;

                return QuizService.importTopicTree(user, [
                    { name: 'Underwater Basket Weaving', quizzes: [], subtopics: [] },
                    {
                        name: 'Flying',
                        quizzes: [
                            {
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
                            },
                            { name: 'Weather', questions: [] }
                        ],
                        subtopics: [
                            { name: 'Regulations', quizzes: [] }
                        ]
                    },
                    {
                        name: 'Programming',
                        quizzes: [
                            { name: 'Algorithms & Data Structures', questions: [] },
                            { name: 'Security', questions: [] }
                        ],
                        subtopics: [
                            {
                                name: 'Web Development',
                                quizzes: [
                                    { name: 'HTML', questions: [] },
                                    { name: 'CSS', questions: [] },
                                    { name: 'JavaScript', questions: [] }
                                ]
                            },
                            {
                                name: 'C#.NET',
                                quizzes: []
                            }
                        ]
                    }
                ], null).then(function () {
                    // Update user doc
                    return User.findById(testUser._id).exec();
                }).then(function (user) {
                    testUser = user;
                    return QuizService.getQuizzesAndTopics(testUser);
                }).then(function (result) {
                    hierarchy = result;
                }).done(function () { done(); });
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

        it('should set quiz.numQuestions to the number of questions in the quiz instead of returning the full questions list', function () {
            var flyingTopic = _.findWhere(hierarchy, { name: 'Flying' });
            var nightFlyingQuiz = _.findWhere(flyingTopic.quizzes, { name: 'Night Flying' });
            expect(nightFlyingQuiz.numQuestions).to.equal(2);
            expect(nightFlyingQuiz.questions).to.be.undefined;
        });
    });

    describe('deleteTopic', function () {
        var testUser;
        var topics = {};
        var quizzes = {};
        var hierarchy;

        before(function (done) {
            User.createUser({
                email: 'ferdinand@example.com',
                password: 'letmein'
            }, function (err, user) {
                if (err) throw err;
                testUser = user;

                return QuizService.importTopicTree(user, [
                    {
                        name: 'Science',
                        quizzes: [
                            { name: 'The Scientific Method', questions: [] },
                            { name: 'The Ethics of Scientific Research', questions: [] }
                        ],
                        subtopics: [
                            {
                                name: 'Physics',
                                quizzes: [
                                    { name: 'Physics 101', questions: [] }
                                ],
                                subtopics: [
                                    {
                                        name: 'Quantum Mechanics',
                                        quizzes: [
                                            { name: 'Introduction to Quantum Mechanics', questions: [] }
                                        ]
                                    }
                                ]
                            },
                            {
                                name: 'Chemistry',
                                subtopics: [
                                    {
                                        name: 'Organic Chemistry',
                                        quizzes: [
                                            { name: 'Introduction to Organic Chemistry', questions: [] }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        name: 'Philosophy',
                        quizzes: [
                            { name: 'Introduction to Philosophy', questions: [] }
                        ],
                        subtopics: [
                            {
                                name: 'Logic and Reasoning',
                                quizzes: []
                            },
                            {
                                name: 'Metaphysics',
                                quizzes: [
                                    { name: 'Cosmology and Cosmogony', questions: [] },
                                    { name: 'Determinism and Free Will', questions: [] }
                                ]
                            }
                        ]
                    },
                    { name: 'Underwater Basket Weaving', quizzes: [], subtopics: [] }
                ], null).then(function () {
                    // Update user doc
                    return User.findById(testUser._id).exec();
                }).then(function (user) {
                    testUser = user;
                    return QuizService.getQuizzesAndTopics(testUser);
                }).then(function (result) {
                    hierarchy = result;
                    return;
                }).done(function () { done(); });
            });
        });

        it('should successfully delete leaf topics and their quizzes', function (done) {
            var scienceTopic = _.findWhere(hierarchy, { name: 'Science' });
            var chemistrySubtopic = _.findWhere(scienceTopic.subtopics, { name: 'Chemistry' });

            // Here's the topic we will be deleting
            var organicChemistrySubtopic = _.findWhere(chemistrySubtopic.subtopics, { name: 'Organic Chemistry' });

            // Make sure quiz within the topic initially exists
            var introToOrganicChemistry = _.findWhere(organicChemistrySubtopic.quizzes, { name: 'Introduction to Organic Chemistry' });
            return Q(Quiz.findById(introToOrganicChemistry._id).exec())
                .then(function (quiz) {
                    expect(quiz).to.exist;
                    return Topic.findById(organicChemistrySubtopic._id).exec();
                })
                .then(function (topic) {
                    // Delete the topic
                    return QuizService.deleteTopic(topic)
                })
                .then(function () {
                    // Update user doc
                    return User.findById(testUser._id).exec();
                })
                .then(function (user) {
                    testUser = user;

                    // Retrieve new quiz/topic hierarchy
                    return QuizService.getQuizzesAndTopics(testUser);
                })
                .then(function (hierarchy) {
                    var scienceTopic = _.findWhere(hierarchy, { name: 'Science' });
                    var chemistrySubtopic = _.findWhere(scienceTopic.subtopics, { name: 'Chemistry' });
                    var organicChemistrySubtopic = _.findWhere(chemistrySubtopic.subtopics, { name: 'Organic Chemistry' });

                    // Make sure topic got deleted
                    expect(organicChemistrySubtopic).to.be.undefined;

                    // Also make sure quiz got deleted
                    return Quiz.findById(introToOrganicChemistry._id).exec()
                })
                .then(function (quiz) {
                    expect(quiz).not.to.exist;
                })
                .done(function () { done(); });
        });

        it('should successfully delete root topics, and all their subtopics and quizzes', function (done) {
            var philosophyTopic = _.findWhere(hierarchy, { name: 'Philosophy' });
            var introToPhilosophyQuiz = _.findWhere(philosophyTopic.quizzes, { name: 'Introduction to Philosophy' });
            var logicSubtopic = _.findWhere(philosophyTopic.subtopics, { name: 'Logic and Reasoning' });
            var metaphysicsSubtopic = _.findWhere(philosophyTopic.subtopics, { name: 'Metaphysics' });
            var cosmologyQuiz = _.findWhere(metaphysicsSubtopic.quizzes, { name: 'Cosmology and Cosmogony' });
            var determinismQuiz = _.findWhere(metaphysicsSubtopic.quizzes, { name: 'Determinism and Free Will' });

            // Define utility functions for checking if a topic/quiz exists in the DB
            var topicExists = function (topic) { return Topic.findById(topic._id).exec().then(function (doc) { return !!doc; }); };
            var quizExists = function (quiz) { return Quiz.findById(quiz._id).exec().then(function (doc) { return !!doc; }); };

            // Make sure all of the above topics/quizzes initially exist.
            var topics = [philosophyTopic, logicSubtopic, metaphysicsSubtopic];
            var quizzes = [introToPhilosophyQuiz, cosmologyQuiz, determinismQuiz];
            return Q.all(_.map(topics, topicExists).concat(_.map(quizzes, quizExists)))
                .then(function (result) {
                    expect(result).to.eql([ true, true, true, true, true, true ]);

                    // Find and delete the root topic
                    return Topic.findById(philosophyTopic._id).exec().then(function (topic) {
                        return QuizService.deleteTopic(topic)
                    });
                })
                .then(function (result) {
                    // Make sure result is the deleted document
                    expect(result.name).to.equal('Philosophy');

                    // Make sure all of the prior topics/quizzes no longer exist in the DB
                    return Q.all(_.map(topics, topicExists).concat(_.map(quizzes, quizExists)))
                })
                .then(function (result) {
                    expect(result).to.eql([ false, false, false, false, false, false ]);

                    // Update user doc
                    return User.findById(testUser._id).exec();
                })
                .then(function (user) {
                    testUser = user;

                    // Retrieve the new quiz/topic hierarchy and make sure the philosophy topic is
                    // no longer present in the top-level topics list.
                    return QuizService.getQuizzesAndTopics(testUser);
                })
                .then(function (hierarchy) {
                    var philosophyTopic = _.findWhere(hierarchy, { name: 'Philosophy' });
                    expect(philosophyTopic).to.be.undefined;
                })
                .done(function () { done(); });
        });
    });

    describe('importTopicTree', function () {
        var testUser;
        var topics = {};
        var quizzes = {};
        var hierarchy;

        before(function (done) {

            User.createUser({
                email: 'pendergast@example.com',
                password: 'letmein'
            }, function (err, user) {
                if (err) throw err;
                testUser = user;

                return QuizService.importTopicTree(user, [
                    {
                        name: 'Science',
                        quizzes: [
                            { name: 'The Scientific Method', questions: [] },
                            { name: 'The Ethics of Scientific Research', questions: [] }
                        ],
                        subtopics: [
                            {
                                name: 'Physics',
                                quizzes: [
                                    { name: 'Physics 101', questions: [] }
                                ],
                                subtopics: [
                                    {
                                        name: 'Quantum Mechanics',
                                        quizzes: [
                                            { name: 'Introduction to Quantum Mechanics', questions: [] }
                                        ]
                                    }
                                ]
                            },
                            {
                                name: 'Chemistry',
                                subtopics: [
                                    {
                                        name: 'Organic Chemistry',
                                        quizzes: [
                                            { name: 'Introduction to Organic Chemistry', questions: [] }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        name: 'Philosophy',
                        quizzes: [
                            { name: 'Introduction to Philosophy', questions: [] }
                        ],
                        subtopics: [
                            { name: 'Logic and Reasoning', quizzes: [] },
                            { name: 'Metaphysics', quizzes: [] }
                        ]
                    },
                    { name: 'Underwater Basket Weaving', quizzes: [], subtopics: [] }
                ], null).then(function () {
                    // Update user doc
                    return User.findById(testUser._id).exec();
                }).then(function (user) {
                    testUser = user;
                    return QuizService.getQuizzesAndTopics(testUser);
                }).then(function (result) {
                    hierarchy = result;
                    return;
                }).done(function () { done(); });
            });
        });

        it('should import top-level topics', function () {
            var topLevelTopics = _.pluck(hierarchy, 'name');
            expect(topLevelTopics).to.eql([ 'Science', 'Philosophy', 'Underwater Basket Weaving' ]);
        });

        it('should import quizzes for top-level topics', function () {
            var scienceTopic = _.findWhere(hierarchy, { name: 'Science' });
            var scienceQuizzes = _.pluck(scienceTopic.quizzes, 'name');
            expect(scienceQuizzes).to.eql([ 'The Scientific Method', 'The Ethics of Scientific Research' ]);

            var philosophyTopic = _.findWhere(hierarchy, { name: 'Philosophy' });
            var philosophyQuizzes = _.pluck(philosophyTopic.quizzes, 'name');
            expect(philosophyQuizzes).to.eql([ 'Introduction to Philosophy' ]);
        });

        it('should import empty topics correctly', function () {
            var underwaterBasketWeaving = _.findWhere(hierarchy, { name: 'Underwater Basket Weaving' });
            expect(underwaterBasketWeaving.subtopics).to.be.empty;
            expect(underwaterBasketWeaving.quizzes).to.be.empty;
        });

        it('should import subtopics correctly', function () {
            var scienceTopic = _.findWhere(hierarchy, { name: 'Science' });
            var scienceSubtopics = _.pluck(scienceTopic.subtopics, 'name');
            expect(scienceSubtopics).to.eql([ 'Physics', 'Chemistry' ]);

            var philosophyTopic = _.findWhere(hierarchy, { name: 'Philosophy' });
            var philosophySubtopics = _.pluck(philosophyTopic.subtopics, 'name');
            expect(philosophySubtopics).to.eql([ 'Logic and Reasoning', 'Metaphysics' ]);
        });

        it('should import quizzes for subtopics', function () {
            var scienceTopic = _.findWhere(hierarchy, { name: 'Science' });
            var physicsSubtopic = _.findWhere(scienceTopic.subtopics, { name: 'Physics' });
            var physicsQuizzes = _.pluck(physicsSubtopic.quizzes, 'name');
            expect(physicsQuizzes).to.eql([ 'Physics 101' ]);
        });

        it('should import subtopics without quizzes correctly', function () {
            var scienceTopic = _.findWhere(hierarchy, { name: 'Science' });
            var chemistrySubtopic = _.findWhere(scienceTopic.subtopics, { name: 'Chemistry' });
            var chemistryQuizzes = _.pluck(chemistrySubtopic.quizzes, 'name');
            expect(chemistryQuizzes).to.be.empty;
        });

        it('should import sub-subtopics correctly', function () {
            var scienceTopic = _.findWhere(hierarchy, { name: 'Science' });
            var chemistrySubtopic = _.findWhere(scienceTopic.subtopics, { name: 'Chemistry' });
            var chemistrySubtopics = _.pluck(chemistrySubtopic.subtopics, 'name');
            expect(chemistrySubtopics).to.eql([ 'Organic Chemistry' ]);
        });

        it('should import sub-subtopics quizzes correctly', function () {
            var scienceTopic = _.findWhere(hierarchy, { name: 'Science' });
            var chemistrySubtopic = _.findWhere(scienceTopic.subtopics, { name: 'Chemistry' });
            var organicChemistrySubtopic = _.findWhere(chemistrySubtopic.subtopics, { name: 'Organic Chemistry' });
            var organicChemistryQuizzes = _.pluck(organicChemistrySubtopic.quizzes, 'name');
            expect(organicChemistryQuizzes).to.eql([ 'Introduction to Organic Chemistry' ]);
        });
    });
});
