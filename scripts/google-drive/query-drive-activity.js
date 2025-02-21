const clfdate = require("helper/clfdate");
const prefix = () => clfdate() + " driveactivity.query";

let previousRecentChangeTime = null;


async function main(driveactivity, folderId) {

    // console.log(prefix(), "Fetching recent activity for folder", account.folderId);

    // although the API docs claim otherwise, if you don't specify the ancestorName as the root folder ID
    // explicity it somehow returns no activity.
    const res = await driveactivity.activity.query({
        requestBody: {
            pageSize: 1,
            "filter": "time >= \"2021-01-01T00:00:00Z\"",
        }
    }); 

    if (!res.data || !res.data.activities || !res.data.activities.length) {
        console.log(res);
        console.log(prefix(), "No activities found");
        return;
    }

    // find the first activity with a timestamp
    const activity = res.data?.activities?.find(a => a.timestamp);

    if (!activity) {
        console.log(prefix(), "No activities found with timestamp");
        return;
    }

    if (activity.timestamp === previousRecentChangeTime) {
        // console.log(prefix(), "no new activity");
    } else {
        if (previousRecentChangeTime) {
            console.log(prefix(), activity.targets[0].driveItem.title, new Date(activity.timestamp).toISOString());
        }
        previousRecentChangeTime = activity.timestamp;
    }   
}


module.exports = main;