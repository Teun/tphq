var plans = require('../data/plan');
var request = require('request');
var passport = require('passport');
var mongoose = require('mongoose')
  , User = mongoose.model('User');

exports.index = function (req, res) {
  plans.getSome(function (some) {
    res.render('index', { model: { title: 'Welcome to travelplanHQ', suggestions: some } });
  });
};
var renderForPlan = function (req, res, urlAppend, todo) {
  plans.getPlan(req.params.planID, function (p) {
    //console.log(p);
    var canonUrl = plans.urlFor(p, urlAppend);
    if (canonUrl != req.url) {
      console.log(req.url + ' -> ');
      console.log(canonUrl);
      res.redirect(canonUrl);
      return;
    }
    p.title = 'Travelplan: ' + p.plan.title;
    p.access = plans.getAccessFor(p, req);
    todo(p);
  });
}
exports.detailEdit = function (req, res) {
  renderForPlan(req, res, 'edit', function (model) {res.render('detail-edit', { model: model});});
};
exports.detailView = function (req, res) {
  renderForPlan(req, res, '', function (model) { res.render('detail-view', { model: model }); });
};
exports.detailList = function (req, res) {
  renderForPlan(req, res, 'list', function (model) { res.render('detail-list', { model: model }); });
};
exports.detailJson = function (req, res) {
  plans.getPlan(req.params.planID, function (d) { res.json(d); });
};
exports.updateDetailJson = function (req, res) {
  var noway = function () {
    res.status(403);
    res.send("No way");
    return;
  }
  if (!req.isAuthenticated()) {
    return noway();
  }
  if(!plans.canSave(req.params.planID, req.user)){
    return noway();
  }else{
    plans.savePlan(req.params.planID, req.body, { owner: req.session.passport.user, author: req.user.name });
    res.json(true);
  }

};
exports.locationJson = function (req, res) {
  var newUrl = "http://www.tripadvisor.com/TypeAheadJson" + req._parsedUrl.search;
  request(newUrl).pipe(res);
}
exports.login = function (req, res) {
  res.render('user/login', {
    model: {
      title: 'Login',
      message: req.flash('error')
    }
  });
}
exports.signup = function (req, res) {
  res.render('user/signup', {
    model: {
      title: 'Sign up',
      user: new User()
    }
  });
}

exports.show = function (req, res) {
  User
    .findOne({ _id: req.params['userId'] })
    .exec(function (err, user) {
      if (err) return next(err)
      if (!user) return next(new Error('Failed to load User ' + id))

      res.render('user/show', {
        model: {
          title: user.name,
          user: user
        }
      })
    });
}

exports.create = function (req, res) {
  var newUser = new User(req.body);
  newUser.provider = 'local';

  User
    .findOne({ email: newUser.email })
    .exec(function (err, user) {
      if (err) return next(err)
      if (!user) {
        newUser.save(function (err) {
          if (err) return res.render('users/signup', { errors: err.errors, user: newUser });

          req.logIn(newUser, function (err) {
            if (err) return next(err)
            return res.redirect('/')
          })
        });
      } else {
        return res.render('users/signup', { errors: [{ "type": "email already registered" }], user: newUser })
      }
    });
}


exports.afterLogin = function (req, res) {
  console.log('afterlogin');
  res.redirect('/');
}
exports.logout = function (req, res) {
  req.logout();
  res.redirect('/');
}


exports.init = function (app) {
  app.get('/', exports.index);
  app.get('/itinerary/:userName/:planID/[^/]+/', exports.detailView);
  app.get('/itinerary/:userName/:planID/[^/]+/list', exports.detailList);
  app.get('/itinerary/:userName/:planID/[^/]+/edit', exports.detailEdit);
  app.get('/itinerary/:userName/:planID/[^/]+/plan.json', exports.detailJson);
  app.post('/itinerary/:userName/:planID/[^/]+/plan.json', exports.updateDetailJson);
  app.get('/location.json', exports.locationJson);


  app.get('/login', exports.login);
  app.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: 'Invalid email or password.' }), exports.afterLogin);
  app.get('/signup', exports.signup);
  app.post('/signup', exports.create);
  app.get('/users/:userId', exports.show);
  app.get('/logout', exports.logout)
  app.get('/auth/facebook', passport.authenticate('facebook'));
	app.get('/auth/facebook/callback', 
	  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login' }));
}
