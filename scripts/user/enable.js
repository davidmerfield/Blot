var User = require('../../app/models/user');
var Blog = require('../../app/models/blog');
var forEach = require('../../app/helper').forEach;

var handle = process.argv[2];

if (!handle) throw 'Please pass the user\'s handle as an argument.';

Blog.get({handle: handle}, function(err, blog){

  if (!blog) throw 'There is no user with the handle ' + handle;

  var uid = blog.owner;

  User.getBy({uid: uid}, function(err, user){

    forEach(user.blogs, function(blog, nextBlog){

      Blog.set(blog.id, {isDisabled: false}, nextBlog);

    }, function(){

      User.set(uid, {isDisabled: false}, function(err){

        if (err) throw err;

        console.log(blog.handle + '\'s blot account (' + uid + ') has been enabled. The username ' + blog.handle + ' has been reserved for them.');
      });
    });
  });
});
