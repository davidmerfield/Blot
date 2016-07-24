var helper = require('../../helper');
var ensure = helper.ensure;
var redis = require('../client');

var nextEntryID = require('./key').nextEntryID;

module.exports = function getTotal (blogID, callback) {

  ensure(blogID, 'string')
    .and(callback, 'function');

  redis.get(nextEntryID(blogID), function(err, totalEntries){
    return callback(err, parseInt(totalEntries));
  });
};