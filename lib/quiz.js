var Q = require('q');
var _ = require('underscore');
var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var util = require('./util');
var QuestionSchema = require('./question').QuestionSchema;
var Question = require('./question').Question;
var FillInQuestion = require('./questions/fillIn').FillInQuestion;
var MultipleChoiceQuestion = require('./questions/multipleChoice').MultipleChoiceQuestion;

/*
 * Quiz Schema
 * ------------------------------------------------------------------------- */

var quizSchema = new mongoose.Schema({
    name: String,
    dateCreated: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    topic: { type: Schema.Types.ObjectId, ref: 'Topic' },
    
    // Ideally, I would use [QuestionSchema] here, instead of [Schema.Types.Mixed]. However, that
    // results in not saving any fields that are only present in one of the derived question types
    // (FillInQuestionSchema, etc.), but aren't present in the base (QuestionSchema). This may
    // have something to do with it: http://stackoverflow.com/a/16513323/393005
    questions: [Schema.Types.Mixed]
});

// TODO: Move submitQuestion to QuizService

quizSchema.methods.submitQuestion = function(questionIndex, submission) {
    if (!util.isInt(questionIndex) || questionIndex < 0 || questionIndex >= this.questions.length) {
        return {
            success: false,
            message: 'Invalid question index.'
        };
    }

    // Mongoose schema inheritance does not appear to have good support for virtual methods.
    // Ideally, I would like to just be able to call question.submit(submission) here, but that
    // results in TypeError: Object #<Object> has no method 'submit'. And it gets even worse if you
    // look into the definition of QuestionSchema.methods.submit.
    return QuestionSchema.methods.submit.call(this.questions[questionIndex], submission);
};

var Quiz = mongoose.model('Quiz', quizSchema);

// Quiz pre-save hook.
quizSchema.pre('save', function (next) {
    var self = this;
    var User = new require('./user');

    return Q()
        .then(function () {
            // Check if the topic property has been changed, and if so, ensure the new topic
            // exists and is owned by the same user before changing anything.
            if (self._oldTopic !== undefined && self.topic) {
                return Q(Topic.findById(self.topic).exec())
                    .then(function (parentTopic) {
                        if (!parentTopic) {
                            throw new Error("Topic not found.");
                        }
                        if (!parentTopic.createdBy.equals(self.createdBy)) {
                            throw new Error("Failed to move quiz: topic is not owned by user.");
                        }
                    })
            }
        })
        .then(function () {
            // Check if the topic property has been changed. If not, skip this step.
            if (self._oldTopic === undefined) {
                return;
            }

            // Remove quiz from old topic's quizzes array
            if (self._oldTopic) {
                return Q(Topic.findById(self._oldTopic).exec())
                    .then(function (oldTopic) {
                        oldTopic.quizzes.pull(self._id);
                        return oldTopic.saveQ();
                    });
            }
        })
        .then(function () {
            // Skip this step when saving an existing quiz without having changed the topic
            // property.
            if (!self.isNew && self._oldTopic === undefined) {
                return;
            }

            // Add quiz to new topic's quizzes array
            return Topic.findById(self.topic).exec()
                .then(function (topic) {
                    if (self.position === undefined) {
                        topic.quizzes.push(self);
                    } else {
                        topic.quizzes.splice(self.position, 0, self);
                    }

                    return topic.saveQ();
                });
        })
        .then(function () {
            // Reorder quiz. Skip this step if the position property has not been specified/changed.
            // Also skip this step if the quiz's topic has been changed, or if this is a new quiz,
            // since we already took care of inserting the quiz at the proper position in that case.
            if (self.position === undefined || self.isNew || self._oldTopic !== undefined) {
                return;
            }

            // Add quiz to the parent topic's quizzes array
            return Topic.findById(self.topic).exec()
                .then(function (topic) {
                    var oldPos = topic.quizzes.indexOf(self._id);
                    if (oldPos === -1) {
                        throw new Error("Failed to update quiz position: Quiz \"" + self.name + "\" (" + self._id.toString() +
                            ") was not found in the quizzes array of topic \"" + topic.name + "\" (" + topic._id.toString() + ").");
                    }
                    topic.quizzes.splice(self.position, 0, topic.quizzes.splice(oldPos, 1)[0]);
                    return topic.saveQ();
                });
        })
        .catch(function (err) {
            return next(err);
        })
        .done(function () {
            return next();
        });
});

quizSchema.path('topic').set(function (newTopic) {
    this._oldTopic = this.topic;
    return newTopic;
});

quizSchema.pre('remove', function (next) {
    var self = this;

    // When deleting a quiz, then remove it from the parent topic's "quizzes" array

    Topic.findById(this.topic, function (err, topic) {
        if (err) return next(err);
        if (topic) {
            topic.quizzes.pull(self._id);
            return topic.save(next);
        }
        return next();
    });
});

/*
 * Topic Schema
 * ------------------------------------------------------------------------- */

// TODO: Move topic schema/model to separate file

var topicSchema = new mongoose.Schema({
    name: String,
    dateCreated: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    parent: { type: Schema.Types.ObjectId, ref: 'Topic' },
    quizzes: [{ type: Schema.Types.ObjectId, ref: 'Quiz' }],
    subtopics: [{ type: Schema.Types.ObjectId, ref: 'Topic' }]
});

var Topic = mongoose.model('Topic', topicSchema);

// Topic pre-save hook.
topicSchema.pre('save', function (next) {
    var self = this;
    var User = new require('./user');

    return Q()
        .then(function () {
            // Check if the parent property has been changed, and if so, ensure the new parent topic
            // exists and is owned by the same user before changing anything.
            if (self._oldParent !== undefined && self.parent) {
                return Q(Topic.findById(self.parent).exec())
                    .then(function (parentTopic) {
                        if (!parentTopic) {
                            throw new Error("Topic not found.");
                        }
                        if (!parentTopic.createdBy.equals(self.createdBy)) {
                            throw new Error("Failed to move topic: parent topic is not owned by user.");
                        }
                    })
            }
        })
        .then(function () {
            // Check if the parent property has been changed. If not, skip this step.
            if (self._oldParent === undefined) {
                return;
            }

            // Remove topic from old parent
            if (self._oldParent) {
                // Subtopic: remove topic from old parent's subtopics array
                return Q(Topic.findById(self._oldParent).exec())
                    .then(function (oldParent) {
                        oldParent.subtopics.pull(self._id);
                        return oldParent.saveQ();
                    });
            } else {
                // Root topic: remove topic from user.topics array
                return Q(User.findById(self.createdBy).exec())
                    .then(function (user) {
                        user.topics.pull(self._id);
                        return user.saveQ();
                    });
            }
        })
        .then(function () {
            // Skip this step when saving an existing topic without having changed the parent
            // property.
            if (!self.isNew && self._oldParent === undefined) {
                return;
            }

            // Add topic to new parent
            if (self.parent) {
                // Add subtopics to the parent topic's subtopics array
                return Topic.findById(self.parent).exec()
                    .then(function (parent) {
                        if (self.position === undefined) {
                            parent.subtopics.push(self);
                        } else {
                            parent.subtopics.splice(self.position, 0, self);
                        }

                        return parent.saveQ();
                    });
            } else {
                // Add top-level topics to user.topics
                return Q(User.findById(self.createdBy).exec())
                    .then(function (user) {
                        if (self.position === undefined) {
                            user.topics.push(self);
                        } else {
                            user.topics.splice(self.position, 0, self);
                        }
                        return user.saveQ();
                    });
            }
        })
        .then(function () {
            // Reorder topic. Skip this step if the position property has not been specified/changed.
            // Also skip this step if the topic's parent has been changed, or if this is a new topic,
            // since we already took care of inserting the topic at the proper position in that case.
            if (self.position === undefined || self.isNew || self._oldParent !== undefined) {
                return;
            }

            if (self.parent) {
                // Add subtopics to the parent topic's subtopics array
                return Topic.findById(self.parent).exec()
                    .then(function (parent) {
                        var oldPos = parent.subtopics.indexOf(self._id);
                        if (oldPos === -1) {
                            throw new Error("Failed to update topic position: Topic \"" + self.name + "\" (" + self._id.toString() +
                                ") is not a subtopic of \"" + parent.name + "\" (" + parent._id.toString() + ").");
                        }
                        parent.subtopics.splice(self.position, 0, parent.subtopics.splice(oldPos, 1)[0]);
                        return parent.saveQ();
                    });
            } else {
                return Q(User.findById(self.createdBy).exec())
                    .then(function (user) {
                        var oldPos = user.topics.indexOf(self._id);
                        if (oldPos === -1) {
                            throw new Error("Failed to update topic position: Topic \"" + self.name + "\" (" + self._id.toString() +
                                ") has no parent (indicating that it is a root topic), but it could not be " +
                                "found in the user.topics array.");
                        }
                        user.topics.splice(self.position, 0, user.topics.splice(oldPos, 1)[0]);
                        return user.saveQ();
                    });
            }
        })
        .catch(function (err) {
            return next(err);
        })
        .done(function () {
            return next();
        });
});

topicSchema.path('parent').set(function (newParent) {
    this._oldParent = this.parent;
    return newParent;
});

topicSchema.pre('remove', function (next) {
    var self = this;

    // If deleting a subtopic, then remove it from the parent
    // topic's "subtopics" array.
    //
    // TODO: it would also be a good idea to recursively remove
    // all quizzes and subtopics here. This is currently done in
    // QuizService.deleteTopic, but it probably belongs here.
    //
    // TODO #2: For root topics, we should also remove it from
    // the user.topics array. This is also currently being done
    // in QuizService.deleteTopic, but probably belongs here.
    // However, we may run into issues here due to circular
    // requires between this file and lib/user.js

    if (this.parent) {
        Topic.findById(this.parent, function (err, parent) {
            if (err) return next(err);
            if (parent) {
                parent.subtopics.pull(self._id);
                return parent.save(next);
            }
            return next();
        });
    } else {
        next();
    }
});

/*
 * Exports
 * ------------------------------------------------------------------------- */

exports.Quiz = Quiz;
exports.Topic = Topic;
