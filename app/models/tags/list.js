const client = require("models/client");
const ensure = require("helper/ensure");
const key = require("./key");
const clfdate = require("helper/clfdate");

// Helper function to scan a Redis set using SSCAN
async function scanSet(key, pattern = "*") {
  let cursor = "0";
  let results = [];

  do {
    const [nextCursor, chunk] = await new Promise((resolve, reject) => {
      client.sscan(key, cursor, "MATCH", pattern, "COUNT", 100, (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    cursor = nextCursor;
    results = results.concat(chunk);
  } while (cursor !== "0");

  return results;
}

module.exports = async function getAll(blogID, callback) {
  try {
    ensure(blogID, "string").and(callback, "function");

    console.log(clfdate(), "Fetching all tags for", blogID);

    // Fetch all tags using SSCAN
    const allTags = await scanSet(key.all(blogID));

    console.log(clfdate(), "Found", allTags.length, "tags for", blogID);

    if (allTags.length === 0) {
      return callback(null, []); // No tags to process
    }

    // Iterate over tags and fetch their details
    const tags = [];
    for (const tag of allTags) {
      console.log(clfdate(), "Fetching tag", tag, "for", blogID);
      const [entries, name] = await Promise.all([
        scanSet(key.tag(blogID, tag)), // Use SSCAN to fetch entries of the tag
        new Promise((resolve, reject) => {
          client.get(key.name(blogID, tag), (err, result) => {
            if (err) return reject(err);
            resolve(result || "");
          });
        }),
      ]);

      console.log(clfdate(), "Fetched", entries.length, "entries for tag", tag, "for", blogID);
      if (entries.length > 0) {
        tags.push({
          name,
          slug: tag,
          entries,
        });
      }
    }

    console.log(clfdate(), "Fetched all tags for", blogID);
    return callback(null, tags);
  } catch (error) {
    return callback(error);
  }
};