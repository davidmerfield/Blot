var get = require('../blog/get');
var helper = require('../../app/helper');
var blogDir = helper.blogDir;
var removeFile = helper.removeFile;
var fs = require('fs');

// called from command line
if (require.main !== module) throw 'Use me from the command line';

var handle = process.argv[2];

if (!handle) throw 'Please pass the user\'s handle as an argument.';

get(handle, function(user, blog){

  var blogFolder = blogDir + '/' + blog.id;

  console.log(blogFolder);

  removeFile(blogFolder, function(err){

    if (err) throw err;

    fs.mkdir(blogFolder, function(err){

      if (err) throw err;
    });
  });
});