var database = require('./database');
var helper = require('helper');
var forEach = helper.forEach;
var fs = require('fs-extra');
var local_path = helper.localPath;
var watch = require('./watch');

// Initialze the local client
database.get_all(function (err, res) {

  forEach(res || {}, function(blog_id, path, next){

    if (!blog_id || !path) return next();

    fs.remove(local_path(blog_id, ''), function(err){

      if (err) throw err;

      fs.symlink(path, local_path(blog_id, ''), function(err){

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