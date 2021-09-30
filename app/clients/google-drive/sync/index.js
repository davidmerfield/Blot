const createDriveClient = require("../util/createDriveClient");
const Sync = require("sync");
const database = require("../database");
const fs = require("fs-extra");
const { promisify } = require("util");
const join = require("path").join;
const dirname = require("path").dirname;
const localPath = require("helper/localPath");
const debug = require("debug")("blot:clients:google-drive:sync");
const colors = require("colors/safe");
const determinePathInBlogFolder = require("./determinePathInBlogFolder");
const download = require("./download");

// PREVENT THE PROGRAM from makeing changes
const DISABLE = false;

// We ask for a longer TTL (timeout) for the sync lock because sometimes
// we hit Dropbox's rate limits, which tend to ask for a 5 minute (300s)
// delay before retrying a request. 30 minutes is requested, which should
// be plenty of time to sync a large folder.
var SYNC_OPTIONS = {
  retryCount: 1,
  retryDelay: 10,
  retryJitter: 10,
  ttl: 30 * 60 * 1000, // 30 minutes
};

// I believe we want to use
// https://developers.google.com/drive/api/v3/reference/changes/list

module.exports = function (blogID, options, callback) {
  debug("Blog:", blogID, "Attempting to sync");
  Sync(blogID, SYNC_OPTIONS, async function check(err, folder, done) {
    if (err) return callback(err);
    debug("Blog:", blogID, "Acquired lock on folder");
    folder.update = promisify(folder.update);
    const { drive, driveactivity, account } = await createDriveClient(blogID);
    if (err) return done(err, callback);

    if (account.error)
      return done(new Error("Account has error: " + account.error), callback);

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
            if (fileId === account.folderID) {
              debug("DELETE BLOG FOLDER", fileId, target.driveItem.title);
              await database.setAccount(blogID, {
                folderID: "",
                folderPath: "",
                folderName: "",
                latestActivity: "",
              });
              return done(null, callback);
            }

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
        await database.setAccount(blogID, { latestActivity, error: "" });
      }
    } catch (e) {
      if (e.message === "invalid_grant")
        await database.setAccount(blogID, { error: e.message });
      return done(e, callback);
    }

    // Wait a second and then check again
    if (res && res.data && res.data.activities.length) {
      return setTimeout(() => check(null, folder, done), 600);
    } else {
      done(null, callback);
    }
  });
};

const updateFolderPath = async (drive, blogID, folderID) => {
  const { relativePath } = await determinePathInBlogFolder(drive, folderID);
  debug("Storing new folderPath", relativePath);
  await database.setAccount(blogID, { folderPath: relativePath });
  debug("Stored new folderPath", relativePath);
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

  const { relativePath } = await determinePathInBlogFolder(
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
    await folder.update(relativePath);
    await folder.update(oldRelativePath);
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

  if (!oldRelativePath)
    throw new Error("No fileId in the database for:", fileId);
  
  const relativePath = join(dirname(oldRelativePath), newTitle);

  const path = localPath(blogID, relativePath);
  const oldPath = localPath(blogID, oldRelativePath);

  debug("MOVE file/folder");
  debug(" from:", greenIfExists(oldPath));
  debug("   to:", greenIfNotExists(path));
  if (!DISABLE) {
    await fs.move(oldPath, path);
    await database.storeFolder(blogID, { fileId, path: relativePath });
    await folder.update(relativePath);
    await folder.update(oldRelativePath);
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
    await folder.update(relativePath);
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
