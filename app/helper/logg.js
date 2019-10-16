var config = require("../../config");
var type = require("./type");
var makeUid = require("./makeUid");
var indent = "     ";

function init(fix) {
  fix = fix || "";

  function log() {
    var args = arguments;

    if (type(fix) === "object") {
      var _fix = "";

      if (fix.uid) _fix += "User: " + fix.uid + " ";

      if (fix.process) _fix += fix.process + ": " + makeUid(3);

      fix = _fix;
    }

    var pre = fix.trim().length ? fix + ": " : fix;

    if (args.length === 1 && type(args[0]) === "array")
      return logArr(pre, args[0]);

    if (args.length === 1 && type(args[0]) === "object")
      return logObj(pre, args[0]);

    var response = [];

    for (var i in args) response.push(args[i]);

    console.log(pre + response.join(" "));
  }

  log.repeat = function() {
    if (arguments[0] === undefined) arguments = ["-"];

    var first = arguments[0];
    var total = arguments[1];

    delete arguments[1];

    while (arguments[0].length < (total || 40))
      arguments[0] = arguments[0] + first;

    return init().apply(this, arguments);
  };

  log.line = log.repeat;

  log.indent = function() {
    var indent = "";

    while (indent.length <= fix.length + 1 && indent.length <= 4) indent += " ";

    return init(indent).apply(this, arguments);
  };

  log.debug = function() {
    function foo() {}

    for (var i in init()) {
      foo[i] = foo;
    }

    if (!config.debug) return foo;

    return init(fix).apply(this, arguments);
  };

  log.nofix = function() {
    return init().apply(this, arguments);
  };

  return log;
}

init.debug = function(prefix, override) {
  function foo() {}

  for (var i in init()) {
    foo[i] = foo;
  }

  if (!config.debug) return foo;

  return init(prefix);
};

function logObj(prefix, obj) {
  return console.log(obj);

  console.log(prefix + "{");

  for (var i in obj) console.log(indent + "  " + i + ": " + obj[i]);

  console.log(indent + "}");
}

function logArr(prefix, arr) {
  return console.log(arr);

  console.log(prefix + "[");

  for (var i in arr) console.log(indent + "  " + arr[i] + ", ");

  console.log(indent + "]");
}

function tests() {
  var log = new init("Foo");

  log("Hello", "one", "two");
  log([0, 1, 2, 3]);
  log({ foo: "bar" });

  var log = new init("Debug");

  log.debug("Baz");
  log.debug("Bat");

  var log = new init("Indent");

  log("First thing...");
  log.indent("second thing");
  log.indent("third thing");
  log("Another thing....");

  var log = new init("Repeat");

  log.repeat("-", 100);
  log.line();
}

module.exports = init;
