var Entry = require('../app/models/entry');
var redis = require('redis').createClient();
var urlkey = Entry.key.url;
var helper = require('helper');
var forEach = helper.forEach;
var eachBlog = require('./each/blog');

eachEntry(function(user, blog, entry, next){

  redis.set(urlkey(blog.id, entry.url), entry.path.toLowerCase(), function(err){

    if (err) throw err;

    Entry.set(blog.id, entry, next);
  });

}, process.exit);

function eachEntry (doThis, then) {

  eachBlog(function(user, blog, nextBlog){

    var id = blog.id;

    var keys = [
    'blog:' + id + ':entries',
    'blog:' + id + ':drafts',
    'blog:' + id + ':scheduled',
    'blog:' + id + ':pages',
    'blog:' + id + ':deleted',
    'blog:' + id + ':public:*',
    'blog:' + id + ':url:*',
    'blog:' + id + ':tags:all',
    'blog:' + id + ':next_entry_id',
    'blog:' + id + ':tags:entries:*',
    'blog:' + id + ':tags:entry:*',
    'blog:' + id + ':search:*',
    'blog:' + id + ':tags:name:*'
    ];

    forEach(keys, function(key, next){

      redis.keys(key, function(err, results){

        redis.mdel(results, next);

      });
    }, nextBlog);

  }, then);


}