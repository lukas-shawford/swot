var User = require('../lib/user');
var Quiz = require('../lib/quiz');

exports.createForm = function (req, res) {
    res.render('create', { title: 'Create Quiz', message: req.flash('error') });
};

exports.create = function (req, res, next) {
    var data = req.body.quiz;
    var user = req.user;

    if (!user) {
        req.flash('error', 'You need to be logged in to create a quiz.');
        res.redirect('back');
        return;
    }

    Quiz.createQuiz(data.name, data.questions, user, function (err, quiz) {
        if (err) return next(err);
        return next(null, quiz);
    });
};
