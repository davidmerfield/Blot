const fs = require("fs-extra");
const { join } = require("path");
const localPath = require("helper/localPath");
const metadata = require("models/metadata");
const { promisify } = require("util");
const getMetadata = promisify(metadata.get);
const getBlog = promisify(require("models/blog").get);
const move = require("helper/move");
const Rename = require("./rename");

// Takes a file or folder whose name is not fully
// lowercase and to make it lowercase. For example:
//
//      /foo/BaR.jpg --> /foo/bar.jpg
//
// We also need to think about updating files inside
// folders with a case-sensitive name...
// think about things e.g. previews which would trigger folder writes...

// What about doing depth-first? It's complicated by the 'restore'
// process
const lowerCaseContents = async (blogID, { restore } = { restore: false }) => {
  const blog = await getBlog({ id: blogID });
  const rename = promisify(Rename(blog, console.log));
  const localFolder = localPath(blog.id, "/");
  const renamedDirectories = {};

  const walk = async (dir) => {
    let contents = await fs.readdir(join(localFolder, dir));

    // todo: more robust way to fix issue
    // with preview files, to trigger remove
    // this line then run tests/lowerCaseContents
    // by sorting then reversing the order we
    // process preview files before their original
    // draft, which prevents the draft from spitting
    // a new preview file into the folder
    contents = contents.sort().reverse();

    for (const item of contents) {
      const stat = await fs.stat(join(localFolder, join(dir, item)));
      const directory = stat.isDirectory();
      const file = !directory;
      const formerParentDirectory = renamedDirectories[dir];
      const inMovedDirectory = formerParentDirectory !== undefined;
      const newName = restore
        ? (await getMetadata(
            blog.id,
            join(formerParentDirectory || dir, item)
          )) || item
        : item.toLowerCase();
      const hasNewName = item !== newName;

      // this directory has a case-sensitive name
      // and it is inside a directory which has moved
      if (directory && hasNewName && inMovedDirectory) {
        const pathInBlotsDB = join(formerParentDirectory, item);
        const currentPath = join(dir, item);
        const desiredPath = join(dir, newName);
        const { destination, suffix, name, extension } = await move(
          localFolder,
          currentPath,
          desiredPath
        );

        const options = {
          name: determineName({ restore, item, suffix, name, extension }),
        };

        await rename(destination, pathInBlotsDB, options);

        renamedDirectories[destination] = pathInBlotsDB;

        await walk(destination);
      }

      // this directory has a case-sensitive name
      // but it is not inside a directory which has moved
      if (directory && hasNewName && !inMovedDirectory) {
        const currentPath = join(dir, item);
        const desiredPath = join(dir, newName);
        const { destination, suffix, name, extension } = await move(
          localFolder,
          currentPath,
          desiredPath
        );

        const options = {
          name: determineName({ restore, item, suffix, name, extension }),
        };

        renamedDirectories[destination] = currentPath;

        await rename(destination, currentPath, options);
        await walk(destination);
      }

      // this directory does not have a case-sensitive name
      // but it is inside a directory which has already moved
      if (directory && !hasNewName && inMovedDirectory) {
        const pathInBlotsDB = join(formerParentDirectory, item);
        const currentPath = join(dir, item);

        renamedDirectories[currentPath] = pathInBlotsDB;
        await rename(currentPath, pathInBlotsDB, {});
        await walk(currentPath);
      }

      // this directory does not have a case-sensitive name
      // and it is not inside a directory which has moved
      if (directory && !hasNewName && !inMovedDirectory) {
        await walk(join(dir, item));
      }

      // this file has a case-sensitive name
      // and it is inside a directory which has moved
      if (file && hasNewName && inMovedDirectory) {
        const pathInBlotsDB = join(formerParentDirectory, item);
        const currentPath = join(dir, item);
        const desiredPath = join(dir, newName);

        const { destination, suffix, name, extension } = await move(
          localFolder,
          currentPath,
          desiredPath
        );

        const options = {
          name: determineName({ restore, item, suffix, name, extension }),
        };

        await rename(destination, pathInBlotsDB, options);
      }

      // this file has a case-sensitive name
      // but it is not inside a directory which has moved
      if (file && hasNewName && !inMovedDirectory) {
        const currentPath = join(dir, item);
        const desiredPath = join(dir, newName);

        const { destination, suffix, name, extension } = await move(
          localFolder,
          currentPath,
          desiredPath
        );

        const options = {
          name: determineName({ restore, item, suffix, name, extension }),
        };

        await rename(destination, currentPath, options);
      }

      // this file does not have a case-sensitive name
      // but it is inside a directory which has moved
      if (file && !hasNewName && inMovedDirectory) {
        const blotPath = join(formerParentDirectory, item);
        const path = join(dir, item);
        await rename(path, blotPath, {});
      }

      // this file has neither a case-sensitive name
      // nor is it inside a directory which has moved
      if (file && !hasNewName && !inMovedDirectory) {
        // do nothing
      }
    }
  };

  await walk("/");
};

function determineName({ restore, item, suffix, name, extension }) {
  if (restore) return undefined;

  return suffix ? item.slice(0, name.length) + suffix + extension : item;
}

module.exports = lowerCaseContents;
