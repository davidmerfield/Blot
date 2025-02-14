const fs = require('fs-extra');

if (process.argv.length !== 3) {
    console.error('Usage: node app/clients/google-drive/scripts/parseCreds.js <path to credentials.json>');
    process.exit(1);
}

const json = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

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

console.log(`Copy and paste the following into your .env file:

BLOT_GOOGLEDRIVE_SERVICE_ACCOUNT_${json.client_id}=${Buffer.from(JSON.stringify(json)).toString('base64')}

Add the following to the comma-seperated list BLOT_GOOGLEDRIVE_CLIENT_IDS in your .env file:

BLOT_GOOGLEDRIVE_SERVICE_ACCOUNT_IDS=${json.client_id}`);