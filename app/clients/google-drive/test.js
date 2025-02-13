const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const config = require('config');
const guid = require("helper/guid");
const hash = require("helper/hash");
const querystring = require("querystring");

/**
 * Authenticate with Google Drive using the service account credentials.
 */
async function authenticateWithServiceAccount() {

  const credentials = {
    "type": "service_account",
    "project_id": process.env.BLOT_GOOGLEDRIVE_PROJECT_ID,
    "private_key_id": process.env.BLOT_GOOGLEDRIVE_PRIVATE_KEY_ID,
    "private_key": Buffer.from(process.env.BLOT_GOOGLEDRIVE_PRIVATE_KEY_BASE64, 'base64').toString(),
    "client_email": process.env.BLOT_GOOGLEDRIVE_CLIENT_EMAIL,
    "client_id": process.env.BLOT_GOOGLEDRIVE_CLIENT_ID,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.BLOT_GOOGLEDRIVE_CLIENT_EMAIL)}`,
    "universe_domain": "googleapis.com"
  };
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * List the contents of root folder.
 */
async function waitForSharedFolder(drive, email) {
  try {
    console.log('Listing root folder contents...' + email);
    const res = await drive.files.list({
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      q: `'${email}' in owners and trashed = false and mimeType = 'application/vnd.google-apps.folder'`,
    });

    if (res.data.files.length === 0) {
      console.log('No shared folder found.... waiting 3 seconds and trying again ' + email);
      await new Promise(resolve => setTimeout(resolve, 3000));
      return waitForSharedFolder(drive, email);
    }

    const folderId = res.data.files[0].id;
    console.log(`Shared folder found with ID: ${folderId}`);
    return folderId;
  } catch (error) {
    console.error('Error listing folder contents:', error.message);
  }
}

/**
 * Main function to execute the operations.
 */
async function main(email) {
  if (!email) {
    console.error('Please provide an email address to share the folder with.');
    return;
  }
    
  try {

    
    // Authenticate with the service account
    const drive = await authenticateWithServiceAccount();


    // List the contents of the "Sites" folder
    const sharedFolderID = await waitForSharedFolder(drive, email);
    
    console.log('Shared folder ID:', sharedFolderID);

    const { data: { startPageToken} } = await drive.changes.getStartPageToken({
      supportsAllDrives: true,
      includeDeleted: true,
      includeCorpusRemovals: true,
      includeItemsFromAllDrives: true,
    });

    console.log('Start page token:', startPageToken);

    const listChanges = async (pageToken) => {
      const {data} = await drive.changes.list({
        supportsAllDrives: true,
        includeDeleted: true,
        includeCorpusRemovals: true,
        includeItemsFromAllDrives: true,
        fields: [
          "nextPageToken",
          "newStartPageToken",
          "changes/file/id",
          "changes/file/name",
          "changes/file/mimeType",
          "changes/file/trashed",
          "changes/file/parents",
          "changes/file/modifiedTime",
          "changes/file/md5Checksum",
        ].join(","),
        pageToken
      });

      console.log('Changes:', data);

      setTimeout(() => listChanges(data.newStartPageToken || pageToken), 5000);
    };

    listChanges(startPageToken);

  // attempt to set up a webhook

    console.log('done!');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the script
main(process.argv[2]);