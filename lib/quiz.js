var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var util = require('./util');
var QuestionSchema = require('./question').QuestionSchema;

var quizSchema = new mongoose.Schema({
    name: String,
    dateCreated: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    questions: [QuestionSchema]
});

quizSchema.statics.createQuiz = function (name, user, next) {
    if (!user) {
        return next(Error('user is required to create a quiz'));
    }

    this.create({
        name: name,
        dateCreated: new Date(),
        createdBy: user
    }, function (err, quiz) {
        if (err) return next(err);
        user.update({ $push: { quizzes: quiz } }, { upsert: true }, function (err) {
            if (err) return next(err);
            return next(null, quiz);
        });
    });
};

quizSchema.methods.submitQuestion = function(questionIndex, submission) {
    if (!util.isInt(questionIndex) || questionIndex < 0 || questionIndex >= this.questions.length) {
        return ['Invalid question index.', null, null];
    }

    var question = this.questions[questionIndex];
    return [null, question.submit(submission), question.answer];
};

var Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
