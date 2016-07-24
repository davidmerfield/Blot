var client = require('../models/client');
var helper = require('../helper');
var ensure = helper.ensure;

// Each sync process has a minute to do its
// business. This is usually enough time.
var DURATION = 60;

function leaseKey (uid) {
  ensure(uid, 'string');
  return 'sync:lease:' + uid;
}

var activeKey = 'sync:active';

function againKey (uid) {
  ensure(uid, 'string');
  return 'sync:again:' + uid;
}

function active (callback) {
  client.SMEMBERS(activeKey, callback);
}

function extend (uid, callback) {

  ensure(uid, 'string')
    .and(callback, 'function');

  client.EXPIRE(leaseKey(uid), DURATION, function(err, stat){

    if (err) throw err;

    return callback(null, stat === 1);
  });
}

function release (uid, callback) {

  ensure(uid, 'string')
    .and(callback, 'function');

  client.SREM(activeKey, uid, function (err){

    if (err) throw err;

    client.DEL(leaseKey(uid), function(err){

      if (err) throw err;

      return callback();
    });
  });
}

function again (uid, callback) {

  ensure(uid, 'string')
    .and(callback, 'function');

  client.DEL(againKey(uid), function(err, stat){

    if (err) throw err;

    return callback(null, stat === 1);
  });
}

function request (uid, callback) {

  ensure(uid, 'string')
    .and(callback, 'function');

  client.SETNX(leaseKey(uid), true, function(err, set){

    if (err) throw err;

    if (set === 0) {
      client.set(againKey(uid), true);
      return callback(null, false);
    }

    client.EXPIRE(leaseKey(uid), DURATION, function(err){

      if (err) throw err;

      client.SADD(activeKey, uid, function (err){

        if (err) throw err;

        return callback(null, true);
      });
    });
  });
}

module.exports = {
  again: again,
  active: active,
  extend: extend,
  request: request,
  release: release,
  DURATION: DURATION
};