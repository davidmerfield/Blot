const client = require("models/client");
const ensure = require("helper/ensure");
const key = require("./key");
const clfdate = require("helper/clfdate");

module.exports = async function getAll(blogID, callback) {
  try {
    ensure(blogID, "string").and(callback, "function");

    console.log(clfdate(), "Fetching all tags for", blogID);

    // Fetch all tags using SMEMBERS
    const allTags = await new Promise((resolve, reject) => {
      client.smembers(key.all(blogID), (err, result) => {
        if (err) return reject(err);
        resolve(result || []);
      });
    });

    console.log(clfdate(), "Found", allTags.length, "tags for", blogID);

    if (allTags.length === 0) {
      return callback(null, []); // No tags to process
    }

    // Iterate over tags and fetch their details
    const tags = [];
    for (const tag of allTags) {
      console.log(clfdate(), "Fetching tag", tag, "for", blogID);
      const [entries, name] = await Promise.all([
        new Promise((resolve, reject) => {
          client.smembers(key.tag(blogID, tag), (err, result) => {
            if (err) return reject(err);
            resolve(result || []);
          });
        }),
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