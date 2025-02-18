const fs = require('fs-extra');
const jsonPath = process.argv[2];
const label = require('path').basename(jsonPath, '.json').toUpperCase().replace(/[^A-Z0-9_]/g, '_');

if (!jsonPath) {
    console.error('Please provide the path to the JSON file');
    console.error('Usage: node scripts/google-drive/convertCredentialJSON <path to credentials.json>');
    process.exit(1);
}

const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

if (!json.client_id) {
    console.error('The JSON file is missing one of the following keys: client_id');
    process.exit(1);
}

if (!json.project_id) {
    console.error('The JSON file is missing one of the following keys: project_id');
    process.exit(1);
}

if (!json.private_key_id) {
    console.error('The JSON file is missing one of the following keys: private_key_id');
    process.exit(1);
}

if (!json.private_key) {
    console.error('The JSON file is missing one of the following keys: private_key');
    process.exit(1);
}


let base64String = Buffer.from(JSON.stringify(json)).toString('base64');

// This is padding for base64 strings, hopefully
while (base64String.endsWith('=')) {
    base64String = base64String.slice(0, -1);
}

console.log(`Copy and paste the following into your .env file:

BLOT_GOOGLEDRIVE_SERVICE_ACCOUNT_${label}=${base64String}

Add the following to the comma-seperated list BLOT_GOOGLEDRIVE_CLIENT_IDS in your .env file:

BLOT_GOOGLEDRIVE_SERVICE_ACCOUNT_IDS=${label}`);