const fs = require("fs-extra");
const { join } = require("path");

// Takes a file or folder whose name is not fully
// lowercase and to make it lowercase. For example:
//
//      /foo/BaR.jpg --> /foo/bar.jpg
//
// We also need to think about updating files inside
// folders with a case-sensitive name...
// think about things e.g. previews which would trigger folder writes...

async function lowerCase(localFolder, update) {
  const renamedDirectories = {};

  const walk = async (dir) => {
    const contents = await fs.readdir(join(localFolder, dir));

    for (const item of contents) {
      const stat = await fs.stat(join(localFolder, join(dir, item)));
      const directory = stat.isDirectory();
      const file = !directory;
      const hasNameWithCapitals = item !== item.toLowerCase();
      const formerParentDirectory = renamedDirectories[dir];
      const inMovedDirectory = formerParentDirectory !== undefined;

      // this directory has a case-sensitive name
      // and it is inside a directory which has moved
      if (directory && hasNameWithCapitals && inMovedDirectory) {
        const blotPath = join(formerParentDirectory, item);
        const newPath = join(dir, item.toLowerCase());
        const pathOnDisk = join(localFolder, dir, item);

        renamedDirectories[newPath] = blotPath;

        await fs.rename(pathOnDisk, join(localFolder, newPath));
        await update(blotPath);
        await update(newPath);
        await walk(newPath);
      }

      // this directory has a case-sensitive name
      // but it is not inside a directory which has moved
      if (directory && hasNameWithCapitals && !inMovedDirectory) {
        const path = join(dir, item);
        const newPath = join(dir, item.toLowerCase());

        renamedDirectories[newPath] = path;

        await fs.rename(join(localFolder, path), join(localFolder, newPath));
        await update(path);
        await update(newPath);
        await walk(newPath);
      }

      // this directory does not have a case-sensitive name
      // but it is inside a directory which has moved
      if (directory && !hasNameWithCapitals && inMovedDirectory) {
        const blotPath = join(formerParentDirectory, item);
        const path = join(dir, item);

        renamedDirectories[path] = blotPath;

        await update(blotPath);
        await update(path);
        await walk(path);
      }

      // this directory does not have a case-sensitive name
      // and it is not inside a directory which has moved
      if (directory && !hasNameWithCapitals && !inMovedDirectory) {
        await walk(join(dir, item));
      }

      // this file has a case-sensitive name
      // and it is inside a directory which has moved
      if (file && hasNameWithCapitals && inMovedDirectory) {
        const blotPath = join(formerParentDirectory, item);
        const newPath = join(dir, item.toLowerCase());
        const pathOnDisk = join(localFolder, dir, item);
        await fs.rename(pathOnDisk, join(localFolder, newPath));
        await update(blotPath);
        await update(newPath);
      }

      // this file has a case-sensitive name
      // but it is not inside a directory which has moved
      if (file && hasNameWithCapitals && !inMovedDirectory) {
        const blotPath = join(dir, item);
        const path = join(dir, item.toLowerCase());
        await fs.rename(join(localFolder, blotPath), join(localFolder, path));
        await update(blotPath);
        await update(path);
      }

      // this file does not have a case-sensitive name
      // but it is inside a directory which has moved
      if (file && !hasNameWithCapitals && inMovedDirectory) {
        const blotPath = join(formerParentDirectory, item);
        const path = join(dir, item);
        await update(blotPath);
        await update(path);
      }

      // this file has neither a case-sensitive name
      // nor is it inside a directory which has moved
      if (file && !hasNameWithCapitals && !inMovedDirectory) {
        // do nothing
      }
    }
  };

  await walk("/");
}

module.exports = lowerCase;
