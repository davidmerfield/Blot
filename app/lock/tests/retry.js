module.exports = function (lock, debug, assert, BLOG_ID, callback) {

  // 
  debug('Requesting first lock on', BLOG_ID);
  lock(BLOG_ID, function(err, release){

    // We should acquire the lock
    assert(err === null);

    debug('Requesting second lock on', BLOG_ID);
    lock(BLOG_ID, function(err){

      // We expect to fail to acquire the lock
      assert(err.name === 'LockError');
      debug('Failed to acquire second lock as expected');

      // Release the first lock
      release(function(err, retry){

        assert(err === null);
        debug('Released first lock');
      
        // Retry should be true because we requested
        // a second lock during the first one...
        assert(retry === true);
        debug('We recieved a second lock request during the first one...');
        
        callback();
      });
    });
  });
};