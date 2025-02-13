const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Path to your service account credentials JSON file
const CREDENTIALS_PATH = path.join(__dirname, 'data/service-account-creds.json');

// The ID of the "Sites" folder in Blot's Google Drive
const SITES_FOLDER_ID = process.env.BLOT_GOOGLEDRIVE_FOLDER_ID;

/**
 * Authenticate with Google Drive using the service account credentials.
 */
async function authenticateWithServiceAccount() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Create a subfolder in the "Sites" folder.
 */
async function createSubFolder(drive, parentFolderId, subFolderName) {
  try {
    const res = await drive.files.create({
      resource: {
        name: subFolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
      fields: 'id',
    });

    const folderId = res.data.id;
    console.log(`Subfolder "${subFolderName}" created with ID: ${folderId}`);
    return folderId;
  } catch (error) {
    console.error('Error creating subfolder:', error.message);
    throw error;
  }
}

/**
 * Share a folder with a user as an editor.
 */
async function shareFolderWithUser(drive, folderId, email) {
  try {
    await drive.permissions.create({
      fileId: folderId,
      resource: {
        type: 'user',
        role: 'writer',
        emailAddress: email,
      },
    });

    console.log(`Folder (${folderId}) shared with ${email} as editor.`);
  } catch (error) {
    console.error('Error sharing folder:', error.message);
    throw error;
  }
}

/**
 * Main function to create and share a subfolder.
 */
async function main(userEmail) {
  if (!userEmail) {
    console.error('Error: No email address provided.');
    process.exit(1);
  }

  try {
    // Authenticate with the service account
    const drive = await authenticateWithServiceAccount();

    // // Create a subfolder in the "Sites" folder
    // const subFolderName = `UserFolder-${Date.now()}`;
    // const subFolderId = await createSubFolder(drive, SITES_FOLDER_ID, subFolderName);

    const res = await drive.drives.list();

    console.log(res.data);

    // // Share the subfolder with the user
    // await shareFolderWithUser(drive, subFolderId, userEmail);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the script, passing the email as a command-line argument
const userEmail = process.argv[2];

if (!userEmail) {
    console.error('Error: No email address provided.');
    process.exit(1);
    }
main(userEmail);