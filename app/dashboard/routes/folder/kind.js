// https://fileinfo.com/filetypes/common

var debug = require("debug")("dashboard:folder:kind");
var extname = require("path").extname;

var KIND = {
  txt: "Plain text document",
  jpg: "JPG image",
  jpeg: "JPEG image",
  odt: "OpenDocument Text Document",
  rtf: "Rich Text File",
  doc: "Microsoft Word Document",
  docx: "Microsoft Word Document",
  ai: "Adobe Illustrator Document"
};

module.exports = function(path) {
  var kind = "File";
  var extension;

  extension = extname(path)
    .toLowerCase()
    .slice(1);
  kind = KIND[extension] || extension.toUpperCase();
  debug(path, extension, kind);

  return kind;
};
