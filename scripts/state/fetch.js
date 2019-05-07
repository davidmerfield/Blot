var fs = require('fs-extra');
var Blog = require('blog');
var helper = require('helper');
var join = require('path').join;
var blog_dir = join(helper.rootDir, 'blogs');
var load_db = require('../db/load');
var config = require('config');
var access = require('../access');
var DropboxDatabasePrivate = require('../../app/clients/dropbox/database');
var remote = require('../remote');

var DUMP_WITH_TEST_ACCOUNT = 'with_user_empty_blog';
var BLOG_ID = "1";
var DROPBOX_FOLDER_PATH = "/Users/David/Dropbox/Apps/Blot test";


if (require.main === module) {

  var identifier = process.argv[2];

  if (!identifier) throw new Error('Please pass the username of the blog whose folder you want to download');

  main(identifier, function(err){

    if (err) throw err;

    process.exit();
  });
}


// what do  I want from this?
// to be able to say:
// fetch/folder jack and then recieve a log in link:

// 1. load latest remote database containing the username jack
// 2. fetch the contents of jack's folder from remote and install them in his blog directory
// 3. replace his Dropbox sync info with my Dropbox test account
// 4. Copy files from his directory to my Dropbox test account
// 5. generate log in link

function replace_dropbox_account (blog_id, test_account, callback) {

  DropboxDatabasePrivate.set(blog_id, test_account, function(err){
    
    if (err) return callback(err);

    try {
      fs.emptyDirSync(DROPBOX_FOLDER_PATH);
      fs.copySync(join(blog_dir, blog_id), DROPBOX_FOLDER_PATH);
    } catch (e) {
      return callback(e);
    }

    callback();
  });
} 

function dropbox_test_account (callback) {

  load_db(DUMP_WITH_TEST_ACCOUNT, function(err){

    if (err) return callback(err);

    DropboxDatabasePrivate.get(BLOG_ID, callback);
  });
}

function fetch_remote_blog_directory (blog_id, callback) {

  var local_dir = join(blog_dir, blog_id);
  var remote_dir = join(remote.root, 'blogs', blog_id);

  console.log('Blog files:', local_dir);

  fs.emptyDirSync(local_dir);
  remote.fetchdir(remote_dir, local_dir, callback);
}

function get_blog_id (handle, callback) {

  // Load latest database
  load_db(null, function(err){

    if (err) return callback(err);

    Blog.get({handle: handle}, function(err, blog){

      if (err || !blog) return callback(new Error('No blog with username ' + handle));

      callback(null, blog.id);
    });
  });
}

  
function main (handle, callback) {

  console.log('Fetching test account...');

  // This must happen before we get the blog ID
  dropbox_test_account(function(err, test_account){

    if (err) return callback(err);
    
    console.log('Getting blog id for ' + handle + '...');
  
    // Now we have the production dump loaded
    get_blog_id(handle, function(err, blog_id){

      if (err) return callback(err);

      console.log('Fetching remote directory ' + handle + '...');

      fetch_remote_blog_directory(blog_id, function(err){

        if (err) return callback(err);

        console.log('Replacing dropbox acccount info...');

        replace_dropbox_account(blog_id, test_account, function(err){

          if (err) return callback(err);

          fs.emptyDir(config.cache_directory, function(err){
        
            if (err) return callback(err);
      
            access(handle, callback);
          });
        });
      });
    });
  });
}

require('shelljs/global');
require('../only_locally');

var moment = require('moment');
var join = require('path').join;
var Remote = require('../remote');
var download = Remote.download;
var execRemote = Remote.exec;
var LASTSAVE = 'redis-cli lastsave';
var BGSAVE = 'redis-cli bgsave';
var REMOTE_DUMP_PATH = Remote.root + '/db/dump.rdb';
var LOCAL_DUMPS_DIRECTORY = __dirname + '/dumps/production';
var log = console.log.bind(this, "Fetching remote db:");

// If used from the command line
if (require.main === module) main(function(err){
  
  if (err) throw err;

  process.exit();
});

function main (callback) {

  var date = moment().format('YYYY-MM-D');
  var now = Math.round(Date.now() / 1000);
  var local_dump_path = join(LOCAL_DUMPS_DIRECTORY, now + '-' + date, 'dump.rdb');

  log('Retrieving the last time db was saved to disk...');
  
  execRemote(LASTSAVE, function(err, lastsave){

    if (err) return callback(err);
    
    log('Saving db to disk');

    execRemote(BGSAVE, function(err){

      if (err) return callback(err);
      
      execRemote(LASTSAVE, function then (err, latestsave){

        if (err) return callback(err);

        // Bgsave is not yet finished...
        if (latestsave === lastsave) {
          log('... Checking if db was saved to disk...');
          return execRemote(LASTSAVE, then);
        }

        log('Done! Downloading db');

        download(REMOTE_DUMP_PATH, local_dump_path, function(err){

          if (err) return callback(err);
            
          log('Download complete!');
          callback();
        });
      });
    });
  });
}

module.exports = main;