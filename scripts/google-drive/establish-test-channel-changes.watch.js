// docker exec -it blot-node-app-1 node scripts/google-drive/establish-test-channel-changes.watch.js example

const config = require("config");

const ADDRESS = `https://${config.webhooks.relay_host}/clients/google-drive/api-test`;

const id = require("helper/guid")();

async function setup(drive) {
  // Fetch the start page token
  const {
    data: { startPageToken: pageToken },
  } = await drive.changes.getStartPageToken();

  // Set up a webhook
  const response = await drive.changes.watch({
    supportsAllDrives: true,
    includeDeleted: true,
    acknowledgeAbuse: true,
    includeCorpusRemovals: true,
    includeItemsFromAllDrives: true,
    restrictToMyDrive: false,
    pageToken,
    pageSize: 1,
    requestBody: {
      id,
      type: "web_hook",
      token: "changes.watch",
      address: ADDRESS,
    },
  });

  // console.log(response.data);
  return response.data.resourceId; // Return the resourceId for teardown
}

async function teardown(drive, resourceId) {
  if (!drive) {
    console.error("Drive client is not initialized");
    return;
  }

  try {
    console.log("Tearing down webhook...");

    // Stop the channel using the resource ID
    const res = await drive.channels.stop({
      requestBody: {
        id,
        resourceId,
      },
    });

    if (res.status !== 204) {
      console.error("Failed to teardown webhook:", res);
      throw new Error("Failed to teardown webhook");
    }

    console.log("Webhook teardown successful");
  } catch (e) {
    console.error("Error tearing down Google Drive webhook:", e);
  }
}


module.exports = { setup, teardown };