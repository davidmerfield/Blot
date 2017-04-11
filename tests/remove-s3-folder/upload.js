var forEach = require('../../app/helper').forEach;
var upload = require('../../app/upload');
var readdir = require('fs').readdirSync;
var files = __dirname + '/files';
var blogID = require('./blogID');

console.log('Uploading contents of', files);

forEach.multi(100)(readdir(files), function(filename, next){

  upload(files + '/' + filename, {blogID: blogID}, function(err){

    if (err) throw err;

    console.log('>>', filename);

    next();
  });
}, process.exit);