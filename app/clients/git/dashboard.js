var exec = require('child_process').exec;
var Change = require('sync').change;
var Sync = require('sync');
var pushover = require('pushover');
var dashboard = require('express').Router();
var fs = require('fs-extra');
var Blog = require('blog');
var REPO_DIR = __dirname + '/repos';
var repos = pushover(REPO_DIR, {autoCreate:true});
var helper = require('helper');
var forEach = helper.forEach;
var Blog = require('blog');
var client = require('./client');

var blog_dir = function(blog_id) {
  return helper.localPath(blog_id, '/');
};

dashboard.use(function (req, res, next){

  res.dashboard = function(name) {
    res.renderDashboard(__dirname + '/' + name + '.html');
  };

  next();
});

console.log('Git: When resuming work on client, uncomment these lines')
// var em = require('git-emit')(__dirname + '/repos/1.git');
// var commit_id;

// em.on('post-receive', function(u){

//   console.log('post-receive', u.lines[0]);

//   commit_id = u.lines[0].split(' ')[1];
// });

// em.on('post-update', function () {

//   var blog_id = '1';
//   var changes;

//   exec('git -C ' + blog_dir(blog_id) + ' pull', function(err){

//     if (err) console.log(err);

//     console.log('Blog folder is synchronized');

//     exec('git -C ' + blog_dir(blog_id) + ' diff-tree --name-status --no-commit-id --pretty -r ' + commit_id, function(err, out){

//       if (err) console.log(err);

//       changes = out.trim().split('\n');

//       Blog.get({id: blog_id}, function(err, blog){

//         Sync(blog_id, function(callback){

//           forEach(changes, function(line, next){

//             // Other options are A and M
//             var should_delete = line.slice(0,1).trim() === 'D';
//             var path = line.slice(2).trim();

//             if (should_delete) {
//               Change.drop(blog_id, path, callback);
//             } else {
//               Change.set(blog, path, next);
//             }
              
//             next();

//           }, callback);

//         }, function(){

//           console.log('Sync complete!');
//         });
//       });
//     });
//   });
// });


dashboard.get('/', function (req, res, next) {

  if (!req.blog.client) return res.redirect('/clients');

  repos.exists(req.blog.id + '.git', function(exists){

    res.locals.exists = exists;
    res.dashboard('index');
  });
});

dashboard.post('/test_remove', function(req, res, next){

  client.remove('1', 'test.html', function(err){

    if (err) console.log(err);

    res.redirect(req.baseUrl);
  });
});

dashboard.post('/test_write', function(req, res, next){

  client.write('1', 'test.html', Date.now() + '', function(err){

    if (err) console.log(err);

    res.redirect(req.baseUrl);
  });
});

dashboard.post('/create', function(req, res, next){

  var blog_folder = blog_dir(req.blog.id);
  var tmp_folder = helper.tempDir() + '/git-' + helper.guid() + req.blog.id;
  var git = 'git -C ' + blog_folder + ' ';

  fs.copy(blog_folder, tmp_folder, function(err){

    if (err) return next(err);

    repos.create(req.blog.id, function(err){

      if (err) return next(err);

      exec('git clone ' + REPO_DIR + '/' + req.blog.id + '.git ' + blog_folder, function(err){

        if (err) return next(err);

        fs.copy(tmp_folder, blog_folder, function(err){

          if (err) return next(err);

          exec(git + 'add .', function(err){
            
            if (err) return next(err);
            
            // This is dangerous
            exec(git + 'commit -m "Initial commit"', function(err){

              if (err) return next(err);
          
              // This is dangerous
              exec(git + 'push', function(err){

                if (err) return next(err);

                res.redirect(req.baseUrl);
              });
            });
          });
        });
      });
    });    
  });
});

dashboard.post('/disconnect', function(req, res, next){

  Blog.set(req.blog.id, {client: ''}, function(err){

    if (err) return next(err);

    // Remove the git repo in /repos
    fs.remove(REPO_DIR + '/' + req.blog.id + '.git', function(err){

      if (err) return next(err);

      // Remove the .git directory in the user's blog folder
      fs.remove(blog_dir(req.blog.id) + '/.git', function(err){
  
        if (err) return next(err);

        res.redirect('/clients');
      });      
    });
  });
});

module.exports = dashboard;