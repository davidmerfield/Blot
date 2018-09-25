module.exports = function(done){

    var User = require('../../app/models/user');
    var uid = global.user.uid;
    

    User.remove(uid, function(err){

      if (err) {
        return done(err);
      }

      delete global.user;
    
      done();
    });
};