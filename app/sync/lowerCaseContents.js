const fs = require("fs-extra");
const { join } = require("path");
const localPath = require("helper/localPath");
const metadata = require("models/metadata");
const { promisify } = require("util");
const getMetadata = promisify(metadata.get);

// Takes a file or folder whose name is not fully
// lowercase and to make it lowercase. For example:
//
//      /foo/BaR.jpg --> /foo/bar.jpg
//
// We also need to think about updating files inside
// folders with a case-sensitive name...
// think about things e.g. previews which would trigger folder writes...

// TODO:
// Can we simplify this if we go as deep as possible before making changes?
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
        const blotPath = join(formerParentDirectory, item);
        const newPath = join(dir, newName);
        const pathOnDisk = join(localFolder, dir, item);
        const options = restore ? {} : { name: item };

        renamedDirectories[newPath] = blotPath;

        await fs.rename(pathOnDisk, join(localFolder, newPath));
        await rename(newPath, blotPath, options);
        await walk(newPath);
      }

      // this directory has a case-sensitive name
      // but it is not inside a directory which has moved
      if (directory && hasNewName && !inMovedDirectory) {
        const path = join(dir, item);
        const newPath = join(dir, newName);
        const options = restore ? {} : { name: item };

        renamedDirectories[newPath] = path;

        await fs.rename(join(localFolder, path), join(localFolder, newPath));
        await rename(newPath, path, options);
        await walk(newPath);
      }

      // this directory does not have a case-sensitive name
      // but it is inside a directory which has moved
      if (directory && !hasNewName && inMovedDirectory) {
        const blotPath = join(formerParentDirectory, item);
        const path = join(dir, item);

        renamedDirectories[path] = blotPath;
        await rename(path, blotPath, {});
        await walk(path);
      }

      // this directory does not have a case-sensitive name
      // and it is not inside a directory which has moved
      if (directory && !hasNewName && !inMovedDirectory) {
        await walk(join(dir, item));
      }

      // this file has a case-sensitive name
      // and it is inside a directory which has moved
      if (file && hasNewName && inMovedDirectory) {
        const blotPath = join(formerParentDirectory, item);
        const newPath = join(dir, newName);
        const pathOnDisk = join(localFolder, dir, item);
        const options = restore ? {} : { name: item };

        await fs.rename(pathOnDisk, join(localFolder, newPath));
        await rename(newPath, blotPath, options);
      }

      // this file has a case-sensitive name
      // but it is not inside a directory which has moved
      if (file && hasNewName && !inMovedDirectory) {
        const blotPath = join(dir, item);
        const path = join(dir, newName);
        const options = restore ? {} : { name: item };

        await fs.rename(join(localFolder, blotPath), join(localFolder, path));
        await rename(path, blotPath, options);
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
