module.exports = function (lock, debug, assert, BLOG_ID, callback) {

  debug('Requesting lock on', BLOG_ID);
  lock(BLOG_ID, function(err, release){

    assert(err === null, 'Failed to acquire lock as expected');

    if (err) throw err;

    setTimeout(function () {
    
      release(function(err, retry){

        debug('Released lock on', BLOG_ID, retry);

        debug('Requesting lock on', BLOG_ID);
        lock(BLOG_ID, function(err, release){

          if (err) throw err;

          release(function(err, retry){

            debug('Released lock on', BLOG_ID, retry);
            callback();
          });
        });
      });

    }, 1000);

    debug('Requesting lock on', BLOG_ID);
    lock(BLOG_ID, function(err){
    
      assert(err.name === 'LockError', 'Myseteriously got lock even thhough we shouldnt');
      debug('Failed to acquire lock as expected');

    });
  });
};