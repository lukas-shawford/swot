/**
 * Ensure that a user is logged in before proceeding to the next route.
 *
 * This middleware builds on top of Passport to provide a simple form of authorization. It ensures that a user is
 * logged in before proceeding to the next route middleware. This should be mounted after Passport (and probably
 * after the middleware for serving static assets).
 *
 * Options:
 *   - 'redirectTo':    The URL to redirect to if the request is unauthenticated. Default: '/login'.
 *   - 'allowedRoutes': An array containing the routes that should be allowed to all users, regardless of whether
 *          or not they are authenticated. For example, it may be a good idea to include the home page, as well
 *          as the login and register pages. Default: ['/', '/login'].
 *
 * Usage:
 *   var restrict = require('./lib/middleware/restrict');
 *   app.use(restrict({
 *     allowedRoutes: ['/', '/login', '/register'],
 *     redirectTo: '/login'
 *   }));
 * 
 * @param {Object} options
 * @return {Function}
 * @api public
 */

module.exports = function restrict (options) {
    options = options || {};
    
    var redirectTo = options.redirectTo || '/login';
    var allowedRoutes = options.allowedRoutes || ['/', '/login'];

    return function (req, res, next) {
        if (!req.isAuthenticated()) {
            if (allowedRoutes.indexOf(req.url) !== -1) {
                return next();
            } else {
                return res.redirect(redirectTo);
            }

        } else {
            return next();
        }
    };
};
