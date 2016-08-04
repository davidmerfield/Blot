var helper = require('helper');
var redis = require('redis').createClient();
var forEach = helper.forEach;
var cache = require('../app/cache');

cache.flush(function(){

  // this removes existing keys
  clean('*', process.exit);
});

function clean (blogID, callback) {

  console.log('Blog:', blogID, 'Cleaning');

  var patterns = [
    'blog:' + blogID + ':entries',
    'blog:' + blogID + ':drafts',
    'blog:' + blogID + ':scheduled',
    'blog:' + blogID + ':pages',
    'blog:' + blogID + ':deleted',
    'blog:' + blogID + ':tags:all',
    'blog:' + blogID + ':next_entry_id',
    'blog:' + blogID + ':path:*',
    'blog:' + blogID + ':public:*',
    'blog:' + blogID + ':url:*',
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