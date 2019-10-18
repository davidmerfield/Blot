var path = require("path");
var logDir = path.resolve(__dirname + "../../../logs");
var config = require("../../config");
var type = require("./type");

var fs = require("fs");
var logToConsole;

// Do nothing in production
if (config.environment !== "development") logToConsole = function() {};
else logToConsole = console.log;

function log(config) {
  config = config || {};
  config.file = config.file || "all";
  config.prefix = config.prefix || "";

  function writeLine(info) {
    if (type(info, "array")) {
      for (var i in info) writeLine(info[i]);
      return this;
    }

    var line = config.prefix + ": " + info;

    fs.appendFile(logDir + "/" + config.file + ".log", line + "\n", function(
      err
    ) {
      if (err) throw err;
    });

    logToConsole(line);

    return this;
  }

  writeLine.set = function(newConfig) {
    for (var i in newConfig) config[i] = newConfig[i];
    return this;
  };

  writeLine.prefix = function(prefix) {
    config.prefix = prefix;
    return this;
  };

  return writeLine;
}

// var doThis = log({file: '404', prefix: '404'});

// doThis('abc');
// doThis('THIS');
// doThis('That');

// doThis.set({file: 'abc'});
// doThis.set({prefix: '213'});

// doThis('SYNCED ME');
// doThis('heyoo');
// doThis('WHAT iS UP DOC');

module.exports = log;
