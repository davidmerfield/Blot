const clfdate = require("helper/clfdate");
const prefix = () => clfdate() + " files.list         ";

let previousRecentChangeTime = null;

async function main(drive) {

    const mostRecentlyUpdatedItems = await drive.files.list({
        pageSize: 1,
        orderBy: 'recency desc',
        fields: 'files(id, name, modifiedTime, createdTime, modifiedByMeTime, viewedByMeTime, sharedWithMeTime, trashedTime)',
    });


    const mostRecentlyUpdatedItem = mostRecentlyUpdatedItems.data.files[0];

    if (!mostRecentlyUpdatedItem) {
        console.log(prefix(), "No files found.");
        return;
    }

    const mostRecentTime = Object.entries(mostRecentlyUpdatedItem)
    .filter(([key, value]) => key.includes('Time') && !isNaN(new Date(value).getTime()))
    .reduce((acc, [key, value]) => {
        const time = new Date(value).getTime();
        return time > acc ? time : acc;
    }, 0);

    if (mostRecentTime === previousRecentChangeTime) {
        // console.log(prefix(), "no new activity");
    } else {
        if (previousRecentChangeTime) {
            console.log(prefix(), mostRecentlyUpdatedItem.name, new Date(mostRecentTime).toISOString());
        }
        previousRecentChangeTime = mostRecentTime;
    }


}

module.exports = main;