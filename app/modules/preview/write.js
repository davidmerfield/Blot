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

    client.writeFile(remotePath, contents, function then (err) {

      // Happens when the user removes the parent directory for
      // the draft. Don't bother writing again.
      if (err && err.status === 404)
        return;

      // Happens when the user makes a series of overlapping updates
      // to draft file, so Blot issues simultaneous requests to write
      // the preview file. Not a big deal, since the preview file's
      // contents don't change (just an iframe to Blot).
      if (err && err.status === 503)
        return;

      if (err) console.log(err);
    });
  });
};