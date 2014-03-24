var mongoose = require('mongoose');
var AbstractQuestionSchema = require('../question').AbstractQuestionSchema;
var Question = require('../question').Question;
var QuestionSchema = require('../question').QuestionSchema;
var Schema = mongoose.Schema;

var FillInQuestionSchema = new AbstractQuestionSchema({
    answer: String
});

FillInQuestionSchema.methods.submit = function(submission) {
    var result = {
        success: true,
        isCorrect: (this.answer === submission)
    };

    if (!result.isCorrect) {
        result.correctAnswer = this.answer;
    }

    return result;
};

var FillInQuestion = Question.discriminator('FillInQuestion', FillInQuestionSchema);

exports.FillInQuestion = FillInQuestion;
exports.FillInQuestionSchema = FillInQuestionSchema;
