var _ = require('underscore');
var mongoose = require('mongoose');
var User = require('../lib/user');
var Quiz = require('../lib/quiz');

var ObjectId = mongoose.Types.ObjectId;

exports.quizzes = function (req, res) {
    // Fetch user's quizzes
    User.findOne({ _id: req.user._id }).populate('quizzes').exec(function (err, user) {
        if (err) throw err;
        res.render('quizzes', {
            quizzes: user.quizzes
        });
    });
};

exports.createForm = function (req, res) {
    res.render('edit', { title: 'Create Quiz', message: req.flash('error') });
};

exports.create = function (req, res, next) {
    var data = req.body;
    delete data._id;

    Quiz.createQuiz(data.name, data.questions, req.user, function (err, quiz) {
        if (err) {
            return res.json({
                success: false,
                message: err.toString()
            });
        }
        res.json({ success: true, id: quiz._id });
    });
};

exports.edit = function (req, res) {
    res.render('edit', {
        title: 'Edit Quiz',
        quizId: req.params.id,
        message: req.flash('error')
    });
};

exports.load = function (req, res, next) {
    Quiz.findOne({ _id: req.query.id }, function (err, quiz) {
        if (err) {
            return res.json({
                success: false,
                message: err.toString()
            });
        }

        if (!quiz) {
            return res.json({
                success: false,
                message: "Cannot find quiz."
            });
        }

        if (!req.user.ownsQuiz(req.query.id)) {
            return res.json({
                success: false,
                message: 'Invalid quiz.'
            });
        }

        res.json({ success: true, quiz: quiz });
    });
};

exports.save = function (req, res, next) {
    var data = req.body;
    var quizId = data._id;
    delete data._id;

    if (!quizId) {
        return res.json({
            success: false,
            message: "Quiz ID is missing."
        });
    }

    // Validate that quiz is owned by user
    if (!req.user.ownsQuiz(quizId)) {
        return res.json({
            success: false,
            message: "Invalid Quiz ID."
        });
    }

    Quiz.update({ _id: quizId }, data, function (err, quiz) {
        if (err) {
            return res.json({
                success: false,
                message: err.toString()
            });
        }
        res.json({ success: true });
    });
};

exports.deleteQuiz = function (req, res, next) {
    var data = req.body;
    var quizId = data._id;

    if (!quizId) {
        return res.json({
            success: false,
            message: "Quiz ID is missing."
        });
    }

    if (!req.user.ownsQuiz(quizId)) {
        return res.json({
            success: false,
            message: 'Invalid quiz.'
        });
    }

    Quiz.remove({ _id: quizId }, function (err) {
        if (err) {
            return res.json({
                success: false,
                message: err.toString()
            });
        }
        return res.json({ success: true });
    });
};
