/**
 * Authentication/serialization methods for Passport, which handles authentication.
 * http://passportjs.org/
 *
 */

var User = require('../user');

/**
 * Verify callback for passport
 * http://passportjs.org/guide/configure/
 */
exports.authenticate = function(username, password, done) {
    User.findByName(username, function (err, user) {
        if (err) return done(err);
        if (user) {
            user.checkPassword(password, function (err, match) {
                if (err) return done(err);
                if (match) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Invalid username or password.' });
                }
            });
        } else {
            return done(null, false, { message: 'Invalid username or password.' });
        }
    });
};

exports.serializeUser = function(user, done) {
    done(null, user.username);
};

exports.deserializeUser = function(username, done) {
    User.findByName(username, function(err, user) {
        done(err, user);
    });
};
