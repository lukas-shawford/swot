var expect = require('chai').expect;
var mongoose = require('mongoose');
var User = require('../lib/user');

var MONGODB_URL = process.env.MONGODB_TEST_URL || 'localhost:27017/swot_test';

describe('userDb', function () {

    before(function (done) {
        mongoose.connect(MONGODB_URL);
        User.remove({}, done);
    });

    after(function () {
        mongoose.connection.close();
    });

    describe('createUser', function () {

        it('should be able to find user after creating one.', function (done) {
            User.createUser({
                username: 'Tobi',
                password: 'i am secret'
            }, function (err, user) {
                if (err) throw err;
                User.findByName('Tobi', function (err, user) {
                    expect(err).to.be.null;
                    expect(user).to.exist;
                    done();
                });
            });
        });

        it('should not be able to create multiple users with same name.', function (done) {
            User.createUser({
                username: 'Tobi',
                password: 'i am secret'
            }, function (err, user) {
                expect(err).to.not.be.null;
                expect(err.message).to.equal('Username not available');
                expect(user).to.be.undefined;
                done();
            });
        });
    });

    describe('findByName', function () {

        before(function (done) {
            User.createUser({
                username: 'bob',
                password: 'something'
            }, done);
        });

        it('should be able to find user with matching username', function (done) {
            User.findByName('bob', function (err, user) {
                expect(err).to.be.null;
                expect(user).to.exist;
                expect(user.username).to.equal('bob');
                done();
            });
        });

        it("should not return anyone for a username that doesn't correspond to an actual user", function (done) {
            User.findByName('fred', function (err, user) {
                expect(err).to.be.null;
                expect(user).to.not.exist;
                done();
            });
        });
    });

    describe('checkPassword', function () {

        var albert;

        before(function (done) {
            User.createUser({
                username: 'albert',
                password: 'letmein'
            }, function (err, user) {
                if (err) throw err;
                albert = user;
                done();
            });
        });

        it("should return true if passwords match", function (done) {
            albert.checkPassword('letmein', function (err, match) {
                expect(err).to.be.null;
                expect(match).to.be.true;
                done();
            });
        });

        it("should return false if passwords do not match", function (done) {
            albert.checkPassword('iforgot', function (err, match) {
                expect(err).to.be.null;
                expect(match).to.be.false;
                done();
            });
        });
    });
});
