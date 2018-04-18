var client = require('../models/client');
var helper = require('../helper');
var ensure = helper.ensure;

// Each sync process has a minute to do its
// business. This is usually enough time.
var DURATION = 60;

var activeKey = 'sync:active';

function leaseKey (uid) {
  ensure(uid, 'string');
  return 'sync:lease:' + uid;
}

function againKey (uid) {
  ensure(uid, 'string');
  return 'sync:again:' + uid;
}


function active (callback) {
  client.SMEMBERS(activeKey, callback);
}

function extend (uid, callback) {
  client.EXPIRE(leaseKey(uid), DURATION, function(err, stat){
    callback(err, stat === 1);
  });
}

function again (uid, callback) {
  client.DEL(againKey(uid), function(err, stat){
    callback(err, stat === 1);
  });
}

function release (uid, callback) {

  var multi = client.multi();

  multi.SREM(activeKey, uid);
  multi.DEL(leaseKey(uid));
  multi.exec(callback);
}

function request (uid, callback) {

  var multi = client.multi();
  var available;

  multi.SETNX(leaseKey(uid), true);
  multi.EXPIRE(leaseKey(uid), DURATION);
  multi.exec(function(err, replies){

    if (err) return callback(err);

    available = replies[0] === 1;
    multi = client.multi();

    if (available) {
      multi.SADD(activeKey, uid);
    } else {
      multi.SET(againKey(uid), true);      
    }

    multi.exec(function(err){

      if (err) return callback(err);
    
      callback(null, available);
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