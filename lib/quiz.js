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

/*
 * Topic Schema
 * ------------------------------------------------------------------------- */

// TODO: Move topic schema/model to separate file

var topicSchema = new mongoose.Schema({
    name: String,
    dateCreated: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    parent: { type: Schema.Types.ObjectId, ref: 'Topic' },
    subtopics: [{ type: Schema.Types.ObjectId, ref: 'Topic' }]
});

var Topic = mongoose.model('Topic', topicSchema);

// The pre-save hook below adds subtopics to the parent topic's "subtopics" array. It's commented
// out because this is currently being done in QuizService.createTopic. I'm not sure yet what should
// be the proper place to do this.
/*
topicSchema.pre('save', function (next) {
    var self = this;

    // If creating a subtopic, then add the subtopic to
    // the parent topic's "subtopics" array

    if (this.parent) {
        Topic.findById(this.parent, function (err, parent) {
            if (err) return next(err);
            if (parent) {
                parent.subtopics.push(self);
                return parent.save(next);
            }
            return next();
        });
    } else {
        next();
    }
});
*/

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
