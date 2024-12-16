const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Path to your service account credentials JSON file
const CREDENTIALS_PATH = path.join(__dirname, 'data', 'service-account-creds.json');

// The ID of the "Sites" folder in Blot's Google Drive
const SITES_FOLDER_ID = process.env.BLOT_GOOGLEDRIVE_FOLDER_ID;

/**
 * Authenticate with Google Drive using the service account credentials.
 */
async function authenticateWithServiceAccount() {
  // Load service account credentials from file
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

  // Create a JWT client
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * List the contents of root folder.
 */
async function listFolderContents(drive, folderId) {
  try {
    const res = await drive.files.list({
        q: `trashed = false and '${folderId}' in parents`,
        fields: 'files(id, name, mimeType)',
        });

    const files = res.data.files || [];
    console.log(`Contents of folder (${folderId}):`);
    files.forEach((file) => {
      console.log(`- ${file.name} (${file.id}, ${file.mimeType})`);
    });
  } catch (error) {
    console.error('Error listing folder contents:', error.message);
  }
}

/**
 * Main function to execute the operations.
 */
async function main() {
  try {
    // Authenticate with the service account
    const drive = await authenticateWithServiceAccount();


    // List the contents of the "Sites" folder
    await listFolderContents(drive, SITES_FOLDER_ID);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the script
main();