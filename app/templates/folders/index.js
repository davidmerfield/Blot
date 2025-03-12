const join = require("path").join;
const fs = require("fs-extra");
const config = require("config");
const basename = require("path").basename;
const DIR = require("helper/rootDir") + "/app/templates/folders";
const localPath = require("helper/localPath");
const hashFile = require("helper/hashFile");
const sync = require("sync");
const { dirname } = require("path");
const { promisify } = require("util");
const fix = promisify(require("sync/fix"));

const setupUser = require("./setupUser");
const setupBlogs = require("./setupBlogs");

async function getChangedFiles(sourcePath, destPath) {
  const changes = {
    modified: new Set(),
    added: new Set(),
    removed: new Set(),
  };

  // Get all files in source and destination recursively
  async function getAllFiles(dir) {
    const results = new Set();
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = join(dir, item.name);
      if (item.isDirectory()) {
        const subFiles = await getAllFiles(fullPath);
        subFiles.forEach((f) => results.add(f));
      } else {
        results.add(fullPath);
      }
    }
    return results;
  }

  const sourceFiles = await getAllFiles(sourcePath);
  const destFiles = await getAllFiles(destPath);

  // Check for modified and added files
  for (const sourceFile of sourceFiles) {
    const relPath = sourceFile.slice(sourcePath.length);
    const destFile = join(destPath, relPath);

    if (!destFiles.has(destFile)) {
      changes.added.add(relPath);
    } else {
      try {
        const [sourceHash, destHash] = await Promise.all([
          hashFile(sourceFile),
          hashFile(destFile),
        ]);
        if (sourceHash !== destHash) {
          changes.modified.add(relPath);
        }
      } catch (err) {
        changes.modified.add(relPath);
      }
    }
  }

  // Check for removed files
  for (const destFile of destFiles) {
    const relPath = destFile.slice(destPath.length);
    const sourceFile = join(sourcePath, relPath);
    if (!sourceFiles.has(sourceFile)) {
      changes.removed.add(relPath);
    }
  }

  return changes;
}

async function syncFolder(sourcePath, destPath) {
  await fs.ensureDir(destPath);

  // Copy changed files
  const changes = await getChangedFiles(sourcePath, destPath);

  for (const relPath of [...changes.added, ...changes.modified]) {
    const sourceFile = join(sourcePath, relPath);
    const destFile = join(destPath, relPath);
    await fs.ensureDir(dirname(destFile));
    await fs.copy(sourceFile, destFile, { preserveTimestamps: true });
  }

  // Remove deleted files
  for (const relPath of changes.removed) {
    await fs.remove(join(destPath, relPath));
  }

  return changes;
}

async function loadFoldersToBuild(foldersDirectory) {
  const items = await fs.readdir(foldersDirectory);
  return items
    .map((name) => join(foldersDirectory, name))
    .filter((path) => {
      const name = basename(path);
      return (
        name[0] !== "-" && name[0] !== "." && fs.statSync(path).isDirectory()
      );
    });
}

async function main(options = {}) {
  let folders = await loadFoldersToBuild(DIR);

  if (options.filter) {
    folders = folders.filter(options.filter);
  }

  const { user, url } = await setupUser();
  console.log(
    "Established user " + user.email + " to manage demonstration blogs"
  );

  const blogs = await setupBlogs(user, folders);

  // Update and sync blogs
  for (const [id, { path, blog }] of Object.entries(blogs)) {
    console.log("Building folder", path, "for blog", blog.handle);

    // Sync changed files and get list of changes
    const changes = await syncFolder(path, localPath(blog.id, "/"));

    // Only update changed files
    await new Promise((resolve, reject) => {
      sync(blog.id, async function (err, folder, done) {
        if (err) return reject(err);

        const update = promisify(folder.update);

        try {
          // Update only modified and added files
          const changedPaths = [
            ...changes.modified,
            ...changes.added,
            ...changes.removed,
          ];
          for (const relativePath of changedPaths) {
            await update(relativePath);
          }

          await fix(blog);
          console.log("Built folder", path, "for blog", blog.handle);
          done(null, resolve);
        } catch (err) {
          console.error(
            "Error building folder",
            path,
            "for blog",
            blog.handle,
            err
          );
          done(null, () => {
            reject(err);
          });
        }
      });
    });
  }

  folders.forEach((folder) => {
    console.log("http://" + basename(folder) + "." + config.host);
    console.log("Folder:", folder);
    console.log();
  });

  console.log("Dashboard:\n" + url);
}

if (require.main === module) {
  const options = {};
  if (process.argv[2]) {
    options.filter = (path) => path.includes(process.argv[2]);
  }

  main(options).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = main;
