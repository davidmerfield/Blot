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

  query = transliterate(query);

  // this will not search pages or deleted entries
  const key = "blog:" + blogID + ":entries";

  client.zrevrange(key, 0, -1, async function (err, entryIDs) {
    const chunked = [...chunks(entryIDs, 100)];

    for (const page of chunked) {
      const entries = await get(blogID, page);
      for (const entry of entries) {
        // we should lowercase and stem this
        // we should also check other properties
        if (entry.html.includes(query)) results.push(entry);
      }
    }

    callback(null, results);
  });
};

function* chunks(arr, n) {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n);
  }
}
