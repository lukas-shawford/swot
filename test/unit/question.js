var mongoose = require('mongoose');
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var Question = require('../../lib/question').Question;
var QuestionSchema = require('../../lib/question').QuestionSchema;

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


// NOTE: All calls to 'submit' should be made through QuestionSchema (rather than FillInQuestionSchema,
// MultipleChoiceQuestionSchema, etc.).
//
// Example:
// --------
// var question = new FillInQuestion({ ... });
// var result = QuestionSchema.methods.submit.call(question, 'Pierre');
// expect(result.isCorrect).to.be.true;
//
// This simulates how the submit method is actually called from the application. The base 'submit' method in
// QuestionSchema performs processing that is common to all question types (such as including supplementalInfoHtml in
// the response).


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

                var result = QuestionSchema.methods.submit.call(question, "Bismarck");

                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.true;
            });

            it('should reject the submission and return the correct answer if the submission does not match the answer', function () {
                var question = new FillInQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    answer: 'Bismarck',
                    alternativeAnswers: []
                });

                var result = QuestionSchema.methods.submit.call(question, "Pierre");

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

                var result = QuestionSchema.methods.submit.call(question, '18000');

                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.true;
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

                var result = QuestionSchema.methods.submit.call(question, '24,000 feet');

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

                var result = QuestionSchema.methods.submit.call(question, "bisMARCK");

                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.true;
            });

            it('should reject a submission if the answer does not match capitalization, and the ignoreCase setting is set to false', function () {
                var question = new FillInQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    answer: 'Bismarck',
                    ignoreCase: false,
                    alternativeAnswers: []
                });

                var result = QuestionSchema.methods.submit.call(question, 'bisMARCK');

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

                var result = QuestionSchema.methods.submit.call(question, '18,000 FT');

                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.true;
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

                var result = QuestionSchema.methods.submit.call(question, '18,000 FT');

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

                var result = QuestionSchema.methods.submit.call(question, 1);

                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.true;
            });

            it('should return false and the correct answer index if the submission does not match', function () {
                var question = new MultipleChoiceQuestion({
                    questionHtml: '<p>What is the capital of North Dakota?</p>',
                    choices: ['Pierre', 'Bismarck', 'Des Moines', 'Helena'],
                    correctAnswerIndex: 1
                });

                var result = QuestionSchema.methods.submit.call(question, 2);

                expect(result.success).to.be.true;
                expect(result.isCorrect).to.be.false;
                expect(result.correctAnswerIndex).to.equal(1);
            });
        });
    });

    describe('Supplemental Info', function () {
        
        it('should include supplemental info in the submission result for correct submissions', function () {
            var info = '<p>Visit the official portal for North Dakota State Government at <a href="">http://www.nd.gov/</a>.</p>';

            var question = new FillInQuestion({
                questionHtml: '<p>What is the capital of North Dakota?</p>',
                answer: 'Bismarck',
                supplementalInfoHtml: info
            });

            var result = QuestionSchema.methods.submit.call(question, 'Bismarck');
            expect(result.supplementalInfoHtml).to.equal(info);
        });

        it('should include supplemental info in the submission result for wrong submissions', function () {
            var info = '<p>Visit the official portal for North Dakota State Government at <a href="">http://www.nd.gov/</a>.</p>';

            var question = new FillInQuestion({
                questionHtml: '<p>What is the capital of North Dakota?</p>',
                answer: 'Bismarck',
                supplementalInfoHtml: info
            });

            var result = QuestionSchema.methods.submit.call(question, 'Pierre');
            expect(result.supplementalInfoHtml).to.equal(info);
        });
    });
});
