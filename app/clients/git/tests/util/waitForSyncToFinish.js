var Sync = require('sync');

module.exports = function main (done) {

  Sync(global.blog.id, function(_cb){
    _cb(null);
  }, function(err, unavailable){

    if (err) {
      console.log('strange error here!?', err);
      return done(err);
    }

    if (unavailable) {
      // sync was not free
      console.log('Sync was unavailable');
      setTimeout(function(){

        main(done);

      }, 1000);

    } else {
      console.log('SYNC AVAILABLE');
      // sync was free!
      done(null);
    }
  });
};