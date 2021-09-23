const client = require("./util/client");
const Sync = require("sync");
const database = require("./database");
const tempDir = require("helper/tempDir")();
const google = require("googleapis").google;
const fs = require("fs-extra");
const join = require("path").join;
const basename = require("path").basename;
const dirname = require("path").dirname;
const localPath = require("helper/localPath");
const guid = require("helper/guid");

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
  Sync(blogID, SYNC_OPTIONS, function (err, folder, done) {
    if (err) return callback(err);
    client(blogID, async function (err, drive, account, auth) {
      if (err) return done(err, callback);
      const service = google.driveactivity({ version: "v2", auth });
      const params = {
        ancestor_name: "items/" + account.folderID,
        consolidation_strategy: { legacy: {} },
        filter:
          "detail.action_detail_case:(CREATE EDIT MOVE RENAME DELETE RESTORE)",
      };

      if (account.latestActivity && !options.fromScratch) {
        params.filter += ` time > \"${account.latestActivity}\"`;
      }

      console.log();
      console.log("------------- REQUEST -------------");
      console.log(params);
      let res;
      try {
        res = await service.activity.query({
          requestBody: params,
        });

        console.log("------------- RESPONSE -------------");
        console.log(JSON.stringify(res.data.activities, null, 2) || "{ }");

        res.data.activities = res.data.activities || [];

        if (res.data.nextPageToken || res.nextPageToken) {
          console.log("res.data.nextPageToken", res.data.nextPageToken);
          console.log("res.nextPageToken", res.nextPageToken);
          throw new Error("THERE IS A nextPageToken to handle");
        }

        // TODO handle page size overflow
        // paginate with pageToken

        // activities are returned with oldest at start of list
        // and most recent at the end.

        console.log("------------- ACTIONS -------------");
        if (DISABLE)
          console.log("WARNING: IN DRY-RUN MODE NONE OF THESE WILL BE APPLIED");
        // Are we definitely getting sorted activities?
        // I can't tell
        const activities = res.data.activities.reverse();

        for (const change of activities) {
          for (const action of change.actions) {
            const target = action.target || change.targets[0];
            const fileId = target.driveItem.name.slice("items/".length);

            // Remove file
            if (action.detail.delete) {
              console.log("DELETE", fileId, target.driveItem.title);
              if (!DISABLE)
                await deleteFile(drive, folder, blogID, fileId, account);
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
              console.log(
                "MOVE",
                fileId,
                target.driveItem.title,
                "from",
                oldParentID
              );
              if (!DISABLE)
                await move(drive, folder, blogID, fileId, oldParentID, account);
            }

            // RENAME file (i.e. move within same directory)
            if (action.detail.rename) {
              const oldName = action.detail.rename.oldTitle;
              console.log(
                "RENAME",
                fileId,
                target.driveItem.title,
                "from",
                oldName
              );
              if (!DISABLE)
                await rename(drive, folder, blogID, fileId, oldName, account);
            }

            // Download the file
            if (action.detail.create || action.detail.restore) {
              console.log("CREATE/RESTORE", fileId, target.driveItem.title);
              if (!DISABLE)
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
              console.log("EDIT", fileId, target.driveItem.title);
              if (!DISABLE)
                await download(drive, folder, blogID, fileId, target, account);
            }
          }
        }

        if (!activities.length) {
          console.log("No actions to take");
          console.log();
          return done(null, callback);
        } else {
          console.log();
        }

        // We don't neccessarily get a timestamp, some have a time range
        const latestActivity =
          activities[activities.length - 1].timestamp ||
          activities[activities.length - 1].timeRange.endTime;

        console.log("Storing latestActivity", latestActivity);
        database.setAccount(blogID, { latestActivity }, function (err) {
          done(err, callback);
        });
      } catch (e) {
        if (e.message === "invalid_grant") {
          return database.setAccount(
            blogID,
            { error: e.message },
            function () {}
          );
        }
        done(e, callback);
      }
    });
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
  console.log("The file/folder", fileId, "path will be determined...");

  if (blogFolderID && fileId === blogFolderID) {
    console.log("The file/folder", fileId, "refers to the blog folder");
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
    console.log("The file/folder", fileId, "has path", result);
    return result;
  } else {
    console.log("The file/folder", fileId, "is not in the blog folder");
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

    console.log("relativePath:", relativePath);
    console.log("fullPath", path);
    console.log("tempPath", tempPath);
    console.log("fileId", fileId);
    console.log("target", target);

    try {
      if (target.driveItem.mimeType === "application/vnd.google-apps.folder") {
        await fs.ensureDir(path);
        return resolve();
      }

      var dest = fs.createWriteStream(tempPath);

      const { data } = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream" }
      );

      data
        .on("end", () => {
          fs.move(tempPath, path, { overwrite: true }, async (err) => {
            if (err) return reject(err);
            await savePath(folder, relativePath);
            console.log("saved:", relativePath);
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

const updateFolderPath = (drive, blogID, folderID) => {
  return new Promise(async function (resolve, reject) {
    const folderPath = await determinePathInBlogFolder(drive, folderID);
    console.log("Storing new folderPath", folderPath);
    database.setAccount(blogID, { folderPath }, function (err) {
      if (err) return reject(err);
      console.log("Stored new folderPath", folderPath);
      resolve();
    });
  });
};

const move = async (drive, folder, blogID, fileId, oldParentID, account) => {
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

  const oldParentRelativePath = await determinePathInBlogFolder(
    drive,
    oldParentID,
    account.folderID
  );

  const oldRelativePath = join(oldParentRelativePath, basename(relativePath));
  const path = localPath(blogID, relativePath);
  const oldPath = localPath(blogID, oldRelativePath);

  console.log("Moving file/folder on disk:");
  console.log(" from:", oldPath);
  console.log("   to:", path);

  await fs.move(oldPath, path);
  await savePath(folder, relativePath);
  await savePath(folder, oldRelativePath);
  console.log("moved:", oldRelativePath, "to", relativePath);
};

const rename = async (drive, folder, blogID, fileId, oldName, account) => {
  // We moved the blog folder
  if (fileId === account.folderID) {
    await updateFolderPath(drive, blogID, account.folderID);
    return;
  }

  const relativePath = await determinePathInBlogFolder(
    drive,
    fileId,
    account.folderID
  );

  const oldRelativePath = join(dirname(relativePath), oldName);

  const path = localPath(blogID, relativePath);
  const oldPath = localPath(blogID, oldRelativePath);

  console.log("Moving file/folder on disk:");
  console.log(" from:", oldPath);
  console.log("   to:", path);

  await fs.move(oldPath, path);
  await savePath(folder, relativePath);
  await savePath(folder, oldRelativePath);

  console.log("renamed:", oldRelativePath, "to", relativePath);
};

const deleteFile = async (drive, folder, blogID, fileId, account) => {
  const relativePath = await determinePathInBlogFolder(
    drive,
    fileId,
    account.folderID
  );
  const path = localPath(blogID, relativePath);
  await fs.remove(path);
  await savePath(folder, relativePath);
  console.log("removed:", relativePath);
};
