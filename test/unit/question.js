var expect = require('chai').expect;
var Question = require('../../lib/question').Question;
var FillInQuestion = require('../../lib/questions/fillIn').FillInQuestion;

describe('question', function () {

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
