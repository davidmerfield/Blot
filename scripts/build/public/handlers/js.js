var UglifyJS = require('uglify-js');
var mustache = require('mustache');
var fs = require('fs');
var write = fs.writeFileSync;

var locals = require('./_locals');
var is = require('./_is');

function js (source, output, callback) {

  try {

    var script = UglifyJS.minify(source).code;

    script = mustache.render(script, locals);

    write(output, script, 'utf-8');

  } catch (e) {

    return callback(e);
  }

  callback();
}

js.is = is('.js');

module.exports = js;