// # RESTART
// 12. write robust re-start script
// - set NODE_ENV=production
// - minifies before rebooting server
// - safelys closes server
// - waits til all syncs are over or saves current syncs
// - til all upload images are done... (entries, profile pics)
// - client.quit() for redis
// - client.unref() for redis
// - Use forever API
// https://github.com/foreverjs/forever#using-forever-module-from-nodejs
// - email me with errors

require('shelljs/global');
var options = require('minimist')(process.argv.slice(2));

var config = require('../config');
var build = require('./build');
var plugins = require('./blog/plugins');
var forEach = require('../app/helper').forEach;

// Development 'mode'
if (options.d) {
  options.a = true; // stream log file to stdout
  options.q = true; // quick (don't build assets)
}

if (require.main !== module) throw 'Call me from the command line';

var rootDir;

if (config.environment === 'development') {
  rootDir = '/Users/David/Projects/Blot';
} else {
  rootDir = '/var/www/blot';
}

var log = require('./logs/list');
var mainLog = log.dir + '/blot.log';

function install (cb) {
  console.log('Running npm install to ensure all packages are valid...');
  exec('npm install', function(err){
    if (err) throw err;
    cb();
  });
}

function rotatelogs (cb) {

  console.log('Rotating log files...');

  var subDir = config.environment === 'development' ? 'development' : 'production';
  var newDir = log.dir + '/' + subDir + '/' + Date.now();

  exec('mkdir ' + newDir);

  forEach(log.names, function(name, next){

    var from = log.dir + '/' + name;
    var to = newDir + '/' + name;

    exec('cp ' + from + ' ' + to, {silent: true});
    exec('echo "" > ' + from, {silent: true});
    next();
  }, cb);
}

var stop = 'forever stop ' + rootDir + '/server.js';

function restart (cb) {

  var app_options = '-l "' + mainLog + '" --append';

  var start = 'forever start ' + app_options + ' ' + rootDir + '/server.js ' ;

  console.log('Restarting app server...');
  exec(stop, {silent:true});
  exec('echo "" > ' + mainLog, {silent: true});
  exec(start, {silent:true});
  cb();
}

var queue = [
  rotatelogs,
  restart
];

if (!options.q) {
  queue.unshift(install);
  queue.unshift(plugins);
  queue.unshift(build);
}

forEach(queue, function(method, next){

  method(next);

}, function(){

  console.log('App server is running!');

  if (!options.a) {
    process.exit();
  } else {
    exec('tail -f ' + mainLog);
  }
});
