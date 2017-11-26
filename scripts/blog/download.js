var get = require('./get');
var fs = require('fs');
var handle = process.argv[2];
var fetchdir = require('../remote/fetchdir');
var outdir = require('path').resolve(__dirname + '/../../tmp/' + handle + '-' + Date.now());

if (!handle) throw 'pass a handle';

get(handle, function (user, blog){

  if (!user || !blog) throw 'no user or no blog';

  fs.mkdirSync(outdir);

  fetchdir('/var/www/blot/blogs/' + blog.id, outdir, function(err){

    if (err) throw err;

    console.log('file://' + outdir);
  });
});