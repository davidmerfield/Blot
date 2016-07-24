require('shelljs/global');
require('../only_locally');

var helper =  require('../../app/helper');
var rootDir = helper.rootDir;

var fs = require('fs');

var dump = rootDir + '/db/dump.rdb';

var productionDir = __dirname + '/dumps/production';
var userDir = __dirname + '/dumps/user';

var productionDumps = loaddir(productionDir);
var userDumps = loaddir(userDir);

var NO_REDIS = 'Could not connect to Redis at 127.0.0.1:6379: Connection refused\n';
var silent = {silent: true};

if (require.main === module) {

  var options = require('minimist')(process.argv.slice(2));

  main(options, process.exit);
}

function main (options, callback) {

  var useLatest = !!options.l;
  var identifier = useLatest ? productionDumps.pop() : options._[0] || '';

  var isProduction = fs.existsSync(dumpPath(productionDir, identifier));

  var newDump = isProduction ? dumpPath(productionDir, identifier) : dumpPath(userDir, identifier);
  var dumpExists = fs.existsSync(newDump);

  if (!dumpExists) {

    if (identifier) {
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      console.log('There is no dump called "' + identifier + '"');
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      console.log();
    }

    printAvailable();

    return callback();
  }

  var DISABLE_SAVE = 'redis-cli CONFIG SET appendonly no && redis-cli CONFIG SET save ""';
  var COPY_DUMP = 'cp ' + newDump + ' ' + dump;
  var STOP_REDIS = 'redis-cli shutdown';
  var START_REDIS = 'redis-server ' + rootDir + '/config/redis.conf';


  console.log('Preventing current redis server from saving to disk...');

  exec(DISABLE_SAVE, silent, function(err, out){

    if (err && out !== NO_REDIS) throw err + out;

    console.log('Moving new dump into place...');

    exec(COPY_DUMP, silent, function(err){

      if (err) throw err;

      console.log('Shutting down current redis server...');

      exec(STOP_REDIS, silent, function (err, out) {

        if (err && out !== NO_REDIS) throw err + out;

        console.log('Restarting redis server with new dump file...');

        exec(START_REDIS, silent, function (err) {

          if (err) throw err;

          console.log('Done! "' + identifier + '" has been loaded into redis!');
          callback();
        });
      });
    });
  });

}


// Give the user a nice list of available
// database dump files. Would be nice to show mtime?
// Perhaps filter only those which have dump files?
function printAvailable () {

  console.log('Please choose one of the available databases:');

  console.log();
  console.log('PRODUCTION:');

  for (var i in productionDumps)
    console.log('',productionDumps[i]);

  console.log();
  console.log('USER:');

  for (var x in userDumps)
    console.log('',userDumps[x]);

  console.log('');
}

function loaddir (dir) {
  return fs.readdirSync(dir).filter(function(e){


    return fs.existsSync(dir + '/' + e + '/dump.rdb');
  });
}

function dumpPath (dir, identifier) {
  return dir + '/' + identifier + '/dump.rdb';
}


module.exports = main;