var User = require('../lib/user');

exports.form = function (req, res) {
    res.render('register', { title: 'Register' });
};

exports.submit = function (req, res, next) {
    var data = req.body.user;
    User.findByName(data.name, function (err, user) {
        if (err) return next(err);

        if (user) {
            res.error("Username already taken!");
            res.redirect('back');
        } else {
            user = new User({
                username: data.name,
                password: data.pass
            });

            User.createUser(user, function (err, user) {
                if (err) return next(err);
                req.session.uid = user._id;
                res.redirect('/');
            });
        }
    });
};
