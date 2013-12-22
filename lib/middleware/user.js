var User = require('../user');
var ObjectId = require('mongoose').Types.ObjectId;

module.exports = function (req, res, next) {
    var uid = req.session.uid;
    if (!uid) return next();
    User.findOne({ _id: new ObjectId(uid) }, function (err, user) {
        if (err) return next(err);
        req.user = res.locals.user = user;
        next();
    });
};
