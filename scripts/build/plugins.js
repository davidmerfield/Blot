var ncp = require('ncp').ncp;
var mkdirp = require('mkdirp');

module.exports = function() {

ncp.limit = 16;

var path = require('path');

var source = path.resolve(__dirname + '/../../public/blogs/*');
var destination = path.resolve(__dirname + '/../../www/blogs/*');

mkdirp(destination, function(err){

  if (err) throw err;

  ncp(source, destination, function (err) {

    if (err) throw err;

    console.log('');
  });
});

}