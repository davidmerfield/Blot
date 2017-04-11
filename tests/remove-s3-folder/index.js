var removeFolder = require('../../app/upload/removeFolder');
var files = __dirname + '/files';
var blogID = require('./blogID');

console.log('uploading contents of', files);


  console.log('removing s3 upload folder for', blogID);

removeFolder(blogID, function(err){

  if (err) throw err;

  console.log('HERE');
});
