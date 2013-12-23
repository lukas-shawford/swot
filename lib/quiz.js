var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var quizSchema = new mongoose.Schema({
    name: String,
    dateCreated: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    questions: [{
        questionText: String,
        answer: String
    }]
});

quizSchema.statics.createQuiz = function (name, questions, user, next) {
    if (!user) {
        return next(Error('user is required to create a quiz'));
    }

    this.create({
        name: name,
        questions: questions || [],
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

var Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
