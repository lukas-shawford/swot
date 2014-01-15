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
exports.authenticate = function(email, password, done) {
    User.findByEmail(email, function (err, user) {
        if (err) return done(err);
        if (user) {
            user.checkPassword(password, function (err, match) {
                if (err) return done(err);
                if (match) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Invalid email or password.' });
                }
            });
        } else {
            return done(null, false, { message: 'Invalid email or password.' });
        }
    });
};

exports.serializeUser = function(user, done) {
    done(null, user.email);
};

exports.deserializeUser = function(email, done) {
    User.findByEmail(email, function(err, user) {
        done(err, user);
    });
};
