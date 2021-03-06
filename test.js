// Bootstrap models
var models_path = __dirname + '/models'
var fs = require('fs');
fs.readdirSync(models_path).forEach(function (file) {
  require(models_path + '/' + file);
});

var request = require('supertest')
var expect = require("expect.js");
var express = require('express');
var app = express();
var config = require("./config");
var routes = require("./config/routes");
config.appCfg(app, config);
routes.init(app);

describe("My suite", function () {
  it("should pass", function (done) {
    done();
  });
});

describe("Routing: ", function () {
  it("root should render the index view", function (done) {
    request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(200, done);
  });
  it("an existing detail view should redirect to canonical spelling", function (done) {
    request(app)
      .get('/itinerary/teun-duynstee/wy2ore/culture-and-nature-in-former-Yugoslavia/')
      .expect('Location', /culture-and-nature-in-former-yugoslavia/)
      .expect(302, done);
  });
  it("A canonical detail view should render detail-view", function (done) {
    request(app)
      .get('/itinerary/teun-duynstee/wy2ore/culture-and-nature-in-former-yugoslavia/')
      .expect('Content-Type', /html/)
      .expect(200, done);
  });
});



var testplan = {
  "id": "dw2wtz",
  "plan":
  {
    "title": "Thailand, temples and cities",
    "startDate": 1391212800000,
    "places": [
      {
        "name": "Bangkok, Thailand",
        "description": "Short description of the place",
        "sights": [],
        "latlng": [13.803611, 100.6075],
        "fromDay": 0,
        "days": 3
      },
      {
        "name": "Chiang Mai, Thailand",
        "description": "Short description of the place",
        "sights": [],
        "latlng": [18.781752, 98.95559],
        "fromDay": 3,
        "days": 1
      }
    ],
    "images": []
  },
  "author": { "name": "Teun Duynstee" },
};

describe("Plan functions", function () {
  it("detail url should contain author, id, title ", function (done) {
    var plan = require("./data/plan");
    expect(plan.urlFor(testplan), "/plan/teun-duynstee/dw2wtz/thailand-temples-and-cities");
    done();
  });
});
//describe("Plan client side functions: ", function () {
//  it("dummy", function (done) {
//    var plan = require("./data/plan");
//    var model = new TPHQ.__planmodel(testplan);
//    done();
//  });
//});