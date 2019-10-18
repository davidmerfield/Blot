module.exports = (function() {
  var helper = {
    // upload: require('./upload'),
    // transformer: require('./transformer'),
    // email: require('./email')
  };

  // Load the other route files in this folder
  require("fs")
    .readdirSync(__dirname)
    .forEach(function(name) {
      if (name[0] === ".") return;

      if (name === "index.js") return;

      if (name.slice(-3) === ".js") {
        name = name.substr(0, name.lastIndexOf("."));
        helper[name] = require("./" + name);
      } else {
        helper[name] = require("./" + name);
      }
    });

  return helper;
})();
