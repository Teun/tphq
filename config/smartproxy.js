var plans = require('../data/plan');
var request = require('request');

exports.locationJson = function (req, res) {
  var newUrl = "http://www.tripadvisor.com/TypeAheadJson?action=SITEWIDECOMBINEDV2&global=true";
  newUrl += "&types=geo";
  newUrl += "&query=" + req.query.query;
  console.log(newUrl);

  var r = request(newUrl, function(err, resp, body){
      if(err){
        console.log(err, body);
      }
    });
  
  r.pipe(res);
}
exports.sightJson = function (req, res) {
  var newUrl = "http://www.tripadvisor.com/TypeAheadJson?action=SITEWIDECOMBINEDV2&global=true";
  newUrl += "&types=attr";
  if(req.query.parentids)newUrl += "&parentids=" + req.query.parentids;
  newUrl += "&query=" + req.query.query;

  var r = request(newUrl, function(err, resp, body){
      if(err){
        console.log(err, body);
      }
    });
  
  r.pipe(res);
}
