const transliterate = require("transliteration");
const ensure = require("helper/ensure");
const client = require("models/client");
const { promisify } = require("util");
const get = promisify((blogID, entryIDs, callback) =>
  require("./get")(blogID, entryIDs, function (entries) {
    callback(null, entries);
  })
);

module.exports = function (blogID, query, callback) {
  ensure(blogID, "string").and(query, "string").and(callback, "function");

  const results = [];

  const terms = query.split(/\s+/).map(term => term.trim().toLowerCase());

  // this will not search pages or deleted entries
  const key = "blog:" + blogID + ":all";

  client.zrevrange(key, 0, -1, async function (err, entryIDs) {
    const chunked = [...chunks(entryIDs, 100)];

    for (const page of chunked) {
      const entries = await get(blogID, page);
      for (const entry of entries) {
        // skip deleted entries
        if (entry.deleted) {
          continue;
        }

        // skip draft entries
        if (entry.draft) {
          continue;
        }

        // skip pages that do not have search enabled
        if (entry.page && isTruthy(entry.metadata.search)) {
          continue;
        }

        // skip entries that have search disabled
        if (entry.metadata.search && isFalsy(entry.metadata.search)) {
          continue;
        }

        const text = [
          entry.title,
          entry.permalink,
          entry.tags.join(" "),
          entry.path,
          entry.html,
          Object.values(entry.metadata).join(" ")
        ]
          .join(" ")
          .toLowerCase();

        // if all the terms are found in the text, add the entry to the results
        if (terms.every(term => text.includes(term))) {
          results.push(entry);
        }
      }
    }

    callback(null, results);
  });
};

function isTruthy (value) {
  value = value.toString().toLowerCase().trim();
  return value === "true" || value === "yes" || value === "1";
}

function isFalsy (value) {
  value = value.toString().toLowerCase().trim();
  return value === "false" || value === "no" || value === "0";
}

function* chunks (arr, n) {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n);
  }
}
