var plans = require('../data/plan');
var request = require('request');

exports.index = function (req, res) {
  plans.getSome(function (some) {
    res.render('index', { model: { title: 'Welcome to travelplanHQ', suggestions: some } });
  });
};
var renderForPlan = function (req, res, urlAppend, todo) {
  plans.getPlan(req.params.planID, function (p) {
    console.log(p);
    var canonUrl = plans.urlFor(p, urlAppend);
    if (canonUrl != req.url) {
      console.log(req.url + ' -> ');
      console.log(canonUrl);
      res.redirect(canonUrl);
      return;
    }
    p.title = 'Travelplan: ' + p.plan.title;
    todo(p);
  });
}
exports.detailEdit = function (req, res) {
  renderForPlan(req, res, 'edit', function (model) {res.render('detail-edit', { model: model});});
};
exports.detailView = function (req, res) {
  renderForPlan(req, res, '', function (model) { res.render('detail-view', { model: model }); });
};
exports.detailJson = function (req, res) {
  plans.getPlan(req.params.planID, function (d) { res.json(d); });
};
exports.updateDetailJson = function (req, res) {
  plans.savePlan(req.params.planID, req.body);
  res.json(true);
};
exports.locationJson = function (req, res) {
  var newUrl = "http://www.tripadvisor.com/TypeAheadJson" + req._parsedUrl.search;
  request(newUrl).pipe(res);
}
exports.init = function (app) {
  app.get('/', exports.index);
  app.get('/itinerary/:userName/:planID/[^/]+/', exports.detailView);
  app.get('/itinerary/:userName/:planID/[^/]+/edit', exports.detailEdit);
  app.get('/itinerary/:userName/:planID/[^/]+/plan.json', exports.detailJson);
  app.post('/itinerary/:userName/:planID/[^/]+/plan.json', exports.updateDetailJson);
  app.get('/location.json', exports.locationJson);
}
