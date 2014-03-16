var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var questionSchema = new mongoose.Schema({
    questionHtml: String,
    answer: String
});

questionSchema.methods.submit = function(submission) {
    return this.answer === submission;
};

var Question = mongoose.model('Question', questionSchema);

exports.Question = Question;
exports.QuestionSchema = questionSchema;
