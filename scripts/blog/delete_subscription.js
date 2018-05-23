var User = require('user');
var get = require('./get');
var handle = process.argv[2];

get(handle, function(user, blog){

  if (!user || !blog) throw 'There is no existing blog matching the handle \'' + handle + '\'';

  User.set(user.uid, {subscription: {}}, function(err, changes){

    if (err) throw err;

    console.log('Removed subscription for', handle);
  });
});