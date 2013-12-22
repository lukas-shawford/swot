var User = require('../lib/user');

exports.form = function (req, res) {
    res.render('login', { title: 'Login', message: req.flash('error') });
};

exports.logout = function (req, res) {
    req.session.destroy(function (err) {
        if (err) throw err;
        res.redirect('/');
    });
};
