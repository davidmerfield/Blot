const fs = require("fs-extra");
const async = require("async");
const debug = require("debug")("blot:clients:dropbox:writeExistingContents");
const upload = require("clients/dropbox/util/upload");
const join = require("path").join;
const Metadata = require("metadata");
const Path = require("path");
const Entry = require("models/entry");
const localPath = require("helper/localPath");
const lowerCase = require("./lowerCase");

async function syncContents(account) {
  const localFolder = localPath(account.blog.id, "/");
  const dropboxFolder = account.folder;

  // prepare folder, making all files lowercase
  await lowerCase(localFolder);

  // this could become verify.fromBlot
  await uploadAllFiles();

  return account;
}

function uploadAllFiles() {
  Metadata.get(blogID, join(path, name), function (err, casePreservedName) {
    const source = join(localFolder, path, name);
    const destination = join(dropboxFolder, path, casePreservedName || name);
  });
  upload(account.client, source, destination, callback);
}

//   if (name === name.toLowerCase()) return callback(null, name);

//   var currentPath, parsedPath, names;
//   var originalName = name;
//   var directory = join(localFolder, path);
//   currentPath = join(directory, name);
//   parsedPath = Path.parse(currentPath);

//   names = [
//     name.toLowerCase(),
//     parsedPath.name.toLowerCase() +
//       " (conflict)" +
//       parsedPath.ext.toLowerCase(),
//   ];

//   for (var i = 1; i < 100; i++) {
//     names.push(
//       parsedPath.name.toLowerCase() +
//         " (conflict " +
//         i +
//         ")" +
//         parsedPath.ext.toLowerCase()
//     );
//   }

//   async.eachSeries(
//     names,
//     function (name, next) {
//       debug("attempting to move", currentPath, "to", join(directory, name));
//       fs.rename(currentPath, join(directory, name), function (err) {
//         if (err) {
//           debug(err);
//           return next();
//         }

//         let oldPath = join(path, originalName);
//         let newPath = join(path, name);

//         renameEntry(blogID, oldPath, newPath, name, function (err) {
//           if (err) debug(err);

//           // we need to rename the entry otherwise we get duplicates
//           debug("successfully moved", currentPath, "to", join(directory, name));
//           // The git client does not store the case-sensitive name
//           // since it allows for case-sensitive files. The Dropbox
//           // client does not however, so we save the original name in the db
//           if (originalName.toLowerCase() === name && name !== originalName) {
//             Metadata.add(blogID, newPath, originalName, function (err) {
//               if (err) debug(err);
//               debug("saved", originalName, "against", join(path, name));
//               callback(null, name);
//             });
//           } else {
//             callback(null, name);
//           }
//         });
//       });
//     },
//     function () {
//       callback(
//         new Error("Ran out of candidates to lowercase path: " + currentPath)
//       );
//     }
//   );
// }

module.exports = syncContents;
