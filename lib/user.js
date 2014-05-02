var _ = require('underscore');
var mongoose = require('mongoose');         // http://mongoosejs.com/docs/guide.html
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');      // https://npmjs.org/package/bcrypt-nodejs
var Quiz = require('./quiz');

var ObjectId = mongoose.Types.ObjectId;

var userSchema = new mongoose.Schema({
    email: String,
    password: String,
    quizzes: [{ type: Schema.Types.ObjectId, ref: 'Quiz' }],
    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }]
});

userSchema.statics.createUser = function (user, next) {
    var self = this;
    var email = user.email;
    var unencryptedPassword = user.password;

    this.count({ email: email }, function (err, count) {
        if (err) return next(err);
        if (count > 0) {
            return next(new Error('An account with that email already exists.'));
        }

        self.hashPassword(unencryptedPassword, function (err, password) {
            if (err) return next(err);
            self.create({
                email: email,
                password: password
            }, function (err, user) {
                if (err) return next(err);
                return next(null, user);
            });
        });
    });
};

userSchema.statics.findByEmail = function (email, next) {
    this.findOne({ email: email }, function (err, user) {
        if (err) return next(err);
        return next(null, user);
    })
};

userSchema.statics.hashPassword = function (unencryptedPassword, next) {
    bcrypt.hash(unencryptedPassword, null, null, function (err, hash) {
        return next(err, hash);
    });
};

userSchema.methods.checkPassword = function (password, next) {
    bcrypt.compare(password, this.password, function (err, match) {
        if (err) return next(err);
        return next(null, match);
    });
};

userSchema.methods.ownsQuiz = function (quiz) {
    // Validate that the given quiz is owned by the user
    var quizId;
    switch (quiz.constructor.name) {
        case 'model':
            quizId = quiz._id;
            break;
        case 'String':
            quizId = ObjectId(quiz);
            break;
        case 'ObjectID':
            quizId = quiz;
            break;
        default: throw new Error("Argument must be either a quiz model or an ID.");
    }

    return (undefined !== _.find(this.quizzes, function (id) { return id.equals(quizId) }));
};

var User = mongoose.model('User', userSchema);

module.exports = User;
