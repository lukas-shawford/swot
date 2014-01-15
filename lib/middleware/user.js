module.exports = function (req, res, next) {
    if (req.user) {
        res.locals.email = req.user.email;
    }
    next();
};
