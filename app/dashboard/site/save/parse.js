var tempDir = require("helper/tempDir")();
var multiparty = require("multiparty");
var MAX_SIZE = 4 * 1024 * 1024;
var FORM_OPTIONS = {
  uploadDir: tempDir,
  maxFieldsSize: MAX_SIZE,
  maxFilesSize: MAX_SIZE,
};

var LARGE = "Image too large";

module.exports = function (req, res, next) {
  var form = new multiparty.Form(FORM_OPTIONS);

  form.parse(req, function (err, fields, files) {
    // This will almost certainly be an image too big
    // or a form field too large.
    if (err) {
      return next(new Error(LARGE));
    }

    // Map {name: ['David']} to {name: 'David'}
    // Is an idiosyncrasy of multiparty?
    for (var field in fields) fields[field] = fields[field].pop();

    req.body = fields;

    if (files.avatar) {
      req.files = { avatar: files.avatar[0] };
    }

    next();
  });
};
