var config = require('../../config');

var fs = require('fs');
var path = require('path');
var mustache = require('mustache');

var plugins = require('./plugins');

var locals = {
  protocol: config.protocol,
  host: config.host,
  title: config.title,
  cacheID: Date.now()
};

var HOME = path.resolve(__dirname + '/../../');

var DIST = HOME + '/www/blot';
var SRC = HOME + '/public/blot';

var SCRIPTSDIR = '/scripts/';
var CSSDIR = '/css/';
var TEMPLATEDIR = HOME + '/app/templates';

var UglifyJS = require('uglify-js');

function scripts (dir) {

  console.log('BUILDING SCRIPTS');

  dir = dir || SCRIPTSDIR;

  fs.readdirSync(SRC + dir).forEach(function(filename){

    if (filename.slice(0, 1) === '.' ||
        filename.slice(-3) !== '.js') return;

    var JS = UglifyJS.minify(SRC + dir + filename).code;

    try {
      JS = mustache.render(JS, locals);
    } catch (e) {
      console.log('ERROR RENDERING', dir, filename);
    }

    console.log('-- SAVED MINIFIED', filename);
    fs.writeFileSync(DIST + dir + filename, JS);
  });
}

var CleanCSS = require('clean-css');
var minimize = new CleanCSS();

function css (dir) {

  dir = dir || CSSDIR;

  console.log('BUILDING CSS');

  fs.readdirSync(SRC + dir).forEach(function(filename){

    if (filename.slice(0, 1) === '.' ||
        filename.slice(-4) !== '.css') return;

    var CSS = '';

    try {

      CSS = fs.readFileSync(SRC + dir + filename, {encoding: 'utf8'});
      CSS = mustache.render(CSS, locals);
      CSS = minimize.minify(CSS);

    } catch (e) {
      console.log(e);
    }

    console.log('-- SAVED MINIFIED', filename);

    fs.writeFileSync(DIST + dir + filename, CSS);

  });
}

var watch = require('node-watch');


var templates = require('./templates');

function main (callback) {

  plugins();

  css();

  scripts();

  templates();

  // Help page
  require('./help');

  // Flush the cache!
  require('../../app/cache').flush();

  if (config.environment === 'development') {
    console.log('Watching public directory for changes');
    watch(SRC + SCRIPTSDIR, function(){scripts()});
    watch(SRC + CSSDIR, function(){css()});
    watch(TEMPLATEDIR, function(){templates()});
  }

  callback();
}

if (require.main === module) {
  main(function(){
    console.log('done');
  });
}

module.exports = main;