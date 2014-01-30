var restrict = require('../../lib/middleware/restrict');
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.use(sinonChai);
var expect = chai.expect;
var should = chai.should;

describe('restrict', function () {
    it('should redirect unauthenticated requests to the specified redirect URL', function () {
        // Arrange
        var req = {
            isAuthenticated: function () { return false; },
            url: '/restricted/url'
        };
        var res = { redirect: sinon.spy() };
        var next = sinon.spy();
        var options = { redirectTo: '/login' };

        // Act
        restrict(options)(req, res, next);

        // Assert
        expect(next).to.not.have.been.called;
        expect(res.redirect).to.have.been.calledWith('/login');
    });

    it('should not redirect authenticated users', function () {
        // Arrange
        var req = {
            isAuthenticated: function () { return true; },
            url: '/restricted/url'
        };
        var res = { redirect: sinon.spy() };
        var next = sinon.spy();

        // Act
        restrict()(req, res, next);

        // Assert
        expect(next).to.have.been.called;
        expect(res.redirect).to.not.have.been.called;
    });

    it('should not redirect unauthenticated users if the requested URL is one of the allowedRoutes', function () {
        // Arrange
        var req = {
            isAuthenticated: function () { return false; },
            url: '/allowed/url'
        };
        var res = { redirect: sinon.spy() };
        var next = sinon.spy();
        var options = { allowedRoutes: ['/allowed/url'] };

        // Act
        restrict(options)(req, res, next);

        // Assert
        expect(next).to.have.been.called;
        expect(res.redirect).to.not.have.been.called;
    });
});