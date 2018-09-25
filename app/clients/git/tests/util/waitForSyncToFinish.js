var Sync = require('sync');

module.exports = function main (done) {

  Sync(this.blog.id, function(_cb){
    _cb(null);
  }, function(err, unavailable){

    if (err) return done(err);

    if (unavailable) {
      setTimeout(function(){

        main(done);

      }, 1000);

    } else {
      done(null);
    }
  });
};