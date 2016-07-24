var mime = require('mime');

mime.default_type = 'text/html';

// We have to deal with a bs full name + ext
// thing. eventually save template's full name
module.exports = function (req, res, next) {

  if (req.body.fullName) {

    var name = req.body.fullName;
    var type = mime.lookup(name);

    if (name.indexOf('.') > -1)
      name = name.slice(0, name.indexOf('.'));

    req.body.name = name;
    req.body.type = type;

    delete req.body.fullName;

  }

  return next();
};