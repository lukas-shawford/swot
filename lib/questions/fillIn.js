var mongoose = require('mongoose');
var AbstractQuestionSchema = require('../question').AbstractQuestionSchema;
var Question = require('../question').Question;
var QuestionSchema = require('../question').QuestionSchema;
var Schema = mongoose.Schema;

var FillInQuestionSchema = new AbstractQuestionSchema({
    answer: {
        type: String,
        required: true
    }
});

FillInQuestionSchema.methods.submit = function(submission) {
    return this.answer === submission;
};

var FillInQuestion = Question.discriminator('FillInQuestion', FillInQuestionSchema);

exports.FillInQuestion = FillInQuestion;
exports.FillInQuestionSchema = FillInQuestionSchema;
