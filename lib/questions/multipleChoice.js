var util = require('../util');
var mongoose = require('mongoose');
var AbstractQuestionSchema = require('../question').AbstractQuestionSchema;
var Question = require('../question').Question;
var QuestionSchema = require('../question').QuestionSchema;
var Schema = mongoose.Schema;

var MultipleChoiceQuestionSchema = new AbstractQuestionSchema({
    choices: {
        type: [String],
        required: true,
        validate: function (c) {
            return c.length > 0;
        }
    },
    correctAnswerIndex: {
        type: Number,
        required: true,
        validate: function (index) {
            return util.isInt(index) && index >= 0 && index < this.choices.length;
        }
    }
});

MultipleChoiceQuestionSchema.methods.submit = function(submission) {
    return this.correctAnswerIndex == submission;
};

var MultipleChoiceQuestion = Question.discriminator('MultipleChoiceQuestion', MultipleChoiceQuestionSchema);

exports.MultipleChoiceQuestion = MultipleChoiceQuestion;
exports.MultipleChoiceQuestionSchema = MultipleChoiceQuestionSchema;
