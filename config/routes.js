var plans = require('../data/plan');

exports.index = function(req, res){
  res.render('index', { title: 'Welcome to travelplanHQ' });
};
exports.detailView = function (req, res) {
  plans.getPlan(req.params.planID, function (p) {
    var canonUrl = plans.urlFor(p);
    if (canonUrl != req.url) {
      console.log(canonUrl);
      console.log(req.url);
      res.redirect(canonUrl);
      return;
    }
    p.title = 'Travelplan: ' + p.plan.title;
    res.render('detail-view', p);
  });
};
exports.detailJson = function (req, res) {
  plans.getPlan(req.params.planID, function (d) { res.json(d); });
};
exports.init = function (app) {
  app.get('/', exports.index);
  app.get('/plans/:userName/:planID/[^/]+/', exports.detailView);
  app.get('/plans/:userName/:planID/[^/]+/plan.json', exports.detailJson);
}
