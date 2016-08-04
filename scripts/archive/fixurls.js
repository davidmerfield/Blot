var Entry = require('../app/models/entry');
var redis = require('redis').createClient();
var urlkey = Entry.key.url;
var helper = require('helper');
var forEach = helper.forEach;
var eachBlog = require('./each/blog');
var normalize = helper.pathNormalizer;
var options = require('minimist')(process.argv.slice(2));

eachBlog(function(user, blog, nextBlog){

  entries(blog.id, function(){

    nextBlog();
  });

}, process.exit, options);

function entries (blogID, callback) {

  console.log('Blog:', blogID, 'Rebuilding');

  redis.keys('blog:' + blogID + ':entry:*', function(err, keys){

    if (err) throw err;

    keys = keys.filter(function(key){
      return key.indexOf('/') === -1;
    });

    if (!keys.length) return callback();

    redis.mget(keys, function(err, entries){

      entries = entries.map(JSON.parse);

      // we should check the entry is valid
      // we should check there are not two entries with the same path?

      forEach(entries, function(entry, next){

        entry.id = normalize(entry.path);

        redis.set(urlkey(blogID, entry.url), entry.id, function(err){

          if (err) throw err;

          Entry.set(blogID, entry.id, entry, next);
        });
      }, function(){

        // then we should del those keys
        // since they use the old entry ID
        redis.del(keys, function(err){

          if (err) throw err;

          callback();
        });
      });
    });
  });
}