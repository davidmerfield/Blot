var exec = require('child_process').exec;
var pushover = require('pushover');
var dashboard = require('express').Router();
var fs = require('fs-extra');
var Blog = require('blog');
var REPO_DIR = __dirname + '/data';
var repos = pushover(REPO_DIR, {autoCreate:true});
var helper = require('helper');
var Blog = require('blog');
var client = require('./client');
var start_listener = require('./start_listener');
var Git = require('simple-git');

console.log('DANGEROUS EMPTY DIR DURING DEV');
fs.emptyDirSync(REPO_DIR);
fs.emptyDirSync(blog_dir('1'));

function blog_dir (blog_id) {
  return helper.localPath(blog_id, '/');
};

dashboard.use(function (req, res, next){

  res.dashboard = function(name) {
    res.renderDashboard(__dirname + '/' + name + '.html');
  };

  next();
});



dashboard.get('/', function (req, res) {

  if (!req.blog.client) return res.redirect('/clients');

  repos.exists(req.blog.handle + '.git', function(exists){

    res.locals.exists = exists;
    res.dashboard('index');
  });
});

dashboard.post('/test_remove', function(req, res){

  client.remove('1', 'test.html', function(err){

    if (err) console.log(err);

    res.redirect(req.baseUrl);
  });
});

dashboard.post('/test_write', function(req, res){

  client.write('1', 'test.html', Date.now() + '', function(err){

    if (err) console.log(err);

    res.redirect(req.baseUrl);
  });
});

dashboard.post('/create', function(req, res, next){

  var blog_folder = blog_dir(req.blog.id);
  var tmp_folder = helper.tempDir() + '/git-' + helper.guid() + req.blog.id;
  // var git = 'git -C ' + blog_folder + ' ';

  fs.copy(blog_folder, tmp_folder, function(err){

    if (err) return next(err);

    repos.create(req.blog.handle, function(err){

      if (err) return next(err);

      start_listener(req.blog.handle);

      var git = Git(REPO_DIR + '/' + req.blog.handle + '.git');

      git.clone(REPO_DIR + '/' + req.blog.handle + '.git', blog_folder, function(err){

        if (err) throw err;

        fs.copy(tmp_folder, blog_folder, function(err){

          if (err) return next(err);

          git = Git(blog_folder);

          git
          .add('.')
          .commit('first commit')
          .push(['origin', 'master'], function(err){

            if (err) throw err;

            res.redirect(req.baseUrl);
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
    fs.remove(REPO_DIR + '/' + req.blog.handle + '.git', function(err){

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