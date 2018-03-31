require('shelljs/global');
require('../only_locally');

var moment = require('moment');
var join = require('path').join;
var Remote = require('../remote');
var download = Remote.download;
var execRemote = Remote.exec;
var LASTSAVE = 'redis-cli lastsave';
var BGSAVE = 'redis-cli bgsave';
var REMOTE_DUMP_PATH = Remote.root + '/db/dump.rdb';
var LOCAL_DUMPS_DIRECTORY = __dirname + '/dumps/production';
var log = console.log.bind(this, "Fetching remote db:");

// If used from the command line
if (require.main === module) main(function(err){
  
  if (err) throw err;

  process.exit();
});

function main (callback) {

  var date = moment().format('YYYY-MM-D');
  var now = Math.round(Date.now() / 1000);
  var local_dump_path = join(LOCAL_DUMPS_DIRECTORY, now + '-' + date, 'dump.rdb');

  log('Retrieving the last time db was saved to disk...');
  
  execRemote(LASTSAVE, function(err, lastsave){

    if (err) return callback(err);
    
    log('Saving db to disk');

    execRemote(BGSAVE, function(err){

      if (err) return callback(err);
      
      execRemote(LASTSAVE, function then (err, latestsave){

        if (err) return callback(err);

        // Bgsave is not yet finished...
        if (latestsave === lastsave) {
          log('... Checking if db was saved to disk...');
          return execRemote(LASTSAVE, then);
        }

        log('Done! Downloading db');

        download(REMOTE_DUMP_PATH, local_dump_path, function(err){

          if (err) return callback(err);
            
          log('Download complete!');
          callback();
        });
      });
    });
  });
}

module.exports = main;