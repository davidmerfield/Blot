
var fs = require('fs');
var mustache = require('mustache');
var path = require('path');
var _ = require('lodash');
var helper = require('./helper');
var config = require('../config');

var APPDIR = path.resolve(__dirname) + '/';
var ASSETDIR = APPDIR + '/assets/';

var MINPREFIX = 'min_';

var locals = {
  protocol: config.protocol,
  host: config.host,
  title: config.title,
  cacheID: (new Date()).getTime()
};

buildScripts();
buildCSS('site');
buildCSS('style');
buildTemplates();

if (config.environment === 'development') {

  console.log('Watching css for changes');

  fs.watch(ASSETDIR + 'site.css', function(){

    console.log('CSS CHANGED!');
    buildCSS('site');
  });

  fs.watch(ASSETDIR + 'style.css', function(){

    console.log('CSS CHANGED!');
    buildCSS('style');
  });
}

function buildScripts () {

  /// SCRIPTS
  var UglifyJS = require('uglify-js'),
      scriptsDir = ASSETDIR + 'scripts/';

  fs.readdirSync(scriptsDir).forEach(function(filename){

    if (filename.slice(0, 1) === '.' ||
        filename.slice(0, MINPREFIX.length) === MINPREFIX ||
        filename.slice(-3) !== '.js') return;

    var JS = UglifyJS.minify(scriptsDir + filename).code;

    fs.writeFileSync(scriptsDir + MINPREFIX + filename, mustache.render(JS, locals));
  });
}


console.log('Minification of assets complete!');
