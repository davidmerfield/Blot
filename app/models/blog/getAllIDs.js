var client = require('client');
var helper = require('helper');
var ensure = helper.ensure;
var key = require('./key');

module.exports = function getAllIDs (callback) {

  ensure(callback, 'function');

  client.get(key.totalBlogs, function(err, totalBlogs){

    if (err) throw err;

    totalBlogs = parseInt(totalBlogs);

    var ids = [];

    while (totalBlogs > 0) {
      ids.unshift(totalBlogs + '');
      totalBlogs--;
    }

    return callback(null, ids);
  });
};
