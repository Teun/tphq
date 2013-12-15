var plans = require('../data/plan');
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Welcome to travelplanHQ' });
};
exports.detailView = function (req, res) {
  plans.getPlan(req.params.planID, function (p) {
    p.title = 'Travelplan: ' + p.plan.title;
    res.render('detail-view', p);
  });
};
exports.detailJson = function (req, res) {
  plans.getPlan(req.params.planID, function (d) { res.json(d); });
};
