const fs = require("fs-extra");
const { join } = require("path");
const localPath = require("helper/localPath");
const metadata = require("models/metadata");
const { promisify } = require("util");
const getMetadata = promisify(metadata.get);
const move = require("helper/move");

// Takes a file or folder whose name is not fully
// lowercase and to make it lowercase. For example:
//
//      /foo/BaR.jpg --> /foo/bar.jpg
//
// We also need to think about updating files inside
// folders with a case-sensitive name...
// think about things e.g. previews which would trigger folder writes...

const lowerCaseContents = (blog, rename) => async (
  { restore } = { restore: false }
) => {
  const localFolder = localPath(blog.id, "/");
  const renamedDirectories = {};

  const walk = async (dir) => {
    const contents = await fs.readdir(join(localFolder, dir));

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
        const options = restore ? {} : { name: item };
        const desiredPath = join(dir, newName);

        const newPath = await move(
          localFolder,
          currentPath,
          desiredPath
        );

        await rename(newPath, pathInBlotsDB, options);

        renamedDirectories[newPath] = pathInBlotsDB;

        await walk(newPath);
      }

      // this directory has a case-sensitive name
      // but it is not inside a directory which has moved
      if (directory && hasNewName && !inMovedDirectory) {
        const currentPath = join(dir, item);
        const desiredPath = join(dir, newName);
        const options = restore ? {} : { name: item };

        const newPath = await move(
          localFolder,
          currentPath,
          desiredPath
        );

        renamedDirectories[newPath] = currentPath;

        await rename(newPath, currentPath, options);
        await walk(newPath);
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
        const options = restore ? {} : { name: item };

        const newPath = await move(
          localFolder,
          currentPath,
          desiredPath
        );
        await rename(newPath, pathInBlotsDB, options);
      }

      // this file has a case-sensitive name
      // but it is not inside a directory which has moved
      if (file && hasNewName && !inMovedDirectory) {
        const currentPath = join(dir, item);
        const desiredPath = join(dir, newName);
        const options = restore ? {} : { name: item };

        const newPath = await move(
          localFolder,
          currentPath,
          desiredPath
        );

        await rename(newPath, currentPath, options);
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

module.exports = lowerCaseContents;
