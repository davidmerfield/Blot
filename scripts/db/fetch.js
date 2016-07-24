require('shelljs/global');
require('../only_locally');

var moment = require('moment');

var Remote = require('../remote');

var download = Remote.download;
var execRemote = Remote.exec;

var dumps = __dirname + '/dumps/production';

var date = moment().format('YYYY-MM-D');
var now = Math.round(Date.now() / 1000);
var dir = now + '-' + date;

var localPath = dumps + '/' + dir + '/dump.rdb';
var remotePath = Remote.root + '/db/dump.rdb';

var LASTSAVE = 'redis-cli lastsave';
var BGSAVE = 'redis-cli bgsave';

console.log('Retrieving the last time db was saved to disk...');

execRemote(LASTSAVE, function(err, lastsave){

  if (err) throw err;

  console.log('Saving db to disk...');

  execRemote(BGSAVE, function(err){

    if (err) throw err;

    console.log('... Checking if db was saved to disk...');

    execRemote(LASTSAVE, function then (err, latestsave){

      if (err) throw err;

      // Bgsave is not yet finished...
      if (latestsave === lastsave) {
        console.log('... Checking if db was saved to disk...');
        return execRemote(LASTSAVE, then);
      }

      console.log('Done! Downloading...');
      download(remotePath, localPath, function(err){

        if (err) throw err;

        process.exit();
      });
    });
  });
});