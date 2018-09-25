module.exports = function(done){

    var User = require('../../app/models/user');
    var uid = global.user.uid;
    
    console.log(global.user.email, 'DELETING USER');

    User.remove(uid, function(err){

      if (err) {
        console.log(global.user.email, 'ERROR DELETING USER', err);
        return done(err);
      }

      console.log(global.user.email, 'DELETED USER');
      delete global.user;
    
      done();
    });
};