var client = require('../models/client');
var helper = require('../helper');
var ensure = helper.ensure;

// Each sync process has a minute to do its
// business. This is usually enough time.
var DURATION = 60;

var activeKey = 'sync:active';

function leaseKey (blog_id) {
  ensure(blog_id, 'string');
  return 'sync:lease:' + blog_id;
}

function againKey (blog_id) {
  ensure(blog_id, 'string');
  return 'sync:again:' + blog_id;
}


function active (callback) {
  client.SMEMBERS(activeKey, callback);
}

function extend (blog_id, callback) {
  client.EXPIRE(leaseKey(blog_id), DURATION, function(err, stat){
    callback(err, stat === 1);
  });
}



function release (blog_id, callback) {

  var multi = client.multi();

  multi.DEL(againKey(blog_id));
  multi.SREM(activeKey, blog_id);
  multi.DEL(leaseKey(blog_id));
  multi.exec(function(err, res){
    // should we sync again
    callback(err, res[0] === 1);
  });
}

function reset (blog_id, callback) {

  var multi = client.multi();

  multi.SREM(activeKey, blog_id);
  multi.DEL(againKey(blog_id));
  multi.DEL(leaseKey(blog_id));
  multi.exec(callback);
}

function request (blog_id, callback) {

  var multi = client.multi();
  var available;

  multi.SETNX(leaseKey(blog_id), true);
  multi.EXPIRE(leaseKey(blog_id), DURATION);
  multi.exec(function(err, replies){

    if (err) return callback(err);

    available = replies[0] === 1;
    multi = client.multi();

    if (available) {
      multi.SADD(activeKey, blog_id);
    } else {
      multi.SET(againKey(blog_id), true);   
    }

    multi.exec(function(err){

      if (err) return callback(err);
      
      if (available) {
        callback(null);
      } else {
        err = new Error('Sync lease was not available');
        err.code = 'ENOTAV'; // ERROR NOT AVAILABLE?
        callback(err);
      }
    });
  });
}

module.exports = {
  active: active,
  extend: extend,
  request: request,
  reset: reset,
  release: release,
  DURATION: DURATION
};