var Git = require('simple-git');
var Blog = require('blog');
var helper = require('helper');
var Change = require('sync').change;
var Sync = require('sync');
var forEach = helper.forEach;
var git_emit = require('git-emit');
var debug = require('debug')('client:git:listener');

function blog_dir (blog_id) {
  return helper.localPath(blog_id, '/');
}

function add_leading_slash (path) {
  if (path[0] === '/') return path;
  if (!path.length) return '/';
  return '/' + path;
}

module.exports = function start_listener (handle) {

  Blog.get({handle: handle}, function(err, blog){

    if (err || !blog) return console.log('ERROR no blog', handle);

    var blog_id = blog.id;
    
    var emitter = git_emit(__dirname + '/data/' + blog.handle + '.git');
    var git = Git(blog_dir(blog.id));

    debug('Initialized', blog_id, 'git repo');
    
    emitter.on('post-update', function () {

      debug('post-update called');

      git.pull(function(err, info){

        if (err) {
          debug('error', err);
          return;
        }

        debug('Blog folder is synchronized'); 
        debug(info);

        Sync(blog_id, function(callback){
          
          forEach(info.files, function(path, next){

            if (info.insertions[path] === 1) {
              debug('Calling set with', blog_id, path);
              return Change.set(blog, add_leading_slash(path), next);
            }

            if (info.deletions[path] === 1) {
              debug('Calling drop with', blog_id, path);
              return Change.drop(blog_id, add_leading_slash(path), next);
            } 

            debug('Warning', path, 'is a file but not in insertions or deletions');
            next();
            
          }, callback);

        }, function(){

          debug('Sync complete!');
        });
      }); 
    });
  });
};