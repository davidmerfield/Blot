module.exports = function (lock, debug, assert, BLOG_ID, callback) {

  debug('Requesting lock on', BLOG_ID);
  lock(BLOG_ID, function(err, release){

    // We should acquire the lock
    assert(err === null);

    // Release the first lock
    release(function(err, retry){

      assert(err === null);
      debug('Released lock');
    
      // Retry should be true because we requested
      // a second lock during the first one...
      assert(retry === false);
      debug('We did not get a request during the first one...');
      
      callback();
    });
  });
};