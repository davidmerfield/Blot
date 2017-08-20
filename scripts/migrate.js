var User = require('../app/models/user');
var Blog = require('../app/models/blog');
var forEach = require('../app/helper').forEach;
var client = require('redis').createClient();
var all_uids = {};

// remove all sync locks (bad uids)
client.keys('sync:*', function (err, synckeys) {

  if (err) throw err;

  client.del(synckeys);
});

// remove all sessions (bad uids)
client.keys('sess:*', function (err, sesskeys) {

  if (err) throw err;

  client.del(sesskeys);
});

client.keys('user:*', function (err, userkeys) {

  if (err) throw err;

  forEach(userkeys, function(old_key, next){

    client.get(old_key, function(err, _user){

      if (err) throw err;

      var user = JSON.parse(_user);
      var old_uid = user.uid;
      var new_uid;

      // console.log('OLD USER:');
      // console.log(user);

      while (!new_uid || all_uids[new_uid] === undefined) {
         new_uid = User.generateId();
         all_uids[new_uid] = true;
      }

      delete user.name;
      delete user.countryCode;

      if (user.folderState) {
        var folderState = user.folderState;
        delete user.folderState;
      }

      if (user.credentials) {
        var credentials = user.credentials;
        delete user.credentials;
      }

      user.uid = new_uid;
      user.passwordHash = '';

      var new_user_string = JSON.stringify(user);
      var new_key = User.key.user(new_uid);

      var multi = client.multi();

      multi.sadd(User.key.uids, new_uid);
      multi.srem(User.key.uids, old_uid);
      multi.del(old_key);
      multi.set(new_key, new_user_string);
      multi.set(User.key.email(user.email), new_uid);

      // some users might not have stripe subscriptions
      if (user.subscription && user.subscription.customer)
        multi.set(User.key.customer(user.subscription.customer), new_uid);

      multi.exec(function(err) {

        if (err) throw err;

        User.getById(new_uid, function(err, saved_user){

          if (err) throw err;

          User.set(new_uid, saved_user, function(err){

            if (err) throw err;

            forEach(user.blogs, function(blogID, nextBlog){

              var blog_changes = {owner: new_uid};

              if (folderState) blog_changes.folderState = folderState;
              if (credentials) blog_changes.credentials = credentials;

              Blog.set(blogID, blog_changes, function(err){

                if (err) throw err;

                Blog.get({id: blogID}, function(err){

                  if (err) throw err;

                  nextBlog();
                });
              });
            }, next);
          });
        });
      });
    });
  }, process.exit);
});