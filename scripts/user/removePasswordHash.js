var User = require('../../app/models/user');
var helper = require('../../app/helper');
var forEach = helper.forEach;

User.getAllIds(function(err, users){

  forEach(users, function(uid, next){

    User.set(uid, {passwordHash: ''}, next);

  }, process.exit);
});

