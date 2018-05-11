var exec = require('child_process').exec;
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

module.exports = function start_listener (blog_id) {

  var em = git_emit(__dirname + '/data/' + blog_id + '.git');
  var commit_id;

  debug('Initialized', blog_id, 'git repo');
  
  em.on('post-receive', function(u){

    debug('post-receive', u.lines[0]);

    commit_id = u.lines[0].split(' ')[1];
  });

  // This fails for the first commit to a repo
  
  em.on('post-update', function () {

    var blog_id = '1';
    var changes;

    exec('git -C ' + blog_dir(blog_id) + ' pull', function(err){

      if (err) {
        debug('error', err);
        return;
      }

      debug('Blog folder is synchronized');

      exec('git -C ' + blog_dir(blog_id) + ' diff-tree --name-status --no-commit-id --pretty -r ' + commit_id, function(err, out){

        if (err) {
          debug('error', err);
          return;
        }

        changes = out.trim().split('\n');

        Blog.get({id: blog_id}, function(err, blog){

          Sync(blog_id, function(callback){

            forEach(changes, function(line, next){

              debug('line is:', line);

              // Other options are A and M
              var should_delete = line.slice(0,1).trim() === 'D';
              var path = line.slice(2).trim();

              debug(should_delete, path);

              if (should_delete) {
                debug('Calling drop with', blog_id, path);
                Change.drop(blog_id, path, callback);
              } else {
                debug('Calling set with', blog_id, path);
                Change.set(blog, path, next);
              }
                
              next();

            }, callback);

          }, function(){

            debug('Sync complete!');
          });
        });
      });
    });
  });
};