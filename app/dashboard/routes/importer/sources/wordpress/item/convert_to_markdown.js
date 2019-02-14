var Turndown = require("turndown");
var turndown = new Turndown();
var debug = require('debug')('blot:importer:wordpress:markdown');

module.exports = function(entry, callback) {
  debug();
  debug();
  debug('Input HTML:');
  debug();
  debug(entry.html);

  entry.content = turndown.turndown(entry.html);

  entry.content = entry.content.trim();

  debug();
  debug();
  debug('Result:');
  debug();
  debug(entry.content);

  callback(null, entry);
};
