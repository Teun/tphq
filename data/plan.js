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
}