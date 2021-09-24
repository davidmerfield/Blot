const createDriveClient = require("./util/createDriveClient");
const Sync = require("sync");
const database = require("./database");
const tempDir = require("helper/tempDir")();
const fs = require("fs-extra");
const join = require("path").join;
const dirname = require("path").dirname;
const localPath = require("helper/localPath");
const guid = require("helper/guid");
const debug = require("debug")("blot:clients:google-drive:sync");
const colors = require("colors/safe");

// PREVENT THE PROGRAM from makeing changes
const DISABLE = false;

// We ask for a longer TTL (timeout) for the sync lock because sometimes
// we hit Dropbox's rate limits, which tend to ask for a 5 minute (300s)
// delay before retrying a request. 30 minutes is requested, which should
// be plenty of time to sync a large folder.
var SYNC_OPTIONS = {
  retryCount: -1,
  retryDelay: 10,
  retryJitter: 10,
  ttl: 30 * 60 * 1000,
};

// I believe we want to use
// https://developers.google.com/drive/api/v3/reference/changes/list

module.exports = function (blogID, options, callback) {
  debug("Blog:", blogID, "Attempting to sync");
  Sync(blogID, SYNC_OPTIONS, async function (err, folder, done) {
    if (err) return callback(err);
    debug("Blog:", blogID, "Acquired lock on folder");
    const { drive, driveactivity, account } = await createDriveClient(blogID);
    if (err) return done(err, callback);
    debug("Blog:", blogID, "Created Drive client");
    const params = {
      ancestor_name: "items/" + account.folderID,
      consolidation_strategy: { legacy: {} },
      filter:
        "detail.action_detail_case:(CREATE EDIT MOVE RENAME DELETE RESTORE)",
    };

    if (account.latestActivity && !options.fromScratch) {
      params.filter += ` time > \"${account.latestActivity}\"`;
    }

    debug();
    debug("------------- REQUEST -------------");
    debug(params);
    let res;
    try {
      res = await driveactivity.activity.query({
        requestBody: params,
      });

      debug("------------- RESPONSE -------------");
      debug(JSON.stringify(res.data.activities, null, 2) || "{ }");

      res.data.activities = res.data.activities || [];

      if (res.data.nextPageToken || res.nextPageToken) {
        debug("res.data.nextPageToken", res.data.nextPageToken);

        let nextPage;
        try {
          nextPage = await driveactivity.activity.query({
            ...params,
            pageToken: res.data.nextPageToken,
          });
          debug(
          "this page first date",
          nextPage.data.activities[0].time ||
            nextPage.data.activities[0].timeRange.endTime
        );

        debug(
          "next page first date",
          nextPage.data.activities[0].time ||
            nextPage.data.activities[0].timeRange.endTime
        );
        } catch (e) {
          debug("error fetching next page", e);
        }


        throw new Error("THERE IS A nextPageToken to handle");
      }

      // TODO handle page size overflow
      // paginate with pageToken

      // activities are returned with oldest at start of list
      // and most recent at the end.

      debug("------------- ACTIONS -------------");
      if (DISABLE) {
        debug("WARNING: IN DRY-RUN MODE NONE OF THESE WILL BE APPLIED");
        debug("-----------------------------------");
      }
      // Are we definitely getting sorted activities?
      // I can't tell
      const activities = res.data.activities.reverse();

      for (const change of activities) {
        for (const action of change.actions) {
          const target = action.target || change.targets[0];
          const fileId = target.driveItem.name.slice("items/".length);

          // Remove file
          if (action.detail.delete) {
            debug("DELETE", fileId, target.driveItem.title);
            await deleteFile(drive, folder, blogID, fileId);
          }

          // MOVE file
          // We check for removedParents (i.e. the folder from which)
          // this file was moved because the event is fired for
          // file creation as well.
          if (action.detail.move && action.detail.move.removedParents) {
            const removedParents = action.detail.move.removedParents;
            const oldParentID = removedParents[0].driveItem.name.slice(
              "items/".length
            );
            debug("MOVE", fileId, target.driveItem.title, "from", oldParentID);
            await move(
              drive,
              folder,
              blogID,
              fileId,
              oldParentID,
              target,
              account
            );
          }

          // RENAME file (i.e. move within same directory)
          if (action.detail.rename) {
            const newTitle = action.detail.rename.newTitle;
            debug(
              "RENAME",
              fileId,
              action.detail.rename.oldTitle,
              "to",
              newTitle
            );
            await rename(drive, folder, blogID, fileId, newTitle, account);
          }

          // Download the file
          if (action.detail.create || action.detail.restore) {
            debug("CREATE/RESTORE", fileId, target.driveItem.title);
            await download(drive, folder, blogID, fileId, target, account);
          }

          // Download updated version of file
          if (
            action.detail.edit &&
            // we might need to check for a different target here as well
            // We need to continue because the edit event is also
            // sent along with create
            change.actions.filter(
              (i) => i.detail.create || i.detail.restore || i.detail.delete
            ).length === 0
          ) {
            debug("EDIT", fileId, target.driveItem.title);
            await download(drive, folder, blogID, fileId, target, account);
          }
        }

        // We don't neccessarily get a timestamp, some have a time range
        const latestActivity = change.timestamp || change.timeRange.endTime;
        debug("Storing latestActivity", latestActivity);
        await database.setAccount(blogID, { latestActivity });
      }
    } catch (e) {
      if (e.message === "invalid_grant")
        await database.setAccount(blogID, { error: e.message });
      done(e, callback);
    }

    done(null, callback);
  });
};

const savePath = async (folder, relativePath) => {
  return new Promise(function (resolve, reject) {
    folder.update(relativePath, function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
};

const determinePathInBlogFolder = async (drive, fileId, blogFolderID) => {
  debug("The file/folder", fileId, "path will be determined...");

  if (blogFolderID && fileId === blogFolderID) {
    debug("The file/folder", fileId, "refers to the blog folder");
    return "/";
  }

  const parents = [];

  let data;
  let insideBlogFolder = false;

  const res = await drive.files.get({
    fileId,
    fields: "id, name, parents",
  });

  data = res.data;

  while (data.parents && data.parents.length && !insideBlogFolder) {
    const res = await drive.files.get({
      fileId: data.parents[0],
      fields: "id, name, parents",
    });
    data = res.data;
    if (blogFolderID && data.id === blogFolderID) {
      insideBlogFolder = true;
    } else {
      parents.unshift({ name: data.name, id: data.id });
    }
  }

  if (insideBlogFolder || !blogFolderID) {
    const result =
      "/" + join(parents.map((i) => i.name).join("/"), res.data.name);
    debug("The file/folder", fileId, "has path", result);
    return result;
  } else {
    debug("The file/folder", fileId, "is not in the blog folder");
    return "";
  }
};

const download = async (drive, folder, blogID, fileId, target, account) => {
  return new Promise(async function (resolve, reject) {
    const relativePath = await determinePathInBlogFolder(
      drive,
      fileId,
      account.folderID
    );

    const path = localPath(blogID, relativePath);
    const tempPath = join(tempDir, guid());

    debug("relativePath:", relativePath);
    debug("fullPath", path);
    debug("tempPath", tempPath);
    debug("fileId", fileId);
    debug("target", target);

    try {
      if (target.driveItem.mimeType === "application/vnd.google-apps.folder") {
        if (!DISABLE) {
          await fs.ensureDir(path);
          await database.storeFolder(blogID, { fileId, path: relativePath });
        }
        debug("MKDIR folder");
        debug("   to:", colors.green(path));

        return resolve();
      }

      if (DISABLE) {
        return resolve();
      }

      debug("DOWNLOAD file");
      debug("   to:", colors.green(path));

      var dest = fs.createWriteStream(tempPath);

      const { data } = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream" }
      );

      data
        .on("end", () => {
          fs.move(tempPath, path, { overwrite: true }, async (err) => {
            if (err) return reject(err);
            await database.storeFolder(blogID, { fileId, path: relativePath });
            await savePath(folder, relativePath);
            debug("DOWNLOAD file SUCCEEDED");
            resolve();
          });
        })
        .on("error", reject)
        .pipe(dest);
    } catch (e) {
      reject(e);
    }
  });
};

const updateFolderPath = async (drive, blogID, folderID) => {
  const folderPath = await determinePathInBlogFolder(drive, folderID);
  debug("Storing new folderPath", folderPath);
  await database.setAccount(blogID, { folderPath });
  debug("Stored new folderPath", folderPath);
  return;
};

const move = async (
  drive,
  folder,
  blogID,
  fileId,
  oldParentID,
  target,
  account
) => {
  // We moved the
  if (fileId === account.folderID) {
    await updateFolderPath(drive, blogID, account.folderID);
    return;
  }

  const relativePath = await determinePathInBlogFolder(
    drive,
    fileId,
    account.folderID
  );

  const oldRelativePath = await database.getByFileId(blogID, fileId);

  if (!oldRelativePath && relativePath) {
    debug(
      "WARNING this file/folderPath was MOVED into the blog folder from outside"
    );
    debug(" to:", greenIfExists(relativePath));
    await download(drive, folder, blogID, fileId, target, account);
    return;
  }

  if (!relativePath && oldRelativePath) {
    debug("WARNING this file/folder was MOVED outside the blog folder");
    debug(" from:", greenIfExists(oldRelativePath));
    await deleteFile(drive, folder, blogID, fileId);
    return;
  }

  if (!relativePath || !oldRelativePath) {
    throw new Error("WARNING cannot file paths for this file/folder");
  }

  const path = localPath(blogID, relativePath);
  const oldPath = localPath(blogID, oldRelativePath);

  debug("MOVE file/folder");
  debug(" from:", greenIfExists(oldPath));
  debug("   to:", greenIfNotExists(path));
  if (!DISABLE) {
    await fs.move(oldPath, path);
    await database.storeFolder(blogID, { fileId, path: relativePath });
    await savePath(folder, relativePath);
    await savePath(folder, oldRelativePath);
    debug("MOVE file/folder SUCCEEDED");
  }
};

const rename = async (drive, folder, blogID, fileId, newTitle, account) => {
  // We moved the blog folder
  if (fileId === account.folderID) {
    await updateFolderPath(drive, blogID, account.folderID);
    return;
  }

  const oldRelativePath = await database.getByFileId(blogID, fileId);
  const relativePath = join(dirname(oldRelativePath), newTitle);

  const path = localPath(blogID, relativePath);
  const oldPath = localPath(blogID, oldRelativePath);

  debug("MOVE file/folder");
  debug(" from:", greenIfExists(oldPath));
  debug("   to:", greenIfNotExists(path));
  if (!DISABLE) {
    await fs.move(oldPath, path);
    await database.storeFolder(blogID, { fileId, path: relativePath });
    await savePath(folder, relativePath);
    await savePath(folder, oldRelativePath);
    debug("MOVE file/folder SUCCEEDED");
  }
};

const deleteFile = async (drive, folder, blogID, fileId) => {
  const relativePath = await database.getByFileId(blogID, fileId);

  if (!relativePath) {
    debug("DELETE file/folder", fileId, "does not have a path stored in DB");
    return;
  }

  const path = localPath(blogID, relativePath);

  debug("DELETE file/folder");
  debug(" from:", greenIfExists(path));
  if (!DISABLE) {
    await fs.remove(path);
    await database.deleteFolder(blogID, { fileId, path: relativePath });
    await savePath(folder, relativePath);
    debug("DELETE file/folder SUCCEEDED");
  }
};

const greenIfExists = (path) => {
  const fn = fs.existsSync(path) ? colors.green : colors.red;
  return fn(path);
};

const greenIfNotExists = (path) => {
  const fn = fs.existsSync(path) ? colors.red : colors.green;
  return fn(path);
};
