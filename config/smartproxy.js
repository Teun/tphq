var plans = require('../data/plan');
var request = require('request');

exports.locationJson = function (req, res) {
  var newUrl = "http://www.tripadvisor.com/TypeAheadJson?action=SITEWIDECOMBINEDV2&global=true";
  if(req.query.action)newUrl += "&types=" + req.query.action;
  if(req.query.query)newUrl += "&query=" + req.query.query;
  console.log(newUrl);

  var r = request(newUrl, function(err, resp, body){
      if(err){
        console.log(err, body);
      }
    });
  
  r.pipe(res);
}
