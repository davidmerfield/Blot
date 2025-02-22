const Bottleneck = require("bottleneck");
const database = require("clients/google-drive/database");
const clfdate = require("helper/clfdate");
const sync = require("clients/google-drive/sync");

module.exports = async (serviceAccountId, drive) => {
  if (!serviceAccountId || !drive) {
    throw new Error("Missing required arguments for pollRecentlyModifiedFiles");
  }

  // This allows up to 5 calls per two seconds total across all instances
  const limiter = new Bottleneck({
    minTime: 2000,
    maxConcurrent: 5,
  });

  const checkForChanges = limiter.wrap(async (fileId) => {
    const latestInfo = await drive.files.get({
      fileId,
      fields: "modifiedTime",
    });

    return latestInfo.data.modifiedTime;
  });

  while (true) {
    try {
      // 1) Iterate over each blog. For each blog, queue the check in Bottleneck.
      await database.blog.iterateByServiceAccountId(
        serviceAccountId,
        async (blogID, { folderId }) => {
          try {
            const prefix = () =>
              `${clfdate()} Blog ${blogID} pollRecentlyModifiedFiles:`;

            console.log(prefix(), "fetching");

            // Get up to 5 of your recently modified file IDs
            const { getRecentlyModifiedFileIds, getMetadata } =
              database.folder(folderId);
            let shouldSync = false;
            const fileIds = await getRecentlyModifiedFileIds(5);
            // Example of doing something with the local metadata
            for (const fileId of fileIds) {
              const metadata = await getMetadata(fileId);
            //   console.log(prefix(), "Checking", fileId, "metadata", metadata);
              if (metadata.isDirectory) {
                // console.log(prefix(), "Skipping directory", fileId);
                continue;
              }

              const modifiedTime = metadata.modifiedTime;
              const latestModifiedTime = await checkForChanges(fileId);
            //   console.log(prefix(), "Latest modified time", latestModifiedTime);

              if (latestModifiedTime !== modifiedTime) {
                shouldSync = true;
                break;
              } else {
                console.log(prefix(), "No changes detected for", metadata);
              }
            }

            if (shouldSync) {
              try {
                console.log(prefix(), "starting sync");
                // await sync(blogID);
              } catch (e) {
                console.error(prefix(), "sync failed", e.message);
              }
            } else {
                console.log(prefix(), "no new activity");
            }

          } catch (err) {
            console.error("Error during checkForChanges:", err);
          }
        }
      );
    } catch (err) {
      console.error("Error during iterateByServiceAccountId:", err);
    }
  }
};
