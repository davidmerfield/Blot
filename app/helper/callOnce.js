module.exports = function callOnce (f) {
  var called = false;
  return function foo () {
    var args = arguments;
      if (!called) {
          f.apply(this, args);
      }
      called = true;
  };
};