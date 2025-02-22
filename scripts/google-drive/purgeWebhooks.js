const database = require("clients/google-drive/database");
const clfdate = require("helper/clfdate");
const prefix = () => `${clfdate()} Google Drive client:`;

module.exports = async function purgeWebhooks(serviceAccountId, drive) {
  if (!serviceAccountId || !drive) {
    throw new Error("Both serviceAccountId and drive are required.");
  }

  console.log(prefix(), `Service account client_id=${serviceAccountId} Purging all webhooks`);

  // Step 1: Retrieve all channels associated with the service account
  const existingChannels = await database.channel.listByServiceAccount(serviceAccountId);

  if (!existingChannels || existingChannels.length === 0) {
    console.log(prefix(), `Service account client_id=${serviceAccountId} No channels to purge`);
    return;
  }

  // Step 2: Stop all channels and delete them from the database
  await Promise.all(
    existingChannels.map(async (channelId) => {
      const channelData = await database.channel.get(channelId);

      if (channelData && channelData.type === "changes.watch") {
        try {
          // Attempt to stop the channel using the drive API
          await drive.channels.stop({
            requestBody: {
              id: channelData.channelId,
              resourceId: channelData.resourceId,
            },
          });
          console.log(
            prefix(),
            `Service account client_id=${serviceAccountId} Successfully stopped channelId=${channelData.channelId}`
          );
        } catch (err) {
          console.error(
            prefix(),
            `Service account client_id=${serviceAccountId} Failed to stop channelId=${channelData.channelId}: ${err.message}`
          );
        }
      }

      // Delete the channel from the database regardless of whether stopping it succeeded
      try {
        await database.channel.delete(channelId);
        console.log(
          prefix(),
          `Service account client_id=${serviceAccountId} Deleted channelId=${channelId} from the database`
        );
      } catch (err) {
        console.error(
          prefix(),
          `Service account client_id=${serviceAccountId} Failed to delete channelId=${channelId} from the database: ${err.message}`
        );
      }
    })
  );

  console.log(prefix(), `Service account client_id=${serviceAccountId} Purged all webhooks`);
};