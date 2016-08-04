var Entry = require('../app/models/entry');
var redis = require('redis').createClient();
var urlkey = Entry.key.url;
var helper = require('helper');
var forEach = helper.forEach;
var eachBlog = require('./each/blog');

var options = require('minimist')(process.argv.slice(2));

var cache = require('../app/cache');

// THIS SCRIPT NEEDS TO BE RESUMABLE
// this script probably fucks ip blog's menus
// anything which depends on entry.id needsd checking

// remove all the cache keys to reduce the time
// needed to clean the blog keys.

// does this upgrade urls to latest permalink design BUT preserve redirects for old ones?

throw 'NOT READY';

cache.flush(function(){

  clean('*', function(){

    eachBlog(function(user, blog, nextBlog){

      entries(blog.id, function(){

        nextBlog();
      });

    }, process.exit, options);

  });
});


function clean (blogID, callback) {

  console.log('Blog:', blogID, 'Cleaning');

  var patterns = [
    'blog:' + blogID + ':entries',
    'blog:' + blogID + ':drafts',
    'blog:' + blogID + ':path',
    'blog:' + blogID + ':scheduled',
    'blog:' + blogID + ':pages',
    'blog:' + blogID + ':deleted',
    'blog:' + blogID + ':public:*',
    'blog:' + blogID + ':url:*',
    'blog:' + blogID + ':tags:all',
    'blog:' + blogID + ':next_entry_id',
    'blog:' + blogID + ':tags:entries:*',
    'blog:' + blogID + ':tags:entry:*',
    'blog:' + blogID + ':search:*',
    'blog:' + blogID + ':tags:name:*'
  ];

  var all_keys = [];

  forEach.parallel(patterns, function(pattern, nextPattern){

    redis.keys(pattern, function(err, keys){

      if (err) throw err;

      if (!keys.length) return nextPattern();

      all_keys = all_keys.concat(keys);

      nextPattern();
    });

  }, function(){

    if (!all_keys.length) return callback();

    redis.del(all_keys, function(err){

      if (err) throw err;

      callback();
    });
  });
}

function entries (blogID, callback) {

  console.log('Blog:', blogID, 'Rebuilding');

  redis.keys('blog:' + blogID + ':entry:*', function(err, keys){

    if (err) throw err;

    redis.mget(keys, function(err, entries){

      entries = entries.map(JSON.parse);

      // we should check the entry is valid
      // we should check there are not two entries with the same path

      forEach(entries, function(entry, next){

        redis.set(urlkey(blogID, entry.url), entry.path.toLowerCase(), function(err){

          if (err) throw err;

          entry.id = entry.path.toLowerCase();

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