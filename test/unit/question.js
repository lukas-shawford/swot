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
        describe('validate', function () {

            it('should validate successfully for a proper fill-in question', function () {
                var question = new FillInQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    answer: 'Bismarck'
                });

                question.validate(function (err) {
                    expect(err).to.not.exist;
                });
            });
            
            it('should return error if answer is missing', function () {
                var question = new FillInQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>'
                });

                question.validate(function (err) {
                    expect(err).to.exist;
                    expect(err.errors.answer).to.exist;
                });
            });
            
        });

        describe('submit', function () {

            it('should return true if the submission matches the correct answer', function () {
                var question = new FillInQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    answer: 'Bismarck'
                });

                expect(question.submit("Bismarck")).to.be.true;
            });

            it('should return false if the submission does not match the correct answer', function () {
                var question = new FillInQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    answer: 'Bismarck'
                });

                expect(question.submit("Pierre")).to.be.false;
            });

        });
    });

    describe('Multiple Choice Questions', function () {
        describe('validate', function () {

            it('should validate successfully for a proper multiple choice question', function () {
                var question = new MultipleChoiceQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    choices: ['Pierre', 'Bismarck', 'Des Moines', 'Helena'],
                    correctAnswerIndex: 1
                });

                question.validate(function (err) {
                    expect(err).to.not.exist;
                });
            });
            
            it('should return error if correctChoiceIndex is larger than the number of choices', function () {
                var question = new MultipleChoiceQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    choices: ['Pierre', 'Bismarck', 'Des Moines', 'Helena'],
                    correctAnswerIndex: 4
                });

                question.validate(function (err) {
                    expect(err).to.exist;
                    expect(err.errors.correctAnswerIndex).to.exist;
                });
            });

            it('should return error if there are no choices', function () {
                var question = new MultipleChoiceQuestion({
                    questionHtml: '<p>Uh oh, this question has no choices...</p>',
                    choices: [],
                    correctAnswerIndex: 0
                });

                question.validate(function (err) {
                    expect(err).to.exist;
                    expect(err.errors.choices).to.exist;
                });
            });

        });

        describe('submit', function () {

            it('should return true if the submission matches the correct answer index', function () {
                var question = new MultipleChoiceQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    choices: ['Pierre', 'Bismarck', 'Des Moines', 'Helena'],
                    correctAnswerIndex: 1
                });

                expect(question.submit(1)).to.be.true;
            });

            it('should return false if the submission does not match the correct answer index', function () {
                var question = new MultipleChoiceQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    choices: ['Pierre', 'Bismarck', 'Des Moines', 'Helena'],
                    correctAnswerIndex: 1
                });

                expect(question.submit(2)).to.be.false;
            });

        });
    });
});
