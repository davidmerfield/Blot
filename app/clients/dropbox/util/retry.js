var async = require("async");

// Here's a simple example...
// function waitAndGuess(string, callback) {
//   var delay = Math.random() * 2000;
//   var guess = Math.random();
//   console.log(string, "Waiting...", delay, guess);
//   setTimeout(function() {
//     console.log(string, "Guessing...");
//     if (guess > 0.5) {
//       callback(null);
//     } else {
//       console.log(string, "Failure!");
//       callback(new Error("No thanks"));
//     }
//   }, delay);
// }

// var waitAndGuess = retry(waitAndGuess, {timeout: 1000});

// waitAndGuess("hello", function(err) {
//   if (err) throw err;
//   console.log("Success!");
// });

function retry(fn, options) {
  options = options || {};

  // Set our defaults
  options.times = options.times || 5;

  // Exponential backoff
  options.interval = options.interval || exponential;

  return function() {
    var args = Array.prototype.slice.call(arguments);
    var callback = args.pop();


    // This is a trick to use bind with an array
    // of arguments. Not sure if this can be
    // expressed more elegantly...
    // fn = Function.bind.apply(fn, [null].concat());

    if (options.timeout) fn = async.timeout(fn, options.timeout);

    async.retry(
      options,
      function (done) {
        fn.apply(null, args.concat(done));
      },
      callback
    );
  };
}

// Exponential backoff
function exponential(retryCount) {
  return 50 * Math.pow(2, retryCount);
}

module.exports = retry;
