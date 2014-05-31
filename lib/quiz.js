var Q = require('q');
var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var util = require('./util');
var QuestionSchema = require('./question').QuestionSchema;
var User = require('./user');

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
 *  - parent: Parent topic document, or null if this is a top-level topic.
 * @param user - The user who owns the topic.
 * @returns An array containing:
 *  - The created topic.
 *  - The updated user document.
 */
topicSchema.statics.createTopic = function (data, user) {
    var ret = [];
    return this.createQ({
        name: data.name || "New Topic",
        dateCreated: new Date(),
        createdBy: user,
        parent: data.parent || null
    }).then(function (topic) {
        ret.push(topic);
        if (!data.parent) {
            // Add top-level topics to user.topics
            user.topics.push(topic);
            return user.saveQ();
        }
        return Q(user);
    }).then(function (user) {
        ret.push(user);
        return ret;
    });
};

/*
 * Models
 * ------------------------------------------------------------------------- */

exports.Quiz = mongoose.model('Quiz', quizSchema);
exports.Topic = mongoose.model('Topic', topicSchema);
