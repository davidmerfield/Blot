var User = require('../../app/models/user');
var get = require('../blog/get');
var handle = process.argv[2];

if (!handle) throw 'Please pass the user\'s handle as an argument.';

get(handle, function(user){

  User.set(user.uid, {passwordHash: ''}, function(err){

    if (err) throw err;

    process.exit();
  });
});