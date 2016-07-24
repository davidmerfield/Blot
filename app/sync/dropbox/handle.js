var helper = require('../../helper');
var forEach = helper.forEach;
var ensure = helper.ensure;

var User = require('../../models/user');
var Blog = require('../../models/blog');
var makeClient = User.makeClient;
var Change = require('./change');

var filter = require('./filter');
var renames = require('./renames');
var buildFromFolder = require('../../modules/template').update;

// var debug = require('./debug');

module.exports = function (uid, changes, callback) {

  ensure(uid, 'string')
    .and(changes, 'array')
    .and(callback, 'function');

  makeClient(uid, function(err, client){

    if (err) return callback(err);

    // For each changed file, filter them to determine
    // which blog the file belongs to, if any.
    filter(uid, changes, function(err, blogs){

      if (err) return callback(err);

      forEach(blogs, function(blogID, changes, nextBlog){

        // intercept renamed files now.
        renames(blogID, client, changes, function(err, changes){

          if (err) throw err;

          Blog.get({id: blogID}, function(err, blog){

            forEach(changes, function(change, nextChange){

              Change(blog, client, change, function (err) {

                if (err) console.log(err);

                nextChange();
              });
            }, function(){
              buildFromFolder(blogID, nextBlog);
            });
          });
        });
      }, callback);
    });
  });
};