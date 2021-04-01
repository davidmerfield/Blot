var config = require("config");
var basename = require("path").basename;

// Example usage:
// var is = Is(function(x,y){return x + y});
// is(1,2,3); // succeed
// is(1,2,4); // will raise exception

function Is(doThis) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    var expected = args.slice(-1)[0];
    var inputs = args.slice(0, -1);
    var result = doThis.apply(this, inputs);

    if (expected === result) return;

    var err = new Error(source() + " unit test failed");

    console.log("----------------------------------------------------------");
    console.log("Input:    ", inputs);
    console.log("Expected: ", expected);
    console.log("Result:   ", result);
    console.log("----------------------------------------------------------");

    throw err;
  };
}

// An (incredibly brittle) way to work
// out which helper function raised the exception
function source() {
  var res = new Error().stack.split("\n")[3];

  return basename(res.slice(res.indexOf("(") + 1, res.lastIndexOf(".")));
}

if (config.production) {
  // Don't run unit tests in production
  // or perhaps after we tested them initially?
}

module.exports = Is;
