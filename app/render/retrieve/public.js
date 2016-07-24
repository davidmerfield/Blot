var Metadata = require('../../models/metadata');

module.exports = function (req, callback) {

  Metadata.readdir(req.blog.id, '/public', function(err, files){

    // The user doesn't have a public folder
    // and that's OK!
    if (err && err.code === 'ENOENT')
      return callback(null, files);

    return callback(err, files);
  });

};