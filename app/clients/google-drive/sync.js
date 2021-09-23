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
        params.filter += ` time > "${account.latestActivity}"`;
      }

      console.log("REQ", params);

      const res = await service.activity.query({
        requestBody: params,
      });

      console.log("RES\n", JSON.stringify(res.data.activities, null, 2));

      res.data.activities = res.data.activities || [];

      // TODO handle page size overflow
      // paginate with pageToken
      
      //  logActivities(res);

      res.data.activities = res.data.activities.reverse();

      for (const change of res.data.activities) {
        // Move file
        if (
          change.actions.filter((action) => action.detail.move).length &&
          change.actions.filter((action) => action.detail.create).length === 0
        ) {
          const fileID = change.targets[0].driveItem.name.slice(
            "items/".length
          );

          // We moved the
          if (fileID === account.folderID) {
            await updateFolderPath(drive, blogID, account.folderID);
            continue;
          }

          try {
            const relativePath = await determinePathInBlogFolder(
              drive,
              fileID,
              account.folderID
            );

            const oldParentID = change.actions
              .filter((action) => action.detail.move)[0]
              .detail.move.removedParents[0].driveItem.name.slice(
                "items/".length
              );

            const oldParentRelativePath = await determinePathInBlogFolder(
              drive,
              oldParentID,
              account.folderID
            );

            const oldRelativePath = join(
              oldParentRelativePath,
              basename(relativePath)
            );
            const path = localPath(blogID, relativePath);
            const oldPath = localPath(blogID, oldRelativePath);

            await fs.move(oldPath, path);
            await savePath(folder, relativePath);
            await savePath(folder, oldRelativePath);
            console.log("moved:", oldRelativePath, "to", relativePath);
          } catch (e) {
            console.log(e);
          }

          console.log("MOVE > ", fileID, JSON.stringify(change, null, 2));
        }

        // Rename file
        if (change.actions.filter((action) => action.detail.rename).length) {
          const fileID = change.targets[0].driveItem.name.slice(
            "items/".length
          );

          // We moved the
          if (fileID === account.folderID) {
            await updateFolderPath(drive, blogID, account.folderID);
            continue;
          }

          console.log("RENAME > ", fileID);

          try {
            const relativePath = await determinePathInBlogFolder(
              drive,
              fileID,
              account.folderID
            );

            const oldName = change.actions.filter(
              (action) => action.detail.rename
            )[0].detail.rename.oldTitle;

            const oldRelativePath = join(dirname(relativePath), oldName);

            const path = localPath(blogID, relativePath);
            const oldPath = localPath(blogID, oldRelativePath);

            await fs.move(oldPath, path);
            await savePath(folder, relativePath);
            await savePath(folder, oldRelativePath);
            console.log("renamed:", oldRelativePath, "to", relativePath);
          } catch (e) {
            console.log(e);
          }
        }

        // Remove file
        if (change.actions.filter((action) => action.detail.delete).length) {
          console.log("REMOVE > ", change.targets[0].driveItem.title);
          const fileID = change.targets[0].driveItem.name.slice(
            "items/".length
          );
          try {
            const relativePath = await determinePathInBlogFolder(
              drive,
              fileID,
              account.folderID
            );
            const path = localPath(blogID, relativePath);
            await fs.remove(path);
            await savePath(folder, relativePath);
            console.log("removed:", relativePath);
          } catch (e) {
            console.log(e);
          }
        }

        // Download updated version of file
        if (
          change.actions.filter(
            (action) =>
              action.detail.create ||
              action.detail.edit ||
              action.detail.restore
          ).length &&
          change.actions.filter((action) => action.detail.delete).length ===
            0 &&
          change.targets.filter(
            (target) => target.driveItem && target.driveItem.file
          ).length
        ) {
          console.log("DOWNLOAD > ", change.targets[0].driveItem.title);
          try {
            const fileID = change.targets[0].driveItem.name.slice(
              "items/".length
            );
            const relativePath = await determinePathInBlogFolder(
              drive,
              fileID,
              account.folderID
            );

            const path = localPath(blogID, relativePath);

            console.log("relativePath:", relativePath);
            await download(drive, fileID, path);
            await savePath(folder, relativePath);

            console.log("saved:", relativePath);
          } catch (e) {
            console.log(e);
          }

          // console.log(change.timestamp);
          // change.actions.forEach((i) => console.log(i));
          // change.targets.forEach((i) => console.log(i));
          // change.actors.forEach((i) => console.log(i));
        }
      }

      if (!res.data.activities.length) {
        return done(null, callback);
      }

      // We don't neccessarily get a timestamp, some have a time range
      const latestActivity =
        res.data.activities[0].timestamp ||
        res.data.activities[0].timeRange.endTime;

      database.setAccount(blogID, { latestActivity }, function (err) {
        done(err, callback);
      });
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
  console.log("determining path to", fileId);

  if (blogFolderID && fileId === blogFolderID) return "/";

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
    return "/" + join(parents.map((i) => i.name).join("/"), res.data.name);
  } else {
    return "";
  }
};

const download = (drive, fileId, outputPath) => {
  const tempPath = join(tempDir, guid());

  return new Promise(async function (resolve, reject) {
    try {
      var dest = fs.createWriteStream(tempPath);
      const { data } = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream" }
      );
      data
        .on("end", () => {
          fs.move(tempPath, outputPath, (err) => {
            if (err) reject(err);
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

const logActivities = (res) => {
  console.log("RES\n", JSON.stringify(res.data.activities, null, 2));

  for (const change of res.data.activities) {
    console.log("");
    console.log("AT", change.timestamp || change.timeRange.endTime);
    console.log("  AFFECTING");
    change.targets.forEach((i) =>
      console.log("   ", i.driveItem.title, i.driveItem.name)
    );
    console.log("  ACTIONS");
    change.actions.forEach((i) => console.log("   ", Object.keys(i.detail)[0]));
  }
};
