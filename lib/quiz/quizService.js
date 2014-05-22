var _ = require('underscore');
var Q = require('q');
var mongoose = require('mongoose-q')();
var util = require('../util');
var Quiz = require('../quiz').Quiz;
var Topic = require('../quiz').Topic;
var User = require('../user');

exports.getSubtopics = function (topic) {
    return Topic.find({ parent: topic._id }).exec();
};

exports.getQuizzesByTopic = function (topic) {
    return Quiz.find({ topic: topic._id }).exec();
};

exports.getQuizzesAndTopics = function (user) {

    // Define function for recursively loading a topic's quizzes and subtopics
    var getQuizzesAndSubtopics = function getQuizzesAndSubtopics (topic, result) {
        return Q.all([exports.getQuizzesByTopic(topic), exports.getSubtopics(topic)])
            .spread(function (quizzes, subtopics) {
                result.quizzes = _.map(quizzes, function (quiz) { return quiz.toObject(); });
                result.subtopics = _.map(subtopics, function (subtopic) { return subtopic.toObject(); });
                return Q.all(_.map(subtopics, function (subtopic, i) {
                    return getQuizzesAndSubtopics(subtopic, result.subtopics[i]);
                })).then(function () {
                    return result;
                });
            });
    };

    // Load root-level topics
    return Q.all(_.map(user.topics, function (topicId) {
        return Topic.findById(topicId).exec();
    })).then(function (topics) {
        // Transform root topics into simple objects
        var result = _.map(topics, function (topic) { return topic.toObject(); });
        // Recursively load quizzes and subtopics.
        return Q.all(_.map(topics, function (topic, i) {
            return getQuizzesAndSubtopics(topic, result[i]);
        })).then(function () {
            return result;
        });
    });
};
