var mime = require("mime");

mime.default_type = "text/html";

// We have to deal with a bs full name + ext
// thing. eventually save template's full name
module.exports = function(req, res, next) {
  if (req.body.fullName) {
    var name = req.body.fullName;
    var type = mime.lookup(name);

    if (name.indexOf(".") > -1) name = name.slice(0, name.indexOf("."));

    // Replace slashes with dashes. Slashes seem to cause
    // bugs for reasons unknown to me.
    name = name.split("/").join("-");

    // Remove leading and trailing dashes
    if (name[0] === "-") name = name.slice(1);
    if (name[name.length - 1] === "-") name = name.slice(0, -1);

    req.body.name = name;
    req.body.type = type;

    delete req.body.fullName;
  }

  return next();
};
