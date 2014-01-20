
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./config/routes');
var config = require('./config')
var http = require('http');
var path = require('path');
var fs = require('fs');
var extend = require('extend');
if (fs.existsSync('../env.js')) {
  var envConfig = require('../env');
  config = extend(true, envConfig, config);
}
var app = express();

config.appCfg(app, config);
routes.init(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
