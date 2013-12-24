var mongoose = require('mongoose');         // http://mongoosejs.com/docs/guide.html
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');      // https://npmjs.org/package/bcrypt-nodejs
var Quiz = require('./quiz');

var userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    quizzes: [{ type: Schema.Types.ObjectId, ref: 'Quiz' }]
});

userSchema.statics.createUser = function (user, next) {
    var self = this;
    var username = user.username;
    var email = user.email;
    var unencryptedPassword = user.password;

    this.count({ username: username }, function (err, count) {
        if (err) return next(err);
        if (count > 0) {
            return next(new Error('Username not available'));
        }

        self.hashPassword(unencryptedPassword, function (err, password) {
            if (err) return next(err);
            self.create({
                username: username,
                email: email,
                password: password
            }, function (err, user) {
                if (err) return next(err);
                return next(null, user);
            });
        });
    });
};

userSchema.statics.findByName = function (name, next) {
    this.findOne({ username: name }, function (err, user) {
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

var User = mongoose.model('User', userSchema);

module.exports = User;
