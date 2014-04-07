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

            it('should accept the submission if it matches the correct answer', function () {
                var question = new FillInQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    answer: 'Bismarck',
                    alternativeAnswers: []
                });

                expect(question.submit("Bismarck")).to.deep.equal({
                    success: true,
                    isCorrect: true
                });
            });

            it('should reject the submission and return the correct answer if the submission does not match the answer', function () {
                var question = new FillInQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    answer: 'Bismarck',
                    alternativeAnswers: []
                });

                var result = question.submit("Pierre");

                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.false;
                expect(result.correctAnswer).to.equal("Bismarck");
                expect(result.alternativeAnswers).to.be.empty;
            });

            it('should accept a submission if it matches one of the alternative answers', function () {
                var question = new FillInQuestion({
                    questionHtml: 'In the U.S., Class A airspace begins at what altitude?',
                    answer: '18,000 feet',
                    ignoreCase: true,
                    alternativeAnswers: [
                        '18000 feet',
                        '18,000 ft',
                        '18,000ft',
                        '18000',
                        '18,000'
                    ]
                });

                expect(question.submit('18000')).to.deep.equal({
                    success: true,
                    isCorrect: true
                });
            });

            it('should reject a submission if it does not match any of the alternative answers, and return the correct answer and all alternative answers', function () {
                var question = new FillInQuestion({
                    questionHtml: 'In the U.S., Class A airspace begins at what altitude?',
                    answer: '18,000 feet',
                    ignoreCase: true,
                    alternativeAnswers: [
                        '18000 feet',
                        '18,000 ft',
                        '18,000ft',
                        '18000',
                        '18,000'
                    ]
                });

                var result = question.submit('24,000 feet');

                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.false;
                expect(result.correctAnswer).to.equal('18,000 feet');
                expect(result.alternativeAnswers).to.include.members([
                    '18000 feet',
                    '18,000 ft',
                    '18,000ft',
                    '18000',
                    '18,000'
                ]);
            });

            it('should accept a submission if the answer does not match capitalization, but the ignoreCase setting is set to true', function () {
                var question = new FillInQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    answer: 'Bismarck',
                    ignoreCase: true
                });

                expect(question.submit("bisMARCK")).to.deep.equal({
                    success: true,
                    isCorrect: true
                });
            });

            it('should reject a submission if the answer does not match capitalization, and the ignoreCase setting is set to false', function () {
                var question = new FillInQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    answer: 'Bismarck',
                    ignoreCase: false,
                    alternativeAnswers: []
                });

                var result = question.submit('bisMARCK');

                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.false;
                expect(result.correctAnswer).to.equal('Bismarck');
                expect(result.alternativeAnswers).to.be.empty;
            });

            it('should accept the submission if it matches one of the alternative answers with different ' +
                'casing, but the ignoreCase setting is set to true', function () {

                var question = new FillInQuestion({
                    questionHtml: 'In the U.S., Class A airspace begins at what altitude?',
                    answer: '18,000 feet',
                    ignoreCase: true,
                    alternativeAnswers: [
                        '18000 feet',
                        '18,000 ft',
                        '18,000ft',
                        '18000',
                        '18,000'
                    ]
                });

                expect(question.submit('18,000 FT')).to.deep.equal({
                    success: true,
                    isCorrect: true
                });
            });

            it('should reject the submission if it matches one of the alternative answers with different ' +
                'casing, but the ignoreCase setting is set to false', function () {

                var question = new FillInQuestion({
                    questionHtml: 'In the U.S., Class A airspace begins at what altitude?',
                    answer: '18,000 feet',
                    ignoreCase: false,
                    alternativeAnswers: [
                        '18000 feet',
                        '18,000 ft',
                        '18,000ft',
                        '18000',
                        '18,000'
                    ]
                });

                var result = question.submit('18,000 FT');

                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.false;
                expect(result.correctAnswer).to.equal('18,000 feet');
                expect(result.alternativeAnswers).to.include.members([
                    '18000 feet',
                    '18,000 ft',
                    '18,000ft',
                    '18000',
                    '18,000'
                ]);
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
