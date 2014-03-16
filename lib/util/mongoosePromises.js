// Taken from:
// https://gist.github.com/jasoncrawford/5873309

var mongoose = require('mongoose');
var Q = require('q');
 
// Workaround for the fact that chai-as-promised isn't working with Mongoose promises:
// https://github.com/domenic/chai-as-promised/issues/30
mongoose.Query.prototype.qexec = function () {
    return Q.npost(this, 'exec', arguments);
};
 
mongoose.Model.qcreate = function () {
    return Q.npost(this, 'create', arguments);
};
 
mongoose.Model.prototype.qsave = function () {
    var deferred = Q.defer();
    this.save(function (err, model) {
        if (err) deferred.reject(err);
        else deferred.resolve(model);
    });
    return deferred.promise;
};
 
mongoose.Model.prototype.qreload = function () {
    return this.model(this.constructor.modelName).findById(this.id).qexec();
};
