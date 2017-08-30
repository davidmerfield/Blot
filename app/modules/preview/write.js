var drafts = require('../../drafts');
var helper = require('../../helper');
var ensure = helper.ensure;

module.exports = function (blogID, client, path) {

  ensure(blogID, 'string')
    .and(client, 'object')
    .and(path, 'string');

  drafts.previewFile(blogID, path, function (err, remotePath, contents) {

    if (err) {
      console.log(err);
      if (err.trace) console.log(err.trace);
      if (err.stack) console.log(err.stack);
      return;
    }

    client
      .filesUpload({path: remotePath, contents: contents})
      .then(function(){


      })
      .catch(function(err){

        console.log(err);

      });

  });
};