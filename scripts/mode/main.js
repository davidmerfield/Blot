var helper =  require('../../app/helper');
var root_config = require('./config');
var extend = helper.extend;
var rootDir = helper.rootDir;
var fs = require('fs');
var loadDB = require('../db/load');

var dev_config = require('./config.dev');
var live_config = require('./config.live');

var path = rootDir + '/config.json';

module.exports = function(options, callback) {

  console.log('Enabling ' + options.mode + ' mode...');

  var config = options.mode === 'dev' ? dev_config : live_config;

  extend(config).and(root_config);

  if (options.c) {
    console.log('.. cache will be on!');
    config.cache = true;
  }

  if (options.d) {
    console.log('.. debug mode will be on!');
    config.debug = true;
  }

  if (options.m) {
    console.log('.. maintenance mode will be on!');
    config.maintenance = true;
  }

  var dump = options._[0];

  fs.writeFileSync(path, JSON.stringify(config,null,2), 'utf-8');

  console.log('Wrote configuration file!');

  if (!dump && !options.l) {
    console.log('Complete!');
    return callback;
  }

  loadDB(options, function(err){

    if (err) throw err;

    console.log('Complete!');
    return callback();
  });
};