const clfdate = require("helper/clfdate");
const prefix = () => clfdate() + " changes.list       ";

let previousRecentChangeTime = null;
let startPageToken = null;

async function main(drive) {

    // list recent changes using changes.list for the account.folderId 
    // https://developers.google.com/drive/api/v3/reference/changes/list

    startPageToken = startPageToken || (await drive.changes.getStartPageToken()).data.startPageToken;

    // console.log(prefix(), "Fetching recent changes across service account, startPageToken:", startPageToken);

    const res = await drive.changes.list({
        pageSize: 10,
        pageToken: startPageToken,
        includeCorpusRemovals: true,
        includeItemsFromAllDrives: true,
        includeRemoved: true,
        restrictToMyDrive: false,
        supportsAllDrives: true,
    });

    if (!res.data || !res.data.changes || !res.data.changes.length) {
        // console.log(res);
        // console.log(prefix(), "No changes found: ", email, startPageToken);
        return;
    }

    const mostRecentChange = res.data.changes.at(-1);
    const mostRecentChangeTime = new Date(mostRecentChange.time).toISOString();

    if (previousRecentChangeTime === mostRecentChangeTime) {
        // console.log(prefix(), "No new changes");
        return;
    } else {
        previousRecentChangeTime = mostRecentChangeTime;
        if (mostRecentChange.file) {
            console.log(prefix(), mostRecentChange.file.name, mostRecentChangeTime);
        } else {
            console.log(prefix(), "No file found in change", mostRecentChange);
        }
        startPageToken = res.data.newStartPageToken;
    }
}


module.exports = main;

