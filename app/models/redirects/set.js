var client = require('../client');
var helper = require('../../helper');
var ensure = helper.ensure;
var forEach = helper.forEach.parallel;
var key = require('./key');
var util = require('./util');
var matches = util.matches;
var drop = require('./drop');

module.exports = function (blogID, mappings, callback) {

  ensure(blogID, 'string')
    .and(mappings, 'array')
    .and(callback, 'function');

  var redirects = key.redirects(blogID);

  client.del(redirects, function(err){

    if (err) throw err;

    forEach(mappings, function(redirect, next, index){

      var from = redirect.from;
      var to = redirect.to;
      var fromKey = key.redirect(blogID, from);

      index = parseInt(index);

      if (isNaN(index))
        throw new Error('forEach returned a NaN index');

      var candidates = mappings.slice(0, index);

      // If either the 'from' rule or the 'to' rule
      // are empty strings then delete this rule.
      // If the 'to' rule matches a 'from' rule which
      // comes before it ('candidates') this would cause
      // a re-direct loop, so drop this rule.
      if (!from || !to || matches(to, candidates)) {
        return drop(blogID, from, next);
      }

      ensure(from, 'string')
        .and(to, 'string')
        .and(index, 'number')
        .and(fromKey, 'string')
        .and(redirects, 'string');

      client.zadd(redirects, index, from, function(err){

        if (err) throw err;

        client.set(fromKey, to, function(err){

          if (err) throw err;

          next();
        });
      });
    }, callback);
  });
};