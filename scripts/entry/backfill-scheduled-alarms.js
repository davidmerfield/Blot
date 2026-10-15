// Arms a publication alarm (app/models/entry/scheduled.js) for every entry
// currently in a blog's "scheduled" list. Run once at deploy, so entries
// scheduled before alarms existed are published by whichever process polls
// next. Idempotent: setting an alarm again just rewrites its due time. Reads
// the lists; the only writes are the alarm sets.
//
// Usage: node scripts/entry/backfill-scheduled-alarms.js

const Blog = require("models/blog");
const Entries = require("models/entries");
const Entry = require("models/entry");
const scheduled = require("models/entry/scheduled");

function blogIDs() {
  return new Promise((resolve, reject) =>
    Blog.getAllIDs((err, ids) => (err ? reject(err) : resolve(ids)))
  );
}

// Entries.get swallows failures into an empty list; getListIDs and Entry.get
// report them, so a read failure is counted rather than mistaken for "none"
function scheduledEntries(blogID) {
  return new Promise((resolve, reject) =>
    Entries.getListIDs(blogID, "scheduled", {}, (err, ids) => {
      if (err) return reject(err);
      if (!ids.length) return resolve([]);
      Entry.get(blogID, ids, (entries, err) =>
        err ? reject(err) : resolve(entries)
      );
    })
  );
}

async function main() {
  let blogs = 0;
  let withScheduled = 0;
  let armed = 0;
  let failed = 0;

  for (const blogID of await blogIDs()) {
    blogs++;

    let entries;
    try {
      entries = await scheduledEntries(blogID);
    } catch (err) {
      failed++;
      console.error(`${blogID}: could not read scheduled list:`, err.message || err);
      continue;
    }

    if (!entries.length) continue;
    withScheduled++;

    for (const entry of entries) {
      try {
        await scheduled.alarm.set(scheduled.toID(blogID, entry.path), entry.dateStamp);
        armed++;
      } catch (err) {
        failed++;
        console.error(`${blogID} ${entry.path}: could not set alarm:`, err.message || err);
      }
    }
  }

  console.log(
    `Blogs: ${blogs}. With scheduled entries: ${withScheduled}. Alarms set: ${armed}.`,
    failed ? `Failed: ${failed}.` : ""
  );

  return failed;
}

main()
  .then((failed) => process.exit(failed ? 1 : 0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
