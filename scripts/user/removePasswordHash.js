var User = require('user');
var get = require('../get/blog');
var handle = process.argv[2];

if (!handle) throw 'Please pass the user\'s handle as an argument.';

get(handle, function(err, user){

  User.set(user.uid, {passwordHash: ''}, function(err){

    if (err) throw err;

    process.exit();
  });
});