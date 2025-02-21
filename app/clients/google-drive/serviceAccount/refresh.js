const { google } = require("googleapis");
const clfdate = require("helper/clfdate");
const database = require("../database/serviceAccount"); // Path to serviceAccount database module

const prefix = () => `${clfdate()} Google Drive client:`;

// Refresh a single service account's statistics
const refreshServiceAccount = async (credentials) => {
  const clientId = credentials.client_id;

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });

  console.log(
    prefix(),
    `Service account client_id=${clientId} Fetching storage quota`
  );

  try {
    const res = await drive.about.get({
      fields: "storageQuota, user",
    });

    const { storageQuota, user } = res.data;

    if (!storageQuota || storageQuota.usage == null || storageQuota.limit == null) {
      throw new Error("Invalid storageQuota response from Google API.");
    }

    console.log(
      prefix(),
      `Service account client_id=${clientId} ${
        storageQuota.usage / 1024 / 1024
      } MB used of ${storageQuota.limit / 1024 / 1024} MB`
    );


    // Store service account data in the database
    await database.store(clientId, { storageQuota, user });

    console.log(
      prefix(),
      `Service account client_id=${clientId} updated successfully.`
    );
  } catch (e) {
    console.error(
      prefix(),
      `Service account client_id=${clientId} failed to update.`,
      e.message
    );
  }
};

// Refresh all service accounts
const refreshAllServiceAccounts = async (serviceAccounts) => {
  if (!serviceAccounts || serviceAccounts.length === 0) {
    console.log(prefix(), "No service accounts found in the configuration.");
    return;
  }

  console.log(prefix(), "Refreshing service accounts...");

  for (const credentials of serviceAccounts) {
    try {
      await refreshServiceAccount(credentials);
    } catch (e) {
      console.error(
        prefix(),
        `Failed to refresh service account client_id=${credentials.client_id}:`,
        e.message
      );
    }
  }

  console.log(prefix(), "Service accounts refreshed.");
};

// Export the functions for use elsewhere
module.exports = {
  refreshServiceAccount,
  refreshAllServiceAccounts,
};