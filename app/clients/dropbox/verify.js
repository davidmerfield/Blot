// uses dropbox as source of truth
// so only do this once the folder setup is complete

const createClient = require("./util/createClient");
const localPath = require("helper/localPath");
const fs = require("fs-extra");

module.exports = function (blogID, callback) {
  createClient(blogID, function (err, client, account) {
    const compare = new Compare(blogID, client);

    // try and establish a sync lock where possible?
    compare("/", function (err, changes) {});
  });
};

function Compare(blogID, client) {
  return async function (path, callback) {
    // folderID will be an empty string if the blog is set up as
    // root directory of the folder to which Blot has access.
    if (folderID) {
      // The reason we look up the metadata for the blog's folder
      // is to make sure we can filter the list of all changes to
      // only those made to the blog folder. We pass the ID instead
      // of the folder path because the user may rename the folder.
      requests.push(client.filesGetMetadata({ path: folderID }));
    }

    const remoteItems = await client.filesListFolder({
      path: path,
    });

    const localItems = await fs.readdir(localPath(blogID, path));
  };
}
