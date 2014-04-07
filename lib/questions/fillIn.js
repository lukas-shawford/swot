var _ = require('underscore');
var mongoose = require('mongoose');
var AbstractQuestionSchema = require('../question').AbstractQuestionSchema;
var Question = require('../question').Question;
var QuestionSchema = require('../question').QuestionSchema;
var Schema = mongoose.Schema;

var FillInQuestionSchema = new AbstractQuestionSchema({
    answer: String,
    ignoreCase: Boolean,
    alternativeAnswers: [String]
});

FillInQuestionSchema.methods.submit = function(submission) {
    var isCorrect = this.ignoreCase ?
                    this.answer.toUpperCase() === submission.toUpperCase() :
                    this.answer === submission;

    // Check alternative answers
    if (!isCorrect && this.alternativeAnswers) {
        if (this.ignoreCase) {
            var altAnswers = _.map(this.alternativeAnswers, function (ans) {
                return ans.toUpperCase();
            });
            isCorrect = altAnswers.indexOf(submission.toUpperCase()) > -1;
        } else {
            isCorrect = this.alternativeAnswers.indexOf(submission) > -1;
        }
    }

    var result = {
        success: true,
        isCorrect: isCorrect
    };

    if (!result.isCorrect) {
        result.correctAnswer = this.answer;
        result.alternativeAnswers = this.alternativeAnswers;
    }

    return result;
};

var FillInQuestion = Question.discriminator('FillInQuestion', FillInQuestionSchema);

exports.FillInQuestion = FillInQuestion;
exports.FillInQuestionSchema = FillInQuestionSchema;
