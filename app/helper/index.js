module.exports = (function () {

  var helper = {};

  // Load the other route files in this folder
  require('fs').readdirSync(__dirname).forEach(function(file) {

    if (file === "index.js" || file.substr(file.lastIndexOf('.') + 1) !== 'js')
      return;

    var name = file.substr(0, file.lastIndexOf('.'));

    helper[name] = require('./' + name);
  });

  return helper;
}())