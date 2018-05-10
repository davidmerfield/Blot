var helper = require('helper');
var forEach = helper.forEach;
var Entry = require('entry');
var client = require('client');
var Blog = require('blog');

var dependentsKey = Entry.key.dependents;

module.exports = function (blogID, path, callback) {

  // for each dependency, rebuild?
  // how do we prevent an infinite loop for mutually dependent files?

  Blog.get({id: blogID}, function(err, blog){

    client.SMEMBERS(dependentsKey(blogID, path), function(err, dependent_paths){

      if (err) return callback(err);
      
      forEach(dependent_paths, function(dependent_path, next){

        Entry.build(blog, dependent_path, function(err, updated_dependent){

          if (err) {
            console.log(err);
            return next();
          }

          Entry.set(blogID, dependent_path, updated_dependent, function(err){

            if (err) return callback(err);

            next();

          }, false);
        });
      }, callback);
    });
  });
};