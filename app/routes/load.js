module.exports = function (server, dir) {

  dir = dir + '/';

  // Load the other route files in this folder
  require('fs').readdirSync(__dirname + dir).forEach(function(file) {

    if (file === "index.js" ||
        file.slice(0,1) === '_' ||
        file.charAt(0) === '.' ||
        (file.slice(-3) !== '.js' && file.indexOf('.') > -1))
      return;

    var name = file;

    // Allow directories...
    if (name.indexOf('.') > -1) {
      name = name.slice(0, name.lastIndexOf('.'));
    }

    require('.' + dir + name)(server);
  });
};