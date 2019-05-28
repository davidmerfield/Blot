var Blog = require('../../app/models/blog');
var User = require('../../app/models/user');
var forEach = require('../../app/helper').forEach;

var eachBlog = require('../each/blog');

var identifier = process.argv[2] + '';

var verbose = !!process.argv[3];

if (!identifier) throw 'Please pass the user\'s handle as an argument.';

eachBlog(function(user, blog, nextBlog){

  if (blog.handle === identifier) return show(user, nextBlog);

  if (user.uid === identifier) return show(user, nextBlog);

  if (blog.id === identifier) return show(user, nextBlog);

  if (user.email === identifier) return show(user, nextBlog);

  nextBlog();

}, process.exit);


function show (user, then) {
  console.log('-----------------------------');
  console.log('Name: ' + user.name);
  console.log('Email: ' + user.email);
  console.log('UID: ' + user.uid);
  console.log('Country: ' + user.countryCode);
  console.log('Blogs: ');
  forEach(user.blogs, function(blogID, next){

    Blog.get({id: blogID}, function(err, blog){

      console.log('  ID: ' + blog.id);
      console.log('  Handle: ' + blog.handle);
      console.log('  Domain: ' + blog.domain);

      console.log();

      if (verbose) console.log(blog);
      next();
    });
  }, function(){
    if (verbose) console.log(user);
    then();
  });
}