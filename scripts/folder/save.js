var fs = require('fs-extra');
var helper = require('helper');
var join = require('path').join;
var blog_dir = join(helper.rootDir, 'blogs');
var save_db = require('../db/save');
var dumps = join(__dirname, 'dumps');

if (require.main === module) {

  var options = require('minimist')(process.argv.slice(2));

  main(options._[0], function(err){

    if (err) throw err;

    process.exit();
  });
}


function main (label, callback) {

  fs.copy(blog_dir, join(dumps, label), function(err) {

    if (err) return callback(err);
      
    save_db(label, function(err){

      if (err) return callback(err);

      callback();
    });
  });
}

// save the contents of the blogs folder to /dumps

// save the state of the database

