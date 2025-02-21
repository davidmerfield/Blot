const database = require("clients/google-drive/database/serviceAccount");
const config = require("config");
const email = require("helper/email");
const clfdate = require("helper/clfdate");

const MIN_FREE_SPACE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

const prefix = () => `${clfdate()} Google Drive:`;

// Select a service account for a blog
module.exports = async function () {
  // Fetch the list of all service account IDs from the database
  const serviceAccountIds = await database.list();

  if (!serviceAccountIds || serviceAccountIds.length === 0) {
    throw new Error("No service accounts found in the database.");
  }

  // Retrieve details for all service accounts
  const allServiceAccounts = [];
  for (const serviceAccountId of serviceAccountIds) {
    const account = await database.get(serviceAccountId);
    if (account) {
      allServiceAccounts.push({ serviceAccountId, ...account });
    }
  }

  if (allServiceAccounts.length === 0) {
    throw new Error("No valid service accounts found in the database.");
  }

  // Filter service accounts based on valid credentials from the config
  const validServiceAccounts = allServiceAccounts.filter((account) =>
    config.google_drive.service_accounts.some(
      (credentials) => credentials.client_id === account.serviceAccountId
    )
  );

  if (validServiceAccounts.length === 0) {
    throw new Error("No service accounts with valid credentials found in the database.");
  }

  // Log all accounts and their free space
  validServiceAccounts.forEach((account) => {
    const freeSpace = account.storageQuota.limit - account.storageQuota.usage;
    console.log(prefix(), `Service account ${account.serviceAccountId} has ${freeSpace} bytes of free space.`);
  });

  // Sort service accounts by available space in descending order
  validServiceAccounts.sort((a, b) => {
    const freeSpaceA = parseInt(a.storageQuota.limit) - parseInt(a.storageQuota.usage);
    const freeSpaceB = parseInt(b.storageQuota.limit) - parseInt(b.storageQuota.usage);
    return freeSpaceB - freeSpaceA; // Descending order
  });

  // Select the service account with the most available space
  const selectedAccount = validServiceAccounts[0];

  const selectedFreeSpace = selectedAccount.storageQuota.limit - selectedAccount.storageQuota.usage;
  console.log(prefix(), `Selected service account: ${selectedAccount.serviceAccountId} with ${selectedFreeSpace} bytes of free space.`);

  // Check if the selected service account is low on free space
  if (selectedFreeSpace < MIN_FREE_SPACE_BYTES) {
    console.log(prefix(), "Selected service account is low on free space.");
    email.GOOGLE_DRIVE_SERVICE_ACCOUNT_LOW();
  }

  // Return the selected service account's client ID
  return selectedAccount.serviceAccountId;
};