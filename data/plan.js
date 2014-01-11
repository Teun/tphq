var async = require('async');
var fs = require('fs');
var folder = __dirname + '/plans/';

var allPlans = null;
var loadPlans = function (success) {
  fs.readdir(folder, function (err, files) {
    async.map(files, loadPlan, function (err, results) {
      var result = {};
      for (var i = 0; i < results.length; i++) {
        var plan = results[i];
        result[plan.id] = plan;
      }
      success(result)
    });
  });
}
var loadPlan = function (file, success) {
  fs.readFile(folder + file, 'utf8', function (err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }
    console.log('read ' + file);
    success(null, JSON.parse(data));
  });
}
var whenPlansLoaded = function (success) {
  if (allPlans == null) {
    loadPlans(function (all) {
      allPlans = all;
      success(all);
    });
  } else {
    success(allPlans);
  }
}

exports.existsPlan = function (id) {
  return true;
}
exports.getPlan = function (id, success) {
  whenPlansLoaded(function (all) {
    console.log("have the plans, looking for " + id);
    if (id in all) {
      success(all[id]);
    } else {
      success(null);
    }
  });
}
exports.savePlan = function (id, plan) {
  whenPlansLoaded(function (all) {
    all[id] = plan;
    var outputFilename = folder + id + ".json";
    fs.writeFile(outputFilename, JSON.stringify(plan, null, 4), function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("JSON saved to ");
      }
    });
  });
}

exports.urlFor = function (plan, append) {
  var toLowerize = function (s) {
    var result = s.toLowerCase();
    return result.replace(/[^a-z0-9]+/g, '-');
  }
  var url = "/itinerary/";
  url += toLowerize(plan.author.name) + '/';
  url += plan.id + '/';
  url += toLowerize(plan.plan.title) + '/';
  if (append) url += append;
  console.log('urlFor: ' + url);
  return url;
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
