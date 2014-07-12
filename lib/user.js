var _ = require('underscore');
var Q = require('q');
var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');      // https://npmjs.org/package/bcrypt-nodejs

var ObjectId = mongoose.Types.ObjectId;

var userSchema = new mongoose.Schema({
    email: String,
    password: String,
    quizzes: [{ type: Schema.Types.ObjectId, ref: 'Quiz' }],
    topics: [{ type: Schema.Types.ObjectId, ref: 'Topic' }]
});

userSchema.statics.createUser = function (user, next) {
    var self = this;
    var email = user.email;
    var unencryptedPassword = user.password;

    return Q(this.count({ email: email }).exec())
        .then(function (count) {
            if (count > 0) {
                throw new Error('An account with that email already exists.');
            }
            var hashPassword = Q.denodeify(self.hashPassword);
            return hashPassword(unencryptedPassword);
        })
        .then(function (password) {
            return self.createQ({
                email: email,
                password: password
            });
        })
        .then(function (user) {
            var QuizService = new require('./quiz/quizService');    // Load at runtime to avoid circular dependency
            return QuizService.createTopic({ name: "General" }, user);
        })
        .then(function (result) {
            return result[1];
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
