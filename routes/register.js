var User = require('../lib/user');

exports.form = function (req, res) {
    res.render('register', { title: 'Register', message: req.flash('error') });
};

exports.submit = function (req, res, next) {
    var data = req.body.user;
    User.findByEmail(data.email, function (err, user) {
        if (err) return next(err);

        if (user) {
            req.flash('error', 'An account with that email address already exists.');
            res.redirect('back');
            return;
        }

        if (data.password !== data.password_confirm) {
            req.flash('error', 'The passwords you entered do not match. Please retype the passwords again.');
            res.redirect('back');
            return;
        }

        user = new User({
            email: data.email,
            password: data.password
        });

        return User.createUser(user).done(function (user) {
            req.login(user, function (err) {
                if (err) return next(err);
                res.redirect('/');
            });
        }, function (err) {
            return next(err);
        });
    });
};
