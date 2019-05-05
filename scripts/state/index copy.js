require('shelljs/global');
require('../only_locally');

var helper =  require('helper');
var fs = require('fs-extra');
var join = require('path').join;

var DISABLE_SAVE = 'redis-cli CONFIG SET appendonly no && redis-cli CONFIG SET save ""';
var STOP_REDIS = 'redis-cli shutdown';
var START_REDIS = 'redis-server ' + helper.rootDir + '/config/redis.conf';
var NO_REDIS = 'Could not connect to Redis at 127.0.0.1:6379: Connection refused\n';

var CURRENT_DUMP = helper.rootDir + '/db/dump.rdb';
var PRODUCTION_DIR = __dirname + '/dumps/production';
var USER_DIR = __dirname + '/dumps/user';

if (require.main === module) {

  var identifier = process.argv[2];

  if (!identifier) return printAvailable();

  if (identifier === 'latest') identifier = null;

  main(identifier, function(err){

    if (err) throw err;

    process.exit();
  });
}


function main (identifier, callback) {

  var production_path, user_path, new_dump;
  var production_dumps = load_dir(PRODUCTION_DIR);

  if (!identifier) identifier = production_dumps.pop();

  production_path = join(PRODUCTION_DIR, identifier, 'dump.rdb');
  user_path = join(USER_DIR, identifier, 'dump.rdb');

  if (exists(production_path)) {
    
    new_dump = production_path;

  } else if (exists(user_path)) {

    new_dump = user_path;

  } else {

    if (identifier)
      return callback(new Error('No dump exists called ‘' + identifier + '’'));
      
    printAvailable();

    return callback();    
  }

  console.log('Preventing current redis server from saving to disk...');

  exec(DISABLE_SAVE, {silent: true}, function(err, out){

    if (err && out !== NO_REDIS) throw err + out;

    console.log('Moving new dump into place...');

    exec('cp ' + new_dump + ' ' + CURRENT_DUMP, {silent: true}, function(err){

      if (err) throw err;

      console.log('Shutting down current redis server...');

      exec(STOP_REDIS, {silent: true}, function (err, out) {

        if (err && out !== NO_REDIS) throw err + out;

        console.log('Restarting redis server with new dump file...');

        exec(START_REDIS, {silent: true}, function (err) {

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

  var production_dumps = load_dir(PRODUCTION_DIR);
  var user_dumps = load_dir(USER_DIR);

  console.log('Please choose one of the available databases:');

  console.log();
  console.log('PRODUCTION:');

  
  for (var i in production_dumps) {
    if (i == 0) console.log('', 'latest (' + production_dumps[i] + ')');
    else console.log('',production_dumps[i]);
  }
    
  console.log();
  console.log('USER:');

  for (var x in user_dumps)
    console.log('',user_dumps[x]);

  console.log('');
}

function load_dir (dir) {

  return fs.readdirSync(dir).filter(function(e){


    return fs.existsSync(dir + '/' + e + '/dump.rdb');
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
