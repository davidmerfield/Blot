var database = require('./database');
var fs = require('fs-extra');
var watch = require('./watch');
var config = require('config');
var join = require('path').join;
var async = require('async');

function blog_dir (blog_id) {
  return join(config.blog_folder_dir, blog_id);
}

// Initialze the local client
database.get_all(function (err, res) {

  async.eachOf(res || {}, function(blog_id, path, next){

    if (!blog_id || !path) return next();

    fs.remove(blog_dir(blog_id), function(err){

      if (err) throw err;

      fs.symlink(path, blog_dir(blog_id), function(err){

        if (err) console.log(err);

        console.log('Watching', path, 'for blog', blog_id);
        watch(blog_id, path);

        next();
      });
    });
  }, function(){

    console.log('Initialized local folder client');
  });
});

module.exports = {
  display_name: 'Local folder',
  description: 'Use a folder on this computer.',
  remove: require('./client').remove,
  write: require('./client').write,
  disconnect: require('./client').disconnect,
  dashboard_routes: require('./dashboard')
};