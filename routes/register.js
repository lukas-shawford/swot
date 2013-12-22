var User = require('../lib/user');

exports.form = function (req, res) {
    res.render('register', { title: 'Register', message: req.flash('error') });
};

exports.submit = function (req, res, next) {
    var data = req.body.user;
    User.findByName(data.username, function (err, user) {
        if (err) return next(err);

        if (user) {
            req.flash('error', 'Sorry, that username is not available.');
            res.redirect('back');
            return;
        }

        if (data.password !== data.password_confirm) {
            req.flash('error', 'The passwords you entered do not match. Please retype the passwords again.');
            res.redirect('back');
            return;
        }

        user = new User({
            username: data.username,
            email: data.email,
            password: data.password
        });

        User.createUser(user, function (err, user) {
            if (err) return next(err);
            req.login(user, function (err) {
                if (err) return next(err);
                res.redirect('/');
            });
        });
    });
};
