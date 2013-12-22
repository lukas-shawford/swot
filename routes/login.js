var User = require('../lib/user');

exports.form = function (req, res) {
    res.render('login', { title: 'Login' });
};

exports.submit = function (req, res, next) {
    var fail = function () {
        res.error('The username or password you entered is incorrect.');
        res.redirect('back');
    };

    var data = req.body.user;
    User.findByName(data.name, function (err, user) {
        if (err) return next(err);
        if (user) {
            user.checkPassword(data.pass, function (err, match) {
                if (err) return next(err);
                if (match) {
                    req.session.uid = user._id;
                    res.redirect('/');
                } else {
                    fail();
                }
            });
        } else {
            fail();
        }
    });
};

exports.logout = function (req, res) {
    req.session.destroy(function (err) {
        if (err) throw err;
        res.redirect('/');
    });
};
