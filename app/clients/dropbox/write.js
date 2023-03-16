var join = require("path").join;
var debug = require("debug")("blot:clients:dropbox:write");
var createClient = require("./util/createClient");
var fs = require("fs-extra");
var localPath = require("helper/localPath");
var retry = require("./util/retry");
const { promisify } = require("util");
const upload = promisify(require("clients/dropbox/util/upload"));
const setMetadata = promisify(require("models/metadata").set);

// Write should only ever be called inside the function returned
// from Sync for a given blog, since it modifies the blog folder.
function write(blogID, path, contents, callback) {
  var pathInDropbox, pathOnBlot;

  debug("Blog:", blogID, "Writing", path);

  createClient(blogID, async function (err, client, account) {
    if (err || !account) return callback(err || new Error("No account"));

    pathInDropbox = join(account.folder || "/", path);

    // We must lowercase this since localPath no longer
    // does and files for the Dropbox client are stored
    // in the folder with a lowercase path.
    pathOnBlot = localPath(blogID, path.toLowerCase());

    // todo: metadata.add(case-y path here)
    if (basename(path).toLowerCase() !== basename(path))
      await setMetadata(blogID, path, basename(path));

    try {
      await fs.outputFile(pathOnBlot, contents);
      await upload(client, pathOnBlot, pathInDropbox);
    } catch (e) {
      return callback(e);
    }

    callback();
  });
}

module.exports = retry(write);
