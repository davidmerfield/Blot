var helper = require("helper");
var ensure = helper.ensure;
var reds = require("reds");
var searchKey = require("./key").search;
var transliterate = require("transliteration");
var model = require("./model");

module.exports = function(blogID, entry, callback) {
  ensure(blogID, "string")
    .and(entry, model)
    .and(callback, "function");

  // Update the blog's search index
  var search = reds.createSearch(searchKey(blogID));
  var id = entry.id + "";
  var material = "";

  // This entry should not be visible in search results
  // Its possible it was added in the past, so we must
  // remove it now. Should we hide pages from the search results?
  // Right now I am just hiding invisible pages.
  if (
    entry.deleted ||
    entry.draft ||
    entry.scheduled ||
    (entry.page && !entry.menu)
  )
    return search.remove(id, callback);

  // we want to ensure that the
  // tags are also included in the search index
  material += entry.tags.join(" ") + " ";
  material += entry.html;
  material = transliterate(material);

  search.index(material, id, callback);
};
