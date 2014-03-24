var util = require('../util');
var mongoose = require('mongoose');
var AbstractQuestionSchema = require('../question').AbstractQuestionSchema;
var Question = require('../question').Question;
var QuestionSchema = require('../question').QuestionSchema;
var Schema = mongoose.Schema;

var MultipleChoiceQuestionSchema = new AbstractQuestionSchema({
    choices: [String],
    correctAnswerIndex: Number
});

MultipleChoiceQuestionSchema.methods.submit = function(submission) {
    var result = {
        success: true,
        isCorrect: (this.correctAnswerIndex == submission)
    };

    if (!result.isCorrect) {
        result.correctAnswerIndex = this.correctAnswerIndex;
    }

    return result;
};

var MultipleChoiceQuestion = Question.discriminator('MultipleChoiceQuestion', MultipleChoiceQuestionSchema);

exports.MultipleChoiceQuestion = MultipleChoiceQuestion;
exports.MultipleChoiceQuestionSchema = MultipleChoiceQuestionSchema;
