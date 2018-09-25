var Sync = require('sync');

module.exports = function main (done) {

  console.log('Attempting to aqcuire sync lock to see if an existing sync has finished...');
  Sync(global.blog.id, function(_cb){
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