const Bottleneck = require("bottleneck");
const database = require("clients/google-drive/database");
const clfdate = require("helper/clfdate");
const sync = require("clients/google-drive/sync");

module.exports = async (serviceAccountId, driveactivity) => {
  if (!serviceAccountId || !driveactivity) {
    throw new Error("Missing required arguments for pollDriveActivity");
  }

  // This allows up to 30 calls per minute total across all instances
  const limiter = new Bottleneck({
    minTime: 2000,
    maxConcurrent: 1,
  });

  const checkDriveActivity = limiter.wrap(
    async (blogID, folderId, latestDriveActivityTimestamp) => {
      const prefix = () => `${clfdate()} Google Drive client: serviceAccountId=${serviceAccountId} pollDriveActivity: ${blogID}`;

      try {
        if (!blogID || !folderId) {
          console.log(prefix(), "missing blogID or folderId");
          return;
        }

        console.log(prefix(), "fetching");

        const res = await driveactivity.activity.query({
          requestBody: {
            pageSize: 1,
            ancestorName: `items/${folderId}`,
          },
        });

        const activities = res.data?.activities || [];
        const activity = activities.find((a) => a.timestamp);
        const timestamp = activity?.timestamp;

        if (!activity) {
          console.log(prefix(), "Warning: no activity found");
          return;
        }

        if (timestamp !== latestDriveActivityTimestamp) {
          if (latestDriveActivityTimestamp) {
            console.log(prefix(), "starting sync");
            try {
              await sync(blogID);
            } catch (e) {
              console.error(prefix(), "sync failed", e.message);
            }
          }
          console.log(prefix(), "storing timestamp", timestamp);
          await database.blog.store(blogID, {
            latestDriveActivityTimestamp: timestamp,
          });
        } else {
          console.log(prefix(), "no new activity");
        }
      } catch (err) {
        console.error(prefix(), "checkDriveActivity error:", err);
      }
    }
  );

  while (true) {
    try {
      // 1) Iterate over each blog. For each blog, queue the check in Bottleneck.
      await database.blog.iterateByServiceAccountId(
        serviceAccountId,
        async (blogID, { folderId, latestDriveActivityTimestamp }) => {
          await checkDriveActivity(blogID, folderId, latestDriveActivityTimestamp);
        }
      );
    } catch (err) {
      console.error("Error during iterateByServiceAccountId:", err);
    }
  }
};