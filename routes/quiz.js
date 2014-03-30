var _ = require('underscore');
var moment = require('moment');
var mongoose = require('mongoose');
var User = require('../lib/user');
var Quiz = require('../lib/quiz');
var Question = require('../lib/question').Question;
var FillInQuestion = require('../lib/questions/fillIn').FillInQuestion;
var MultipleChoiceQuestion = require('../lib/questions/multipleChoice').MultipleChoiceQuestion;

var ObjectId = mongoose.Types.ObjectId;

exports.quizzes = function (req, res) {
    // Fetch user's quizzes
    User.findOne({ _id: req.user._id }).populate('quizzes').exec(function (err, user) {
        if (err) {
            req.flash('error', 'An error occurred loading the quizzes.');
            user.quizzes = [];
        }

        // Convert dates to readable form
        var quizzes = _.map(user.quizzes, function (quiz) {
            var quiz = quiz.toObject();
            quiz.dateCreated = moment(quiz.dateCreated).format('MMMM YYYY');
            return quiz;
        });

        res.render('quizzes', {
            title: 'My Quizzes',
            quizzes: quizzes
        });
    });
};

exports.quiz = function (req, res) {
    Quiz.findOne({ _id: req.params.id }, function (err, quiz) {
        if (err) {
            req.flash('error', 'Failed to load quiz.');
            res.redirect('back');
            return;
        }

        res.render('quiz', {
            title: quiz.name,
            quizId: req.params.id,
            message: req.flash('error')
        });
    });
};

exports.questions = function(req, res, next) {
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

        // Load the questions only (not the answers)
        var questions = _.map(quiz.questions, function(question) {
            switch (question.__t) {
                case 'FillInQuestion':
                    return {
                        type: 'FillInQuestion',
                        questionHtml: question.questionHtml
                    };
                case 'MultipleChoiceQuestion':
                    return {
                        type: 'MultipleChoiceQuestion',
                        questionHtml: question.questionHtml,
                        choices: question.choices
                    };
            }
        });

        res.json({ success: true, questions: questions });
    });
};

exports.submitQuestion = function(req, res, next) {
    var data = req.body;
    var quizId = data._id;
    var questionIndex = data.currentQuestionIndex;
    var submission = data.submission;

    if (!quizId) {
        return res.json({
            success: false,
            message: "Quiz ID is missing."
        });
    }

    var error = function(msg) {
        return res.json({
            success: false,
            message: msg
        });
    };

    Quiz.findOne({ _id: quizId }, function(err, quiz) {
        if (err) { return error(err.toString()); }
        if (!quiz) { return error('Failed to load quiz'); }

        return res.json(quiz.submitQuestion(questionIndex, submission));
    });
};

exports.createForm = function (req, res) {
    res.render('edit', { title: 'Create Quiz', message: req.flash('error') });
};

exports.create = function (req, res, next) {
    var data = req.body;
    delete data._id;
    if (!data.name) { data.name = "New Quiz"; }

    Quiz.createQuiz(data.name, req.user, function (err, quiz) {
        if (err) {
            return res.json({
                success: false,
                message: err.toString()
            });
        }

        updateQuiz(quiz, req, res, true);
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

        quiz.questions = _.map(quiz.questions, function (question) {
            question.type = question.__t;
            delete question.__t;
            return question;
        });

        res.json({ success: true, quiz: quiz });
    });
};

exports.save = function (req, res, next) {
    if (!req.body.quiz._id) {
        return res.json({
            success: false,
            message: "Quiz ID is missing."
        });
    }

    // Validate that quiz is owned by user
    if (!req.user.ownsQuiz(req.body.quiz._id)) {
        return res.json({
            success: false,
            message: "Invalid Quiz ID."
        });
    }

    Quiz.findOne({ _id: req.body.quiz._id }, function (err, quiz) {
        if (err) {
            return res.json({
                success: false,
                message: err.toString()
            });
        }

        updateQuiz(quiz, req, res);
    });
};

function updateQuiz(quiz, req, res, includeId) {
    // Update quiz properties
    quiz.name = req.body.quiz.name || "New Quiz";

    // Empty out the question list - embedded document arrays need to be saved using push()
    quiz.questions = [];

    // Save the questions
    var allValid = true;
    var message = null;
    _.each(req.body.quiz.questions, function (q, index) {
        
        var question;
        switch (q.type) {
            case 'FillInQuestion':
                question = new FillInQuestion(q);
                break;
            case 'MultipleChoiceQuestion':
                question = new MultipleChoiceQuestion(q);
                break;
            default:
                allValid = false;
                message = "Unrecognized question type \"" + q.type + "\" for question " + (index + 1) + ".";
        }

        quiz.questions.push(question);
    });

    if (!allValid) {
        return res.json({
            success: false,
            message: message
        });
    }

    // Save the quiz
    quiz.save(function (err) {
        if (err) {
            return res.json({
                success: false,
                message: err.toString()
            });
        }

        var response = { success: true };
        if (includeId) { response.id = quiz._id; }
        res.json(response);
    });
}

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

exports.exportJson = function (req, res, next) {

    // TODO: Error handling / validation is very similar - refactor shared logic.

    // TODO: Error handling should redirect to an error page instead of sending a JSON error response.

    Quiz.findOne({ _id: req.query.id }).lean().exec(function (err, quiz) {
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

        // Remove question IDs
        var questions = _.map(quiz.questions, function (question) {
            delete question._id;
            return question;
        });

        // Serve a JSON file containing the questions.
        res.header('content-type','text/json'); 
        res.header('content-disposition', 'attachment; filename=' + quiz.name + '.json');
        res.end(JSON.stringify(questions, null, 4));
    });
};
