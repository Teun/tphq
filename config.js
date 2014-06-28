/*jshint laxcomma: true*/
var express = require('express');
var passport = require('passport');
var mongoStore = require('connect-mongo')(express);
var flash = require('connect-flash');
var path = require('path');
var defaults = require('./config/settings');
var fs = require('fs');
var extend = require('extend');
var helpers = require('view-helpers');

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
  app.use(helpers('tphq'));
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());

  // cookieParser should be above session
  app.use(express.cookieParser());
  // express/mongo session storage
  app.use(express.session({
    secret: cfg.data.userStore.secret,
    store: new mongoStore({
      url: cfg.data.userStore.conn,
      collection: 'sessions'
    })
  }));

  // connect flash for flash messages
  app.use(flash());

  // use passport session
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(app.router);
  app.use(require('stylus').middleware(path.join(__dirname, 'public')));
  app.use(express.static(path.join(__dirname, 'public')));

  // development only
  if ('development' == app.get('env')) {
    app.use(express.errorHandler());
  }


};

var mongoose = require('mongoose')
  , LocalStrategy = require('passport-local').Strategy
  //, TwitterStrategy = require('passport-twitter').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  //, GitHubStrategy = require('passport-github').Strategy
  //, GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
  , User = mongoose.model('User');

exports.passportCfg = function (passport, config) {

  // serialize sessions
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findOne({ _id: id }, function (err, user) {
      done(err, user);
    });
  });

  // use local strategy
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
    function (email, password, done) {
      User.findOne({ email: email }, function (err, user) {
        if (err) { return done(err); }
        if (!user) {
          return done(null, false, { message: 'Unknown user' });
        }
        if (!user.authenticate(password)) {
          return done(null, false, { message: 'Invalid password' });
        }
        return done(null, user);
      });
    }
  ));

  // use facebook strategy
  passport.use(new FacebookStrategy({
    clientID: config.auth.fb.clientID
      , clientSecret: config.auth.fb.clientSecret
      , callbackURL: config.auth.fb.callbackUrl
  },
    function (accessToken, refreshToken, profile, done) {
      User.findOne({ 'facebook.id': profile.id }, function (err, user) {
        if (err) { return done(err); }
        if (!user) {
          console.log(profile);
          user = new User({
            name: profile.displayName
            , username: profile.id
            , provider: 'facebook'
            , facebook: profile._json
          });
          user.save(function (err) {
            if (err) console.log(err);
            return done(err, user);
          });
        }
        else {
          return done(err, user);
        }
      });
    }
  ));
};

