const { google } = require('googleapis');
const database = require('../database');
const config = require('config');

module.exports = async function (blogID) {

  if (!blogID) {
    throw new Error('blogID is required');
  }

  if (!config.google_drive.service_accounts.length) {
    throw new Error('No Google Drive service accounts configured: please see the documentation');
  }

  const account = await database.getAccount(blogID);

  if (!account) {
    throw new Error('Account not found');
  }

  const client_id = account.client_id;

  if (!client_id) {
    throw new Error('Service account client_id not found');
  }

  const credentials = config.google_drive.service_accounts.find(
    (account) => account.client_id === client_id
  );

  if (!credentials) {
    throw new Error('Service account not found');
  }
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}