var util = require('../../lib/util');
var expect = require('chai').expect;

describe('util', function () {
    describe('isInt', function () {
        it('should return true for integers', function() {
            for (var i = -5; i <= 5; i++) {
                expect(util.isInt(i)).to.be.true;
            }
        });

        it('should return true for floats that are exact integer values', function () {
            for (var i = -5.0; i <= 5.0; i++) {
                expect(util.isInt(i)).to.be.true;
            }
        });

        it('should return false for floats', function() {
            expect(util.isInt(-1.5)).to.be.false;
            expect(util.isInt(1.5)).to.be.false;
            expect(util.isInt(1E308)).to.be.false;
        });

        it('should return false for strings', function() {
            expect(util.isInt('1')).to.be.false;
            expect(util.isInt('0')).to.be.false;
            expect(util.isInt('-1')).to.be.false;
        });

        it('should return false for an empty string', function () {
            expect(util.isInt('')).to.be.false;
        });

        it('should return false for true/false/null/undefined', function () {
            expect(util.isInt(true)).to.be.false;
            expect(util.isInt(false)).to.be.false;
            expect(util.isInt(null)).to.be.false;
            expect(util.isInt(undefined)).to.be.false;
        });

        it('should return false for arrays/objects/functions', function() {
            expect(util.isInt({})).to.be.false;
            expect(util.isInt([])).to.be.false;
            expect(util.isInt([1])).to.be.false;
            expect(util.isInt(function() {})).to.be.false;
        });
    });
});
