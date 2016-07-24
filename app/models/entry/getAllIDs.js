var helper = require('../../helper');
var ensure = helper.ensure;

var getTotal = require('./getTotal');

module.exports = function getAllIDs (blogID, callback) {

  ensure(blogID, 'string')
    .and(callback, 'function');

  getTotal(blogID, function(err, total){

    var entryIDs = [];

    for (var i = 1; i <= total; i++)
      entryIDs.push(i);

    return callback(err, entryIDs);
  });
};