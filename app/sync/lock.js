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

  if (!blogID) {
    return callback(new TypeError('Pass the ID of a blog as the first argument'));
  }

  if (!callback) {
    return callback(new TypeError('Pass a callback function'));
  }
  
  // the maximum amount of time you want the resource locked,
  // keeping in mind that you can extend the lock up until
  // the point when it expires
  ttl = options.ttl || DEFAULT_TTL;
  wait = options.wait || false;
  resource = Resource(blogID);

  if (!Number.isInteger(ttl)) {
    return callback(new TypeError('TTL must be an integer'));
  }

  if (typeof wait !== 'boolean') {
    return callback(new TypeError('wait must be boolean'));
  }
  
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
      client.set(Failed_Attempt(blogID), true, function(){

        callback(err, null);
      });

    // We acquired a lock on the resource!
    } else {

      // This function is to be called when we are finished
      // with the lock on the user's folder.
      release = Release(blogID, active_lock);

      callback(null, release);  
    }  
  });

}


function Failed_Attempt (blogID) {
  return 'blog:' + blogID + ':lock:failed_attempt';
}

function Resource (blogID) {
  return 'blog:' + blogID + ':lock';
}

function Release (blogID, active_lock) {

  return function (callback) {

    if (!callback) callback = function(){};

    var failed_attempt = false;

    // We could do these next two things in parallel
    // but it's a little bit of refactoring...
    active_lock.unlock(function(err) {

      // we weren 't able to reach redis; your lock will eventually
      // expire, but you probably want to log this error
      if (err) return callback(err);

      client.del(Failed_Attempt(blogID), function(err, stat){

        if (err) return callback(err);
  
        // If we managed to delete a key then there was 
        // a failed attempt to acquire a lock        
        failed_attempt = !!stat;

        callback(null, failed_attempt);
      });
    });      
  };
}

module.exports = lock;