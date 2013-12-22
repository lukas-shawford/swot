module.exports = function (req, res, next) {
    if (req.user) {
        res.locals.username = req.user.username;
    }
    next();
};
