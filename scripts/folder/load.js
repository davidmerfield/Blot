var fs = require('fs-extra');
var helper = require('helper');
var join = require('path').join;
var blog_dir = join(helper.rootDir, 'blogs');
var load_db = require('../db/load');
var dumps = join(__dirname, 'dumps');
var config = require('config');

var BLOG_ID = "1";
var DROPBOX_FOLDER_PATH = "/Users/David/Dropbox/Apps/Blot test";

if (require.main === module) {

  var identifier = process.argv[2];

  if (!identifier) return print_available();

  main(identifier, function(err){

    if (err) throw err;

    process.exit();
  });
}



function main (label, callback) {

  fs.remove(blog_dir, function(err){

    if (err) return callback(err);

    load_db(label, function(err){

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

function load_dir (dir) {

  return fs.readdirSync(dir).filter(function(e){

    return fs.statSync(dir + '/' + e).isDirectory();
  });
}

function print_available () {

  var all_dumps = load_dir(dumps);

  console.log('Please choose one of the available folders:');

  console.log();

  
  for (var i in all_dumps) {
    console.log('',all_dumps[i]);
  }
    

  console.log('');
}


// save the contents of the blogs folder to /dumps

// save the state of the database

