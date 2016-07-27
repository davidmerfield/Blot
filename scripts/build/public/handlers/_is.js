var extname = require('path').extname;

module.exports = function () {

  var args = arguments;

  return function (path) {

    var extension = extname(path).trim().toLowerCase();

    for (var i = 0; i < args.length; i++)
      if (args[i] === extension) {
        return true;
      }

    return false;
  };
};