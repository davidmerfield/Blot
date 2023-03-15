const fs = require("fs-extra");
const { promisify } = require("util");
// const upload = promisify(require("clients/dropbox/util/upload"));
const join = require("path").join;
const clfdate = require("helper/clfdate");
const localPath = require("helper/localPath");
const hashFile = promisify((path, cb) => {
  require("helper/hashFile")(path, (err, result) => {
    cb(null, result);
  });
});
const upload = promisify(require("../util/upload"));
const getMetadata = promisify(require("models/metadata").get);
const set = promisify(require("../database").set);
const get = promisify(require("../database").get);
const lowerCaseContents = require("sync/lowerCaseContents");
const createClient = promisify((blogID, cb) =>
  require("../util/createClient")(blogID, (err, ...results) => cb(err, results))
);

async function resetFromBlot(blogID, publish) {
  if (!publish)
    publish = (...args) => {
      console.log(clfdate() + " Dropbox:", args.join(" "));
    };

  // if (signal.aborted) return;
  // // this could become verify.fromBlot
  // await uploadAllFiles(account, folder, signal);

  // prepare folder for first sync, making all files lowercase
  await lowerCaseContents(blogID);

  // if (signal.aborted) return;
  // const account = await get(blogID);
  const [client, account] = await createClient(blogID);

  let dropboxRoot = "/";
  const localRoot = localPath(blogID, "/");

  // Load the path to the blog folder root position in Dropbox
  if (account.folder_id) {
    const { result } = await client.filesGetMetadata({
      path: account.folder_id,
    });
    const { path_lower, path_display } = result;
    if (path_lower) {
      dropboxRoot = path_lower;
      await set(blogID, { folder: path_display });
    }
  }

  const walk = async (dir) => {
    publish("Checking", dir);

    const [remoteContents, localContents] = await Promise.all([
      remoteReaddir(client, join(dropboxRoot, dir)),
      localReaddir(blogID, localRoot, dir),
    ]);

    for (const { name } of remoteContents) {
      const path = join(dir, name);
      if (!localContents.find((localItem) => localItem.name === name)) {
        publish("Removing remote copy of", path);
        try {
          await client.filesDelete({ path: join(dropboxRoot, path) });
        } catch (e) {
          publish("Failed to remove remote copy of", path, e.message);
        }
      }
    }

    for (const localItem of localContents) {
      const path = join(dir, localItem.name);
      const remoteCounterpart = remoteContents.find(
        (remoteItem) => remoteItem.name === localItem.name
      );

      if (localItem.is_directory) {
        if (remoteCounterpart && !remoteCounterpart.is_directory) {
          publish("Removing remote file", path);
          await client.filesDelete({ path: join(dropboxRoot, path) });
          publish("Creating remote directory", path);
          await client.filesCreateFolder({
            path: join(dropboxRoot, path),
            autorename: false,
          });
        } else if (!remoteCounterpart) {
          publish("Creating remote directory", path);
          await client.filesCreateFolder({
            path: join(dropboxRoot, path),
            autorename: false,
          });
        }

        await walk(path);
      } else {
        const identicalOnRemote =
          remoteCounterpart &&
          remoteCounterpart.content_hash === localItem.content_hash;

        if (remoteCounterpart && !identicalOnRemote) {
          publish("Overwriting existing remote", path);
          await upload(
            client,
            join(localRoot, localItem.path_lower),
            join(dropboxRoot, path)
          );
        } else if (!remoteCounterpart) {
          publish("Uploading", path);
          await upload(
            client,
            join(localRoot, localItem.path_lower),
            join(dropboxRoot, path)
          );
        }
      }
    }
  };

  await walk("/");

  await set(blogID, {
    error_code: 0,
    last_sync: Date.now(),
    cursor: "",
  });

  publish("Finished processing folder");

  // reset sync cursor
  // await set(blogID, {cursor: ''});

  // return account;
}

// async function uploadAllFiles(account, folder, signal, dir = "/") {
//   if (signal.aborted) return;

//   const items = await fs.readdir(localPath(account.blog.id, dir));

//   for (const item of items) {
//     if (signal.aborted) return;
//     const stat = await fs.stat(localPath(account.blog.id, join(dir, item)));
//     if (stat.isDirectory()) {
//       await uploadAllFiles(account, folder, signal, join(dir, item));
//     } else {
//       folder.status("Transferring " + join(dir, item));
//       const source = localPath(account.blog.id, join(dir, item));
//       const destination = join(account.folder, dir, item);

//       try {
//         await upload(account.client, source, destination);
//       } catch (err) {
//         const { status, error } = err;
//         if (
//           status === 409 &&
//           error.error_summary.startsWith("path/disallowed_name")
//         ) {
//           continue;
//         } else {
//           console.log("here,", status, error);
//           throw err;
//         }
//       }
//     }
//   }
// }

const localReaddir = async (blogID, localRoot, dir) => {
  const lowerCaseDir = dir.toLowerCase();
  const contents = await fs.readdir(join(localRoot, lowerCaseDir));

  return Promise.all(
    contents.map(async (name) => {
      const pathOnDisk = join(localRoot, lowerCaseDir, name);
      const pathInDB = join(lowerCaseDir, name);
      const [content_hash, stat, displayName] = await Promise.all([
        hashFile(pathOnDisk),
        fs.stat(pathOnDisk),
        getMetadata(blogID, pathInDB),
      ]);

      return {
        name: displayName || name,
        path_lower: join(lowerCaseDir, name),
        is_directory: stat.isDirectory(),
        content_hash,
      };
    })
  );
};

const remoteReaddir = async (client, dir) => {
  let items = [];
  let cursor;
  let has_more;

  //path: Specify the root folder as an empty string rather than as "/".'
  if (dir === "/") dir = "";

  do {
    const { result } = cursor
      ? await client.filesListFolderContinue({ cursor })
      : await client.filesListFolder({ path: dir });
    has_more = result.has_more;
    cursor = result.cursor;
    items = items.concat(
      result.entries.map((i) => {
        i.is_directory = i[".tag"] === "folder";
        return i;
      })
    );
  } while (has_more);

  return items;
};

module.exports = resetFromBlot;
