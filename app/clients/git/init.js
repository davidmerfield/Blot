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

    contents.forEach(function(handle){

      if (handle[0] === '.') return;

      handle = handle.slice(0, handle.indexOf('.'));

      start_listener(handle);
    });
  });
}

module.exports = init;