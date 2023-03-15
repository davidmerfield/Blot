const fs = require("fs-extra");
const { promisify } = require("util");
const join = require("path").join;
const clfdate = require("helper/clfdate");
const localPath = require("helper/localPath");
const lowerCaseContents = require("sync/lowerCaseContents");
const hashFile = promisify((path, cb) => {
  require("helper/hashFile")(path, (err, result) => {
    cb(null, result);
  });
});
const download = promisify(require("../util/download"));

const getMetadata = promisify(require("models/metadata").get);
const addMetadata = promisify(require("models/metadata").add);
const dropMetadata = promisify(require("models/metadata").drop);

const set = promisify(require("../database").set);
const createClient = promisify((blogID, cb) =>
  require("../util/createClient")(blogID, (err, ...results) => cb(err, results))
);

// const upload = promisify(require("clients/dropbox/util/upload"));
// const get = promisify(require("../database").get);

async function resetToBlot(blogID, publish) {
  if (!publish)
    publish = (...args) => {
      console.log(clfdate() + " Dropbox:", args.join(" "));
    };

  publish("checking folder");

  // if (signal.aborted) return;
  // // this could become verify.fromBlot
  // await uploadAllFiles(account, folder, signal);

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

    for (const { name, path_lower } of localContents) {
      const remoteCounterpart = remoteContents.find(
        (remoteItem) => remoteItem.name === name
      );

      if (!remoteCounterpart) {
        publish("Removing local copy of", path_lower);
        try {
          await dropMetadata(blogID, path_lower);
          await fs.remove(join(localRoot, path_lower));
        } catch (e) {
          publish("Failed to remove local copy of", path_lower, e.message);
        }
      }
    }

    for (const remoteItem of remoteContents) {
      // Name can be casey, path_lower is not
      const localCounterpart = localContents.find(
        (localItem) => localItem.name === remoteItem.name
      );

      const { path_lower, name } = remoteItem;
      const pathOnDropbox = path_lower;
      const pathOnBlot =
        dropboxRoot === "/" ? path_lower : path_lower.slice(dropboxRoot.length);
      const pathOnDisk = join(localRoot, pathOnBlot);

      console.log("pathOnDropbox", pathOnDropbox);
      console.log("pathOnBlot", pathOnBlot);
      console.log("pathOnDisk", pathOnDisk);

      if (remoteItem.is_directory) {
        if (localCounterpart && !localCounterpart.is_directory) {
          publish("Removing local file", pathOnDisk);
          await fs.remove(pathOnDisk);
          await dropMetadata(blogID, pathOnBlot);
          publish("Creating local directory", pathOnDisk);
          await fs.mkdir(pathOnDisk);
          await addMetadata(blogID, pathOnBlot, name);
        } else if (!localCounterpart) {
          publish("Creating local directory", pathOnBlot);
          await fs.mkdir(pathOnDisk);
          await addMetadata(blogID, pathOnBlot, name);
        }

        await walk(join(dir, name));
      } else {
        const identicalLocally =
          localCounterpart &&
          localCounterpart.content_hash === remoteItem.content_hash;

        if (localCounterpart && !identicalLocally) {
          publish("Overwriting existing remote", pathOnBlot);
          try {
            await download(client, pathOnDropbox, pathOnDisk);
            await addMetadata(blogID, pathOnBlot, name);
          } catch (e) {
            continue;
          }
        } else if (!localCounterpart) {
          publish("Download", pathOnBlot);
          try {
            await addMetadata(blogID, pathOnBlot, name);
            await download(client, pathOnDropbox, pathOnDisk);
          } catch (e) {
            continue;
          }
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
  // The Dropbox client stores all items in lowercase
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

  console.log(items);
  return items;
};

module.exports = resetToBlot;
