module.exports = function (lock, debug, assert, BLOG_ID, callback) {

  var a_finished;
  var b_finished;

  function check_if_both_finished () {

    if (a_finished && b_finished) {
      debug('A and B have finished!');
      return callback();
    } else {
      debug('A and B have not finished!');
    }

  }

  debug('A: wait requesting lock on', BLOG_ID);
  lock(BLOG_ID, {wait: true}, function(err, release){

    if (err) throw err;

    release(function(){

      a_finished = true;
      debug('A: released lock', BLOG_ID);
      check_if_both_finished();
    });
  });

  debug('B: wait requesting lock on', BLOG_ID);
  lock(BLOG_ID, {wait: true}, function(err, release){

    if (err) throw err;

    release(function(){

      b_finished = true;
      debug('B: released lock', BLOG_ID);
      check_if_both_finished();
    });
  });

};