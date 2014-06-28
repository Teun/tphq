
/**
 * Module dependencies.
 */

// Bootstrap models
var fs = require('fs');
var models_path = __dirname + '/models';
fs.readdirSync(models_path).forEach(function (file) {
  require(models_path + '/' + file);
});

var express = require('express');
var routes = require('./config/routes');
var config = require('./config');
var http = require('http');
var path = require('path');
var passport = require('passport');
var mongoose = require('mongoose');
mongoose.connect(config.data.userStore.conn);
var app = express();
var auth = require('./config/middlewares/authorization');

config.passportCfg(passport, config);
config.appCfg(app, config, passport);
routes.init(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
