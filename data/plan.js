var fs = require('fs');
var folder = __dirname + '/plans/';

exports.existsPlan = function (id) {
  return true;
}
exports.getPlan = function (id, success) {
  fs.readFile(folder + id + '.json', 'utf8', function (err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }
    success(JSON.parse(data));
  });
  exports.urlFor = function (plan, append) {
    var toLowerize = function (s) {
      var result = s.toLowerCase();
      return result.replace(/[^a-z0-9]+/g, '-');
    }
    var url = "/itinerary/";
    url += toLowerize(plan.author.name) + '/';
    url += plan.id + '/';
    url += toLowerize(plan.plan.title) + '/';
    if(append)url += append;
    return url;
  }
}
exports.getSome = function (success) {
  var res = [];
  exports.getPlan('dw2wtz', function (p) {
    res.push(p);
    exports.getPlan('wy2ore', function (p) {
      res.push(p);
      success(res);
    });
  });
}
