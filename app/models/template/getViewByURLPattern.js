const key = require("./key");
const client = require("client");
const { promisify } = require("util");
const hgetall = promisify(client.hgetall).bind(client);
const debug = require("debug")("template:getViewByURLPattern");
const { match } = require("path-to-regexp");

module.exports = async function getViewByURLPattern(templateID, url) {
  debug("Looking up views for templateID:", templateID, "URL:", url);

  // Fetch all views and their patterns for the given template ID
  const viewPatternStrings = await hgetall(key.urlPatterns(templateID));

  if (!viewPatternStrings) {
    debug("No views found for templateID:", templateID);
    return null;
  }

  // Parse the Redis hash object into an array of [viewName, urlPatterns]
  const views = Object.entries(viewPatternStrings).map(([viewName, patterns]) => [
    viewName,
    JSON.parse(patterns), // Patterns are stored as JSON strings
  ]);

  // Sort views alphabetically by view name
  views.sort(([viewNameA], [viewNameB]) => viewNameA.localeCompare(viewNameB));

  // Iterate through views and match the URL
  for (const [viewName, urlPatterns] of views) {
    for (const pattern of urlPatterns) {
      const matchPattern = match(pattern, { decode: decodeURIComponent });
      const matchResult = matchPattern(url);

      if (matchResult) {
        debug("Matched pattern:", pattern, "with URL:", url, "in view:", viewName);
        return [viewName, matchResult.params]; // Return view name and matched parameters
      }
    }
  }

  debug("No matching pattern found for URL:", url);
  return null; // No match found
};