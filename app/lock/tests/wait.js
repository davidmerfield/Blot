module.exports = function (lock, debug, assert, BLOG_ID, callback) {

  debug('wait requesting lock on', BLOG_ID);

  lock(BLOG_ID, function(err, first_release){

    assert(err === null);

    // Wait 1s to call first release function
    setTimeout(function(){
      first_release(function(){
        
      });
    }, 1000);

    lock(BLOG_ID, {wait: true}, function(err, second_release){

      assert(err === null, 'Failed to acquire lock as expected');

      if (err) throw err;

      second_release(callback);
    });
  });


};