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


/*
 * Models
 * ------------------------------------------------------------------------- */

exports.Quiz = mongoose.model('Quiz', quizSchema);
exports.Topic = mongoose.model('Topic', topicSchema);
