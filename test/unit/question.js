var mongoose = require('mongoose');
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var Question = require('../../lib/question').Question;

var FillIn = require('../../lib/questions/fillIn');
var FillInQuestion = FillIn.FillInQuestion;
var FillInQuestionSchema = FillIn.FillInQuestionSchema;

var MultipleChoice = require('../../lib/questions/multipleChoice');
var MultipleChoiceQuestion = MultipleChoice.MultipleChoiceQuestion;
var MultipleChoiceQuestionSchema = MultipleChoice.MultipleChoiceQuestionSchema;

chai.use(sinonChai);
var expect = chai.expect;
var should = chai.should;

var MONGODB_URL = process.env.MONGODB_TEST_URL || 'localhost:27017/swot_test';
chai.Assertion.includeStack = true;

describe('question', function () {

    before(function (done) {
        mongoose.connect(MONGODB_URL);
        done();
    });

    after(function () {
        mongoose.connection.close();
    });

    describe('Fill In Questions', function () {
        describe('submit', function () {

            it('should return true for isCorrect if the submission matches the correct answer', function () {
                var question = new FillInQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    answer: 'Bismarck'
                });

                expect(question.submit("Bismarck")).to.deep.equal({
                    success: true,
                    isCorrect: true
                });
            });

            it('should return false and the correct answer if the submission does not match', function () {
                var question = new FillInQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    answer: 'Bismarck'
                });

                expect(question.submit("Pierre")).to.deep.equal({
                    success: true,
                    isCorrect: false,
                    correctAnswer: "Bismarck"
                });
            });

            it('should respect ignoreCase setting when comparing submissions', function () {
                var question = new FillInQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    answer: 'Bismarck',
                    ignoreCase: true
                });

                expect(question.submit("bisMARCK")).to.deep.equal({
                    success: true,
                    isCorrect: true
                });

                var question2 = new FillInQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    answer: 'Bismarck',
                    ignoreCase: false
                });

                expect(question2.submit("bisMARCK")).to.deep.equal({
                    success: true,
                    isCorrect: false,
                    correctAnswer: 'Bismarck'
                });
            });

        });
    });

    describe('Multiple Choice Questions', function () {
        describe('submit', function () {

            it('should return true for isCorrect if the submission matches the correct answer index', function () {
                var question = new MultipleChoiceQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    choices: ['Pierre', 'Bismarck', 'Des Moines', 'Helena'],
                    correctAnswerIndex: 1
                });

                expect(question.submit(1)).to.deep.equal({
                    success: true,
                    isCorrect: true
                });
            });

            it('should return false and the correct answer index if the submission does not match', function () {
                var question = new MultipleChoiceQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    choices: ['Pierre', 'Bismarck', 'Des Moines', 'Helena'],
                    correctAnswerIndex: 1
                });

                expect(question.submit(2)).to.deep.equal({
                    success: true,
                    isCorrect: false,
                    correctAnswerIndex: 1
                });
            });

        });
    });
});
