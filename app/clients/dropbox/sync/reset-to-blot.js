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
const createClient = promisify((blogID, cb) =>
  require("../util/createClient")(blogID, (err, ...results) => cb(err, results))
);

async function resetToBlot(blogID, publish) {
  if (!publish)
    publish = (...args) => {
      console.log(clfdate() + " Dropbox:", args.join(" "));
    };

  // if (signal.aborted) return;
  // // this could become verify.fromBlot
  // await uploadAllFiles(account, folder, signal);

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
    const { path_lower } = result;
    if (path_lower) {
      dropboxRoot = path_lower;
      await set(blogID, {folder: path_lower});
    }
  }

  const walk = async (dir) => {
    const [remoteContents, localContents] = await Promise.all([
      remoteReaddir(client, join(dropboxRoot, dir)),
      localReaddir(blogID, localRoot, dir),
    ]);

    for (const { name } of localContents) {
      const path = join(dir, name);
      if (!remoteContents.find((remoteItem) => remoteItem.name === name)) {
        publish("Removing local copy of", path);
        try {
          await fs.remove(join(localRoot, path));
        } catch (e) {
          publish("Failed to remove local copy of", path, e.message);
        }
      }
    }

    for (const remoteItem of remoteContents) {
      const path = join(dir, remoteItem.name);
      const localCounterpart = localContents.find(
        (localItem) => localItem.name === remoteItem.name
      );

      if (remoteItem.is_directory) {
        if (localCounterpart && !localCounterpart.is_directory) {
          publish("Removing local file", path);
          await fs.remove(join(localRoot, path));
          publish("Creating local directory", path);
          await fs.mkdir(join(localRoot, path));
        } else if (!localCounterpart) {
          publish("Creating local directory", path);
          await fs.mkdir(join(localRoot, path));
        }

        await walk(path);
      } else {
        const identicalLocally =
          localCounterpart &&
          localCounterpart.content_hash === remoteItem.content_hash;

        if (localCounterpart && !identicalLocally) {
          publish("Overwriting existing remote", path);
          await download(
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
  publish("Finished processing folder");

  // // prepare folder for first sync, making all files lowercase
  // await folder.lowerCaseContents();

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
  const contents = await fs.readdir(join(localRoot, dir));

  return Promise.all(
    contents.map(async (name) => {
      const pathOnDisk = join(localRoot, dir, name);
      const pathInDB = join(dir, name);
      const [content_hash, stat, displayName] = await Promise.all([
        hashFile(pathOnDisk),
        fs.stat(pathOnDisk),
        getMetadata(blogID, pathInDB),
      ]);

      return {
        name: displayName || name,
        path_lower: join(dir, name),
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

module.exports = resetToBlot;
