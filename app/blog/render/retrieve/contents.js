var Entry = require("entry");
var reds = require("reds");
var transliterate = require("transliteration");

module.exports = function(req, callback) {
  var blogID = req.blog.id;

  // We couldn't find a search query
  if (!req.query.path) {
    path = '/';
  }

  fs.readdir(localPath(req.blog.id, path), function(err, contents){

		callback(null, contents);
  })
};
