require('shelljs/global');
require('../only_locally');

var fs = require('fs');
var redis = require('redis').createClient();
var dumps = __dirname + '/dumps/user';
var helper =  require('helper');
var mkdirp = helper.mkdirp;

if (require.main === module) {

  var options = require('minimist')(process.argv.slice(2));

  main(options._[0], process.exit);
}

function main (label, callback) {


  var now = Date.now();
  var dirname = now;
  var identifier = now + '';


  if (label) {
    dirname = label;
    identifier = label;
  }

  var dir = dumps + '/' + dirname;
  var saved = dir + '/dump.rdb';

  var current = fs.realpathSync(__dirname + '/../../db/dump.rdb');


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

        callback();
      });
    });
  });
}


module.exports = main;