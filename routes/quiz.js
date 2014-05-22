var util = require('util');
var _ = require('underscore');
var Q = require('q');
var moment = require('moment');
var mongoose = require('mongoose-q')();
var User = require('../lib/user');
var Quiz = require('../lib/quiz').Quiz;
var QuizService = require('../lib/quiz/quizService');
var Topic = require('../lib/quiz').Topic;
var Question = require('../lib/question').Question;
var FillInQuestion = require('../lib/questions/fillIn').FillInQuestion;
var MultipleChoiceQuestion = require('../lib/questions/multipleChoice').MultipleChoiceQuestion;

var ObjectId = mongoose.Types.ObjectId;

exports.quizzes = function (req, res) {
    // Fetch user's quizzes and topics
    var topics = [];
    Q(User.findById(req.user._id).lean().exec())
        .then(function (user) {
            return QuizService.getQuizzesAndTopics(user);
        })
        .then(function (result) {
            // TO DO: Strip off anything we're not interested in. (e.g., we're sending the entirety
            // of each quiz, including all the questions, right now - even though we're only displaying
            // the name).
            topics = result;
        })
        .catch(function (err) {
            console.error(err);
            topics = [];
            res.locals.message = {
                type: 'error',
                message: 'An error occurred loading the quizzes.'
            };
        })
        .finally(function () {
            res.render('quizzes', {
                title: 'My Quizzes',
                topics: topics
            });
        });
};

/*
exports.quizzes = function (req, res) {
    // Fetch user's quizzes and topics
    var quizzes = [];
    var topics = [];
    User.findOne({ _id: req.user._id }).lean().populate('quizzes topics').execQ()
        .then(function (user) {

            quizzes = _.map(user.quizzes, function (quiz) {
                quiz.numQuestions = quiz.questions.length;

                // Convert dates to readable form
                quiz.dateCreated = moment(quiz.dateCreated).format('MMMM YYYY');

                // Keep only the properties we care about to lessen the amount of data to transmit.
                return _.pick(quiz, '_id', 'name', 'dateCreated', 'numQuestions', 'topic');
            });

            // Convert flat list of topics into a nested structure
            topics = User.getTopicsHierarchy();

            // Get the topics for each subject
            return Q.all(_.map(user.subjects, function (subject) {
                return Topic.findQ({ subject: subject }).then(function (topics) {
                    subject.topics = _.map(topics, function (topic) {
                        return _.pick(topic, '_id', 'name');
                    });
                    return subject;
                });
            }))
            .then(function (results) {
                subjects = _.map(results, function (subject) {
                    return _.pick(subject, '_id', 'name', 'topics');
                })
            });
        })
        .fail(function (err) {
            console.error(err);
            quizzes = [];
            subjects = [];
            res.locals.message = {
                type: 'error',
                message: 'An error occurred loading the quizzes.'
            };
        })
        .fin(function () {
            res.render('quizzes', {
                title: 'My Quizzes',
                quizzes: quizzes,
                subjects: subjects
            });
        });
};
*/

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

exports.create = function (req, res) {
    var data = req.body;
    delete data._id;
    if (!data.name) { data.name = "New Quiz"; }

    Quiz.createQuiz({ name: data.name }, req.user)
        .then(function (quiz) {
            updateQuiz(quiz, req, res, true);
        })
        .catch(function (err) {
            console.error(err);
            return res.json({
                success: false,
                message: "An error occurred creating the quiz"
            });
        })
        .done();
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

exports.addSubject = function (req, res, next) {
    Subject.createSubject(req.body, req.user)
        .then(function (subject) {
            if (!subject) { throw new Error("Failed to create new subject"); }
            res.location('/subjects/' + subject._id);
            return res.json(201, subject.toObject());
        })
        .fail(function (err) {
            console.error(err);
            return res.json(500, { error: "An error occurred while creating the subject." });
        });
};

exports.updateSubject = function (req, res, next) {
    // TODO: Validate owner
    Subject.findByIdAndUpdateQ(req.params.id, req.body)
        .then(function (subject) {
            if (subject) { return res.send(204); }
            else { return res.send(404); }
        })
        .fail(function (err) {
            console.error(err);
            return res.json(500, { error: "An error occurred while updating the subject." });
        });
};

exports.deleteSubject = function (req, res, next) {
    // TODO: Validate owner
};

exports.updateTopic = function (req, res, next) {
    // TODO: Validate owner
    Topic.findByIdAndUpdateQ(req.params.id, req.body)
        .then(function (topic) {
            if (topic) { return res.send(204); }
            else { res.send(404); }
        })
        .fail(function (err) {
            console.error(err);
            return res.json(500, { error: "An error occurred while updating the topic." });
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
