var debug = require('debug')('lock');
var client = require('client');
var Redlock = require('redlock');

var DEFAULT_TTL = 10 * 1000; // 10s
var DEFAULT_RETRIES = 50; // ~10s (50 retries * 200ms default interval) 

var redlock_with_wait = new Redlock([client], {retryCount:  DEFAULT_RETRIES});
var redlock_without_wait = new Redlock([client], {retryCount:  0});

/* 

Function used to acquire a lock on a blog's folder. Used
before editing it, changing its client, etc... Interface:

lock(blogID, function(err, release){
  
  if (err) ... failed to acquire lock ...

  ... do work on folder ...
  
  release(); ... when the work is done ...
});

It takes advantage of Blot's database and an implementation of
the redlock algorithm by Mike Marcacci https://redis.io/topics/distlock

*/

function lock (blogID, options, callback) {

  var ttl, wait, redlock, release, resource;

  if (callback === undefined && typeof options === 'function') {
    callback = options;
    options = {};
  }

  // the maximum amount of time you want the resource locked,
  // keeping in mind that you can extend the lock up until
  // the point when it expires
  ttl = options.ttl || DEFAULT_TTL;
  wait = options.wait || false;
  resource = resource_key(blogID);

  // Wait means that we will give so many retries to acquire a lock
  // before returning an error. This number of retries is about 10s
  // worth and is enough that we might expect a user watching a spinner
  // to wait. This feature is used on the dashboard when modifying a client
  // settings. We'll wait to acquire a lock in that context rather than
  // immediately throwing an error, as we would during a folder sync.
  if (wait) {
    redlock = redlock_with_wait;
  } else {
    redlock = redlock_without_wait;
  }

  redlock.lock(resource, ttl, function(err, active_lock) {

    // We failed to acquire a lock on the resource
    if (err) {

      // Store the fact that a failed attempt was made
      // to acquire this resource. We use this information
      // when syncing a blog to determine whether to resync
      return client.set(again_key(blogID), 1, function(){
        callback(err, null);
      });
    }

    release = Release(blogID, active_lock);

    callback(null, release);    
  });

}


function again_key (blogID) {
  return 'blog:' + blogID + ':lock:attempt';
}

function resource_key (blogID) {
  return 'blog:' + blogID + ':lock';
}

function Release (blogID, active_lock) {

  return function (callback) {

    if (!callback) callback = function(){};

    active_lock.unlock(function(err) {

      if (err) return callback(err);

      client.del(again_key(blogID), function(err, stat){

        if (err) return callback(err);
      
        // we weren 't able to reach redis; your lock will eventually
        // expire, but you probably want to log this error
        callback(null, !!stat);
      });
    });      
  };
}

module.exports = lock;