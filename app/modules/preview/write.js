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

    client.writeFile(remotePath, contents, function (err) {

      if (err && err.status && err.status !== 404) console.log(err);
    });
  });
};