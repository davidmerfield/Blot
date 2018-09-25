var User = require('../../app/models/user');
var randomString = require('./randomString');

module.exports = function(done){

  var fakePasswordHash = randomString(16);
  var fakeEmail = randomString(20) + '@example.com';

  console.log(fakeEmail, 'CREATING USER');

  User.create(fakeEmail, fakePasswordHash, {}, function(err, user){

    if (err) {
      console.log(fakeEmail, 'ERROR CREATING USER', err);
      return done(err);
    }
    
    console.log(fakeEmail, 'CREATED USER');
  
    global.user = user;
    done();
  });
};