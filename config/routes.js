var plans = require('../data/plan');

exports.index = function (req, res) {
  plans.getSome(function (some) {
    res.render('index', { title: 'Welcome to travelplanHQ', suggestions:some });
  });
};
var renderForPlan = function (req, res, urlAppend, todo) {
  plans.getPlan(req.params.planID, function (p) {
    var canonUrl = plans.urlFor(p, urlAppend);
    if (canonUrl != req.url) {
      console.log(canonUrl);
      console.log(req.url);
      res.redirect(canonUrl);
      return;
    }
    p.title = 'Travelplan: ' + p.plan.title;
    todo(p);
  });
}
exports.detailEdit = function (req, res) {
  renderForPlan(req, res, 'edit', function (model) { res.render('detail-edit', model); });
};
exports.detailView = function (req, res) {
  renderForPlan(req, res, '', function (model) { res.render('detail-view', model); });
};
exports.detailJson = function (req, res) {
  plans.getPlan(req.params.planID, function (d) { res.json(d); });
};
exports.init = function (app) {
  app.get('/', exports.index);
  app.get('/itinerary/:userName/:planID/[^/]+/', exports.detailView);
  app.get('/itinerary/:userName/:planID/[^/]+/edit', exports.detailEdit);
  app.get('/itinerary/:userName/:planID/[^/]+/plan.json', exports.detailJson);
}
