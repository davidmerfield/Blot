var upload = require('../../app/upload');

var options = {
  bucket: 'blot-blogs'
};

var path = __dirname + '/robots.txt';

console.log(require('path').join('', '', '1','','2'));

upload(path, options, function(err, finalURL){

  if (err) console.log(err);

  if (finalURL) console.log('http:'+ finalURL);

  process.exit();
});