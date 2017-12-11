var User = require('../../app/models/user');
var Blog = require('../../app/models/blog');
var forEach = require('../../app/helper').forEach;

var handle = process.argv[2];

if (!handle) throw 'Please pass the user\'s handle as an argument.';

Blog.get({handle: handle}, function(err, blog){

  if (!blog) throw 'There is no user with the handle ' + handle;

  var uid = blog.owner;

  User.getById(uid, function(err, user){

    forEach(user.blogs, function(blogID, nextBlog){

      Blog.set(blogID, {isDisabled: true}, nextBlog);

    }, function(){

      User.set(uid, {isDisabled: true}, function(err){

        if (err) throw err;

        console.log(blog.handle + '\'s blot account (' + uid + ') has been disabled. The username ' + blog.handle + ' has been reserved for them.');
      });
    });
  });
});
