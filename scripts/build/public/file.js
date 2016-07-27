var dirname = require('path').dirname;
var handlers = require('./handlers');
var mkdirp = require('mkdirp');
var helper = require('helper');
var copy = helper.copyFile;
var log = require('single-line-log').stdout;

module.exports = function file (source, output, callback) {

  log('... ' + source);

  // Create a folder to contain the file
  // if it does not already exist.
  mkdirp.sync(dirname(output));

  function done (err) {

    if (err) {
      log(); // clear log line
      console.log('⚠  Error: failed to build, copying file as-is', source);
      console.log(err.message.trim());
      copy(source, output, callback);
    } else {
      callback();
    }

  }

  // Check to see if the file's extension
  // matches one of the handlers registered.
  // For instances, .css files are passed to
  // the css handler, which minifies and gzips.
  for (var i in handlers)
    if (handlers[i].is(source))
      return handlers[i](source, output, done);

  // If we reach this point, there is no special
  // handler for this file so we just copy it
  // from the source folder to the output folder
  copy(source, output, done);
};