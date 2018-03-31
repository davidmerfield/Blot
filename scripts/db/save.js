require('shelljs/global');
require('../only_locally');

var fs = require('fs');
var yesno = require('yesno');
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

  verify_overwrite(identifier, saved, function(err){

    if (err) throw err;

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
  });
}

function verify_overwrite (identifier, path, callback) {

  if (!exists(path)) return callback();

  yesno.ask("Overwrite existing database "  + identifier + "? y / n", false, function(yes){

    if (yes) {
      callback();
    } else {
      callback('Do not overwrite file');
    }
  });
}

function exists (path) {

  var result = true;

  try {
    fs.statSync(path);
  } catch (e) {
    result = false;
  }

  return result;

}

module.exports = main;