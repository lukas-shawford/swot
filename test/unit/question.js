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

describe('question', function () {

    describe('Fill In Questions', function () {
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
