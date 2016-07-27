var fs = require('fs');
var write = fs.writeFileSync;
var read = fs.readFileSync;

var mustache = require('mustache');
var CleanCSS = require('clean-css');
var minimize = new CleanCSS();

var is = require('./_is');
var locals = require('./_locals');

function css (source, output, callback) {

  try {

    var CSS;

    CSS = read(source, 'utf-8');
    CSS = mustache.render(CSS, locals);
    CSS = minimize.minify(CSS);

    write(output, CSS, 'utf-8');

  } catch (e) {

    return callback(e);
  }

  callback();
}

css.is = is('.css');

module.exports = css;