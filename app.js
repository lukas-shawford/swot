// External libraries
var express = require('express');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');

// Project libraries/middleware
var messages = require('./lib/messages');
var user = require('./lib/middleware/user');

// Routing includes
var register = require('./routes/register');
var login = require('./routes/login');

// Initialize the app and db
var app = express();
var MONGODB_URL = process.env.MONGODB_URL || 'localhost:27017/swot';
mongoose.connect(MONGODB_URL);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use(user);
app.use(messages);
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Routes
app.get('/', login.form);
app.get('/register', register.form);
app.post('/register', register.submit);
app.get('/login', login.form);
app.post('/login', login.submit);
app.get('/logout', login.logout);

// Start the server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
