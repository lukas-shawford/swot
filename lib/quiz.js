var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var util = require('./util');
var QuestionSchema = require('./question').QuestionSchema;

/*
 * Quiz Schema
 * ------------------------------------------------------------------------- */

var quizSchema = new mongoose.Schema({
    name: String,
    dateCreated: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject' },
    topic: { type: Schema.Types.ObjectId, ref: 'Topic' },
    
    // Ideally, I would use [QuestionSchema] here, instead of [Schema.Types.Mixed]. However, that
    // results in not saving any fields that are only present in one of the derived question types
    // (FillInQuestionSchema, etc.), but aren't present in the base (QuestionSchema). This may
    // have something to do with it: http://stackoverflow.com/a/16513323/393005
    questions: [Schema.Types.Mixed]
});

quizSchema.statics.createQuiz = function (data, user, next) {
    if (!user) {
        return next(Error('user is required to create a quiz'));
    }

    this.create({
        name: data.name,
        subject: data.subject,
        topic: data.topic,
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
 * Subject / Topic Schemas
 * ------------------------------------------------------------------------- */

// Organizational hierarchy: Quizzes are grouped by Subject, and are then further broken up
// by Topic. (At some point, we can also introduce Subtopics if we need another layer.)

var subjectSchema = new mongoose.Schema({
    name: String,
    dateCreated: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

var topicSchema = new mongoose.Schema({
    name: String,
    dateCreated: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject' }
});

subjectSchema.statics.createSubject = function (data, user) {
    var ret;
    return this.createQ({
        name: data.name || "New Subject",
        dateCreated: new Date(),
        createdBy: user
    }).then(function (subject) {
        ret = subject;
        user.subjects.push(subject);
        return user.saveQ();
    }).then(function () {
        return ret;
    });
};

// TODO: Delete subject - should remove the subject from user.subjects array


/*
 * Models
 * ------------------------------------------------------------------------- */

exports.Quiz = mongoose.model('Quiz', quizSchema);
exports.Subject = mongoose.model('Subject', subjectSchema);
exports.Topic = mongoose.model('Topic', topicSchema);
