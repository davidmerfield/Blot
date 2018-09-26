var User = require('../../app/models/user');
var randomString = require('./randomString');

module.exports = function(done){

  var context = this;
  var fakePasswordHash = randomString(16);
  var fakeEmail = randomString(20) + '@example.com';


  User.create(fakeEmail, fakePasswordHash, {}, function(err, user){

    if (err) {
      return done(err);
    }
  
    context.user = user;
    done();
  });
};