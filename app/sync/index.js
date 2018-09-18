var buildFromFolder = require('../modules/template').update;
var Blog = require('blog');
var lock = require('./lock');
var Update = require('./update');
var Debug = require('debug');

/*

sync(global.blog.id, function(err, update, release){

  expect(err).toBe(null);
  
  release(function(err, retry){

    expect(err).toBe(null);
    
    ...
  });
});

*/
module.exports = function sync (blogID, options, callback) {

  if (typeof callback === 'undefined' && typeof options === 'function') {
    callback = options;
    options = {};
  }

  var debug = Debug('blot:sync Blog ' + blogID);
  var update;

  Blog.get({id: blogID}, function(err, blog){

    if (err) return callback(err);

    if (!blog || !blog.id) {
      return callback(new Error('No blog with id: ' + blogID));
    }
      
    if (blog.isDisabled) {
      return callback(new Error('Blog is disabled, id: ' + blogID));
    }
      
    debug('Trying to acquire sync lock');

    lock(blogID, function(err, release){
      
      if (err) return callback(err);
      
      update = new Update(blog);

      debug('Invoking callback with update');

      callback(err, update, function (callback) {

        debug('Complete invoked');

        release(function(err, retry){

          debug('Release callback invoked');

          Blog.flushCache(blogID, function(err){

            if (err) return callback(err);

            buildFromFolder(blog.id, function(err){

              if (err) return callback(err);

              debug('Invoking afterRelease with update');

              callback(null, retry);
            });      
          });  
        });    
      });      
    });
  });
}