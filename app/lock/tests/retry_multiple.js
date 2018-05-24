var for_each = require('helper').forEach;

module.exports = function (lock, debug, assert, BLOG_ID, callback) {

  debug('Requesting lock on', BLOG_ID);
  lock(BLOG_ID, function(err, release){

    // We should acquire the lock
    assert(err === null);

    var queue = [];

    for (var i = 0;i < 10;i++)
      queue.push(lock.bind(this, BLOG_ID));

    for_each(queue, function(try_lock, next){

      debug('Trying to get lock....')
      try_lock(function(err, release){

        assert(err.name === 'LockError');
        assert(release === null);
        
        next();
      });

    }, function(){
      
      // Release the first lock
      release(function(err, retry){

        assert(err === null);
        debug('Released lock');
      
        // Retry should be true because we requested
        // a second lock during the first one...
        assert(retry === true);
        debug('We got a request during the first one...');
        
        callback();
      });
    });
  });
};