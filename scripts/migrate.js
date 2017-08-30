var User = require('../app/models/user');
var Blog = require('../app/models/blog');
var forEach = require('../app/helper').forEach;
var eachBlog = require('./each/blog');
var config = require('../config');
var client = require('redis').createClient();
var all_uids = {};
// var APP_KEY = config.dropbox.key;
// var APP_SECRET = config.dropbox.secret;

var dropbox = require('dropbox');

console.log(config.dropbox);

eachBlog(function(user, blog, next){

  blog.credentials = blog.credentials || user.credentials;

  if (!blog.credentials) return next();

  var log = console.log.bind(this, blog.handle);
  var client = new dropbox({accessToken: blog.credentials.token});

  client.filesListFolder({path: ''})
    .then(function(response) {
      console.log(response);
      log('Success', response.entries.length, 'files found.');
      next();
    })
    .catch(function(error) {
      log('Error:', error.status, error);
      next();
    });

}, process.exit);