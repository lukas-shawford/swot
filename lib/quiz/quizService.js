var _ = require('underscore');
var Q = require('q');
var mongoose = require('mongoose-q')();
var util = require('../util');
var Quiz = require('../quiz').Quiz;
var FillInQuestion = require('../questions/fillIn').FillInQuestion;
var MultipleChoiceQuestion = require('../questions/multipleChoice').MultipleChoiceQuestion;
var Topic = require('../quiz').Topic;
var User = require('../user');
var Question = require('../../lib/question').Question;

/**
 * Creates a quiz and associates it with the given user and topic. Note that both a user and a topic
 * are required to create a quiz, and the topic must be owned by the user.
 * @param data Quiz data
 * @param user The user who should own this quiz
 * @returns An array containing:
 *  - The created quiz document.
 *  - The updated user document.
 */
exports.createQuiz = function (data, user) {
    if (!user) {
        throw new Error('user is required to create a quiz');
    }

    var ret = [];
    return Q(Topic.findById(data.topic).exec())
        .then(function (topic) {
            if (!topic) { throw new Error("Topic not found."); }
            if (!topic.createdBy.equals(user._id)) { throw new Error("Failed to create quiz: topic is not owned by user."); }
            return Quiz.createQ({
                name: data.name,
                topic: topic,
                dateCreated: new Date(),
                createdBy: user
            });
        })
        .then(function (quiz) {
            // Save the questions
            _.each(data.questions, function (question) {
                if (!(question instanceof Question)) {
                    question = exports.createQuestion(question);
                }
                quiz.questions.push(question);
            });
            return quiz.saveQ();
        }).then(function (quiz) {
            ret.push(quiz);
            user.quizzes.push(quiz);
            return user.saveQ();
        }).then(function () {
            ret.push(user);
            return ret;
        });
};


/**
 * Creates a topic and associates it with the given user.
 * @param data - Topic data. Should include the following properties:
 *  - name: The name of the topic. (Defaults to "New Topic".)
 *  - parent: Parent topic document, or null if this is a top-level topic. The parent topic
 *      must be owned by the same user.
 * @param user - The user who owns the topic.
 * @returns An array containing:
 *  - The created topic.
 *  - The updated user document.
 */
exports.createTopic = function (data, user) {
    if (!user) {
        return Q.reject("Invalid user");
    }

    // If creating a subtopic, verify that the parent topic is owned by the user.
    var promise = Q();
    var parentTopic;
    if (data.parent) {
        promise = Q(Topic.findById(data.parent._id || data.parent).exec())
            .then(function (parent) {
                parentTopic = parent;
                if (!parentTopic) {
                    throw new Error("Parent topic not found.");
                }
                if (!parentTopic.createdBy.equals(user._id)) {
                    throw new Error("Failed to create subtopic: parent topic not owned by user.")
                }
            });
    }

    // Create the topic
    var ret = [];
    return promise
        .then(function () {
            return Topic.createQ({
                name: data.name || "New Topic",
                dateCreated: new Date(),
                createdBy: user,
                parent: data.parent || null
            });
        })
        .then(function (topic) {
            ret.push(topic);
            return User.findById(user._id).exec();      // Reload user
        })
        .then(function (user) {
            ret.push(user);
            return ret;
        });
};


/**
 * Given a plain object with a 'type' property, returns a proper Question instance, or throws an
 * error if the type is not valid.
 * @param question Plain object that has a 'type' property that identifies the type of question it
 *      represents, as well as all appropriate properties for that question type.
 * @returns {Question} An instance of the proper subclass of Question, depending on the question
 *      type.
 */
exports.createQuestion = function (question) {
    switch (question.type) {
        case 'FillInQuestion':
            return new FillInQuestion(question);
        case 'MultipleChoiceQuestion':
            return new MultipleChoiceQuestion(question);
        default:
            throw new Error('Invalid question type: ' + question.type);
    }
};


exports.getSubtopics = function (topic) {
    return Q.all(topic.subtopics.map(function (subtopicId) {
        return Topic.findById(subtopicId).exec();
    }));
};


exports.getQuizzesByTopic = function (topic) {
    return Q.all(topic.quizzes.map(function (quizId) {
        return Quiz.findById(quizId).exec();
    }));
};


/**
 * Loads all the quizzes and topics.
 * @param user The user whose quizzes and topics to load
 * @returns {Promise} Promise for an array of topics, with each topic having a subtopics property
 *      (for child topics) and a quizzes property (quizzes that are directly associated with that
 *      topic).
 */
exports.getQuizzesAndTopics = function (user) {
  // Load root-level topics
    return Q.all(_.map(user.topics, function (topicId) {
        return Topic.findById(topicId).exec();
    })).then(function (topics) {
        // Emit warnings for topics that were not found in the topics collection (implying
        // user.topics is out of sync).
        _.each(topics, function (topic, i) {
            if (!topic) {
                console.warn('Topic ' + user.topics[i] + ' exists in user.topics for user ' + user.email +
                    ' (' + user._id + '), but could not be found in topics collection.');
                return null;
            }
            return topic;
        });

        // Filter out null topics
        topics = _.without(topics, null);

        // Transform root topics into simple objects, and strip off unneeded properties
        var result = _.map(topics, function (topic) {
            return _.omit(topic.toObject(), [ 'createdBy', '__v', 'parent' ]);
        });

        // Recursively load quizzes and subtopics.
        return Q.all(_.map(topics, function (topic, i) {
            return exports.getQuizzesAndSubtopics(topic, result[i]);
        })).then(function () {
            return result;
        });
    });
};


/**
 * Returns the quizzes and child topics associated with the given topic. The quizzes and subtopics
 * are returned by modifying the 'result' parameter.
 * @param topic The topic whose quizzes and subtopics to load.
 * @param result The object where to tack on the quizzes and subtopics. This object will be modified
 *      by adding a "quizzes" property and a "subtopics" property.
 * @returns {Promise} This function returns the passed in result object with the quizzes and
 *      subtopics tacked onto it.
 */
exports.getQuizzesAndSubtopics = function (topic, result) {
    return Q.all([exports.getQuizzesByTopic(topic), exports.getSubtopics(topic)])
        .spread(function (quizzes, subtopics) {
            result.quizzes = _.map(quizzes, function (quiz) {
                quiz = quiz.toObject();
                quiz.numQuestions = quiz.questions.length;
                return _.omit(quiz, [ 'questions', 'createdBy', '__v' ]);
            });
            result.subtopics = _.map(subtopics, function (subtopic) {
                return _.omit(subtopic.toObject(), [ 'createdBy', '__v' ]);
            });
            return Q.all(_.map(subtopics, function (subtopic, i) {
                return exports.getQuizzesAndSubtopics(subtopic, result.subtopics[i]);
            })).then(function () {
                return result;
            });
        });
};


/**
 * Deletes the specified topic, along with its quizzes and all subtopics (and also including all
 * quizzes within all subtopics).
 * @param topic The topic to delete
 * @returns {Promise} Returns a promise for the deleted topic document.
 */
exports.deleteTopic = function (topic) {
    return exports.getQuizzesAndSubtopics(topic, topic.toObject())
        .then(function (result) {
            // Delete quizzes and subtopics
            return Q.all(_.map(result.quizzes, exports.deleteQuiz)
                .concat(_.map(result.subtopics, function (subtopic) {
                    return Topic.findById(subtopic._id).exec().then(function (subtopic) {
                        return exports.deleteTopic(subtopic);
                    });
                })));
        })
        .then(function () {
            // Delete the topic itself
            return Topic.findById(topic._id).exec().then(function (t) {
                return t.removeQ();
            });
        })
        .then(function (deletedTopic) {
            // Remove the topic from the user.topics array if it's a root topic.
            if (!deletedTopic.parent) {
                return User.findById(deletedTopic.createdBy).exec()
                    .then(function (user) {
                        return User.findByIdAndUpdate(user._id, { $pull: { topics: deletedTopic._id }}).exec();
                    })
                    .then(function () {
                        return deletedTopic;
                    });
            }
        });
};


exports.deleteQuiz = function (quiz) {
    return Quiz.findByIdAndRemove(quiz._id).exec()
        .then(function (quiz) {
            return User.findById(quiz.createdBy).exec();
        })
        .then(function (user) {
            return user.quizzes.remove(quiz._id);
        });
};


/**
 * Adds the topic tree, including all associated subtopics and quizzes, to the user's own list of
 * topics.
 * @param user The user who should own the imported topics and quizzes
 * @param topics An array of topic objects, which each topic having 'name', 'quizzes', and 'subtopics'
 *      properties.
 * @param root The root topic underneath which the imported topics should be added, or null if the
 *      topics should be imported as top-level topics.
 * @return {Promise}
 */
exports.importTopicTree = function (user, topics, root) {

    // TODO: Consider having this function return something useful, like the updated user doc, or
    // the topic hierarchy

    // TODO: Expose importTopic as a module export
    var importTopic = function importTopic (topic, parent) {
        topic.parent = parent;
        var createdTopic;
        return exports.createTopic(topic, user)
            .then(function (result) {
                createdTopic = result[0];
                user = result[1];

                var importRemainingQuizzes = function (remaining) {
                    var quiz = remaining.shift();
                    if (quiz) {
                        quiz.topic = createdTopic;
                        return exports.createQuiz(quiz, user).then(function (result) {
                            user = result[1];
                            return importRemainingQuizzes(remaining);
                        });
                    }
                };

                return Q(importRemainingQuizzes(topic.quizzes || []));
            })
            .then(function () {
                // Import topics in serial (to preserve original order)
                topic.subtopics = topic.subtopics || [];
                return topic.subtopics.reduce(function (promise, subtopic) {
                    return promise.then(function () {
                        return importTopic(subtopic, createdTopic);
                    });
                }, Q());
            });
    };

    // TODO: It should be possible to clean this up a bit by either combining importTopic and
    // importRemainingTopics into one function, or maybe have importTopicTree itself be recursive
    // and have it import one topic at a time.
    var importRemainingTopics = function (remaining) {
        var topic = remaining.shift();
        if (topic) {
            return importTopic(topic, root).then(function () {
                return importRemainingTopics(remaining);
            });
        }
    };

    return importRemainingTopics(topics);
};

/**
 * Searches the given topic hierarchy for topics with the given name. Returns an array of topic
 * objects that match. Note: This method does not support partial matches at the moment, and the
 * matches are case-sensitive.
 * @param hierarchy The topic hierarchy to search (as returned by getQuizzesAndTopics)
 * @param name The name of the topic to search for (case-sensitive, exact match)
 * @return Array of topic objects with matching name
 */
exports.searchHierarchyByName = function (hierarchy, name) {
    var results = [];

    (function search (root) {
        var subtopics = root.subtopics || [];
        for (var j = 0; j < subtopics.length; j++) {
            if (subtopics[j].name === name) {
                results.push(subtopics[j]);
            }
            search(subtopics[j]);
        }
    })({ subtopics: hierarchy });

    return results;
};
