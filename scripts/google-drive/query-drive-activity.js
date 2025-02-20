const config = require('config');
const { google } = require('googleapis');

const get = require('../get/blog');
const clfdate = require("helper/clfdate");
const prefix = () => clfdate() + " Google Drive client:";
const database = require("clients/google-drive/database");

async function main(blog) {

    const account = await database.getAccount(blog.id);

    if (!account || !account.client_id) throw "Account not found for blog: " + blog.id;

    const serviceAccount = await database.serviceAccount.get(account.client_id);

    if (!serviceAccount) throw "Service account not found: " + account.client_id;

    const email = serviceAccount.user.emailAddress;

    if (!email) throw "Please pass the service account's email as an argument.";

    const credentials = config.google_drive.service_accounts.find(sa => sa.client_email === email);

    if (!credentials) throw "Service account not found: " + email;

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.activity.readonly'],
    });

    const driveactivity = google.driveactivity({ version: 'v2', auth });

    console.log(prefix(), "Service account client_id=" + credentials.client_id, "Fetching recent activity");

    const res = await driveactivity.activity.query({
        pageSize: 10,
        ancestorName: "items/" + account.folderId,
    });

    console.log(res);

    console.log(prefix(), "Service account client_id=" + credentials.client_id, "Found", res.data, "activities");
}

get(process.argv[2], function(err, user, blog) {
    if (err) throw err;
    main(blog).then(() => {
        console.log("Done!");
        process.exit();
        }).catch(err => {
        console.error(err);
        process.exit(1);
    });
});

