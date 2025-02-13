const { google } = require('googleapis');

/**
 * Authenticate with Google Drive using the service account credentials.
 */
module.exports = async function authenticateWithServiceAccount() {

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