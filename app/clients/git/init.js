var fs = require('fs-extra');
var REPO_DIR = __dirname + '/data';
var start_listener = require('./start_listener');

function create_and_read (dir, callback) {

  fs.ensureDir(REPO_DIR, function(err){

    if (err) return callback(err);
    
    fs.readdir(REPO_DIR, callback);
  });
}

function init (callback) {

  fs.readdir(REPO_DIR, function initialize (err, contents) {

    if (err && err.code === 'ENOENT') return create_and_read(REPO_DIR, initialize);

    if (err) return callback(err);

    contents.forEach(function(blog_id){

      if (blog_id[0] === '.') return;

      blog_id = blog_id.slice(0, blog_id.indexOf('.'));

      start_listener(blog_id);
    });
  });
}

module.exports = init;