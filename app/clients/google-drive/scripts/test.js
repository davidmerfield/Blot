const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const config = require('config');
const guid = require("helper/guid");
const hash = require("helper/hash");
const querystring = require("querystring");

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
  scopes: ['https://www.googleapis.com/auth/drive'] 
});


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
    const drive = google.drive({ version: 'v3', auth });


    const res = await drive.about.get({
      fields: "*"
    });

    console.log('About:', res.data);

    const storageUsageBytes = res.data.storageQuota.usage;
    const storageUsageMB = storageUsageBytes / 1024 / 1024 + 'MB';

    const storageLimitBytes = res.data.storageQuota.limit;
    const storageLimitMB = storageLimitBytes / 1024 / 1024 + 'MB';

    console.log('Storage usage:', storageUsageMB, '/', storageLimitMB);


    // // upload the profile picture to the service account
    // const admin = google.admin({ version: 'directory_v1', auth });

    // // use the picture ./profile.jpg
    // const picture = fs.readFileSync(path.join(__dirname, 'profile.png'));

    // console.log('Uploading profile picture...');
    
    // const res1 = await admin.users.photos.update({
    //   userKey: process.env.BLOT_GOOGLEDRIVE_CLIENT_ID,
    //   requestBody: {
    //     photoData: picture.toString('base64'),
    //   },
    // });

    // console.log('Profile picture uploaded:', res1.data);


    // create a test file of 1MB
    let testFile = ''
    for (let i = 0; i < 1024 * 1024; i++) {
      testFile += 'a';
    }

    // upload the file to google drive

    const res2 = await drive.files.create({
      requestBody: {
        name: 'test-' + guid() + '.txt',
        mimeType: 'text/plain',
        parents: ['root'],
      },
      media: {
        mimeType: 'text/plain',
        body: testFile,
      },
    });

    console.log('File uploaded:', res2.data);

    // re-fetch the about data
    const res3 = await drive.about.get({
      fields: "*"
    });

    console.log('About:', res3.data);

    const storageUsageBytes2 = res3.data.storageQuota.usage;
    const storageUsageMB2 = storageUsageBytes2 / 1024 / 1024 + 'MB';

    const storageLimitBytes2 = res3.data.storageQuota.limit;
    const storageLimitMB2 = storageLimitBytes2 / 1024 / 1024 + 'MB';

    console.log('Storage usage:', storageUsageMB2, '/', storageLimitMB2);

    // // delete the file

    // const res4 = await drive.files.delete({
    //   fileId: res2.data.id
    // });

    // console.log('File deleted:', res4.data);

    // // re-fetch the about data

    // const res5 = await drive.about.get({
    //   fields: "*"
    // });

    // console.log('About:', res5.data);

    // const storageUsageBytes3 = res5.data.storageQuota.usage;
    // const storageUsageMB3 = storageUsageBytes3 / 1024 / 1024 + 'MB';

    // const storageLimitBytes3 = res5.data.storageQuota.limit;
    // const storageLimitMB3 = storageLimitBytes3 / 1024 / 1024 + 'MB';

    // console.log('Storage usage:', storageUsageMB3, '/', storageLimitMB3);



  //   // List the contents of the "Sites" folder
  //   const sharedFolderID = await waitForSharedFolder(drive, email);
    
  //   console.log('Shared folder ID:', sharedFolderID);

  //   const { data: { startPageToken} } = await drive.changes.getStartPageToken({
  //     supportsAllDrives: true,
  //     includeDeleted: true,
  //     includeCorpusRemovals: true,
  //     includeItemsFromAllDrives: true,
  //   });

  //   console.log('Start page token:', startPageToken);

  //   const listChanges = async (pageToken) => {
  //     const {data} = await drive.changes.list({
  //       supportsAllDrives: true,
  //       includeDeleted: true,
  //       includeCorpusRemovals: true,
  //       includeItemsFromAllDrives: true,
  //       fields: [
  //         "nextPageToken",
  //         "newStartPageToken",
  //         "changes/file/id",
  //         "changes/file/name",
  //         "changes/file/mimeType",
  //         "changes/file/trashed",
  //         "changes/file/parents",
  //         "changes/file/modifiedTime",
  //         "changes/file/md5Checksum",
  //       ].join(","),
  //       pageToken
  //     });

  //     console.log('Changes:', data);

  //     setTimeout(() => listChanges(data.newStartPageToken || pageToken), 5000);
  //   };

  //   listChanges(startPageToken);

  // // attempt to set up a webhook

    console.log('done!');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the script
main(process.argv[2]);