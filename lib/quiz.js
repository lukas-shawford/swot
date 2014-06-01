var Q = require('q');
var _ = require('underscore');
var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var util = require('./util');
var QuestionSchema = require('./question').QuestionSchema;
var User = require('./user');
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

// TODO: Move createQuiz to QuizService

/**
 * Creates a quiz.
 * @param data Quiz data
 * @param user The user who should own this quiz
 * @returns An array containing:
 *  - The created topic.
 *  - The updated user document.
 */
quizSchema.statics.createQuiz = function (data, user) {
    if (!user) {
        //return next(Error('user is required to create a quiz'));
        throw new Error('user is required to create a quiz');
    }

    var ret = [];
    return this.createQ({
        name: data.name,
        topic: data.topic || null,
        dateCreated: new Date(),
        createdBy: user
    }).then(function (quiz) {
        // Save the questions
        _.each(data.questions, function (question) {
            if (!(question instanceof Question)) {
                throw new Error("Invalid question: " + question);
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

/*
 * Topic Schema
 * ------------------------------------------------------------------------- */

// TODO: Move topic schema/model to separate file

var topicSchema = new mongoose.Schema({
    name: String,
    dateCreated: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    parent: { type: Schema.Types.ObjectId, ref: 'Topic' }
});

// TODO: Move createTopic to QuizService (or maybe TopicService?)

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
topicSchema.statics.createTopic = function (data, user) {
    var self = this;

    if (!user) {
        return Q.reject("Invalid user");
    }

    // If creating a subtopic, verify that the parent topic is owned by the user.
    var promise = Q();
    if (data.parent) {
        promise = Q(this.findById(data.parent._id || data.parent).exec())
            .then(function (parentTopic) {
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
            return self.createQ({
                name: data.name || "New Topic",
                dateCreated: new Date(),
                createdBy: user,
                parent: data.parent || null
            });
        })
        .then(function (topic) {
            ret.push(topic);
            if (!data.parent) {
                // Add top-level topics to user.topics
                user.topics.push(topic);
                return user.saveQ();
            }
            return Q(user);
        })
        .then(function (user) {
            ret.push(user);
            return ret;
        });
};

/*
 * Models
 * ------------------------------------------------------------------------- */

exports.Quiz = mongoose.model('Quiz', quizSchema);
exports.Topic = mongoose.model('Topic', topicSchema);
