var fs = require('fs-extra');
var helper = require('helper');
var join = require('path').join;
var blog_dir = join(helper.rootDir, 'blogs');
var load_db = require('../db/load');
var dumps = join(__dirname, 'dumps');

var BLOG_ID = "1";
var DROPBOX_FOLDER_PATH = "/Users/David/Dropbox/Apps/Blot test";

if (require.main === module) {

  var options = require('minimist')(process.argv.slice(2));

  main(options._[0], function(err){

    if (err) throw err;

    process.exit();
  });
}


function main (label, callback) {

  fs.remove(blog_dir, function(err){

    if (err) return callback(err);

    load_db(label, false, function(err){

      if (err) return callback(err);
      
      fs.copy(join(dumps, label), blog_dir, function(err) {

        if (err) return callback(err);
        
        fs.emptyDir(config.cache_directory, function(err){
      
          if (err) return callback(err);
  
          fs.emptyDir(DROPBOX_FOLDER_PATH, function(err){

            if (err) return callback(err);
      
            fs.copy(join(blog_dir, BLOG_ID), DROPBOX_FOLDER_PATH, function(err){

              if (err) return callback(err);
    
              callback();
            });
          });
        });
      });
    });
  });

}

// save the contents of the blogs folder to /dumps

// save the state of the database

