var express = require('express');
var path = require('path');
var defaults = require('./config/settings');
var fs = require('fs');
var extend = require('extend');

extend(true, exports, defaults);

var envConfigFile = process.argv.length > 2 ? process.argv[2] : '../env';
if (fs.existsSync(envConfigFile + '.js')) {
  var envConfig = require(envConfigFile);
  console.log(envConfig);
  extend(true, exports, envConfig);
}

exports.appCfg = function (app, cfg) {

  app.set('port', cfg.server.port);
  app.set('views', path.join(__dirname, './views'));
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('stylus').middleware(path.join(__dirname, 'public')));
  app.use(express.static(path.join(__dirname, 'public')));

  // development only
  if ('development' == app.get('env')) {
    app.use(express.errorHandler());
  }


};

