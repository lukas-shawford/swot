var util = require('util');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function AbstractQuestionSchema() {
    Schema.apply(this, arguments);
}
util.inherits(AbstractQuestionSchema, Schema);

var QuestionSchema = new AbstractQuestionSchema({
    questionHtml: String,
    supplementalInfoHtml: String
});

QuestionSchema.methods.submit = function(submission) {
    // Call the appropriate 'submit' method based on the question type.
    //
    // This is all pretty ugly. Either Mongoose has terrible support for polymorphic schemas, or
    // I'm just doing it wrong... For now, this works out ok, but I should really find a better way.
    //
    // Resources for whenever I get around to researching/fixing this again:
    // 
    // Pull request where discriminator mapping (i.e., schema inheritance) was originally introduced:
    // https://github.com/LearnBoost/mongoose/pull/1647
    //
    // mongoose-schema-extend, a plugin for Mongoose that implements schema inheritance. This came
    // before Mongoose officially implemented schema inheritance. I'm not using this, but it may be
    // useful to look into as an alternative:
    // https://github.com/briankircho/mongoose-schema-extend
    //
    // Useful blog post that demonstrates how to do model inheritance with mongoose:
    // http://www.laplacesdemon.com/2014/02/19/model-inheritance-node-js-mongoose/
    //
    // Another potentially useful blog post (which predates discriminator mapping support in
    // Mongoose, and I never ended up going this route, but I found parts of it useful anyway):
    // http://blog.mstaessen.be/2013/07/29/modeling-inheritance-in-mongoose/

    var FillInQuestionSchema = require('./questions/fillIn').FillInQuestionSchema;
    var MultipleChoiceQuestionSchema = require('./questions/multipleChoice').MultipleChoiceQuestionSchema;

    var questionType = this['__t'];
    var result;
    switch(questionType) {
        case 'FillInQuestion':
            result = FillInQuestionSchema.methods.submit.call(this, submission);
            break;
        case 'MultipleChoiceQuestion':
            result = MultipleChoiceQuestionSchema.methods.submit.call(this, submission);
            break;
        default:
            throw new Error('Unrecognized question type: ' + questionType);
    }

    result.supplementalInfoHtml = this.supplementalInfoHtml;
    return result;
};

var Question = mongoose.model('Question', QuestionSchema);

exports.Question = Question;
exports.AbstractQuestionSchema = AbstractQuestionSchema;
exports.QuestionSchema = QuestionSchema;
