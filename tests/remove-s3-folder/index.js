var removeFolder = require('../../app/upload/removeFolder');
var blogFolder = require('../../app/upload/blogFolder');
var files = __dirname + '/files';
var blogID = require('./blogID');

console.log('removing s3 upload folder for', blogID, blogFolder(blogID));

removeFolder(blogID, function(err){

  if (err) throw err;

  console.log('HERE');
});