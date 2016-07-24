require('shelljs/global');
require('../only_locally');

var fs = require('fs');
var dumps = __dirname + '/dumps/user';
var helper =  require('../../app/helper');
var mkdirp = helper.mkdirp;

var now = Date.now();
var dirname = now;
var identifier = now + '';

var options = require('minimist')(process.argv.slice(2));
var custom = options._[0];

if (custom) {
  dirname = custom;
  identifier = custom;
}

var dir = dumps + '/' + dirname;
var saved = dir + '/dump.rdb';

var redis = require('redis').createClient();
var current = fs.realpathSync(__dirname + '/../../dump.rdb');


console.log('Saving database to disk...');
redis.save(function(err, stat){

  if (err || !stat) throw err || 'No stat';

  console.log('Moving database dump...');

  mkdirp(dir, function(err){

    if (err) throw err;

    exec('cp ' + current + ' ' + saved, function(code, stdout, stderr){

      if (code) throw stderr;

      console.log('Done! Load this dump with this command:');
      console.log();
      console.log('node scripts/db/load ' + identifier);
      console.log();

      process.exit();
    });
  });
});
