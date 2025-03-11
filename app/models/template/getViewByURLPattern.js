const key = require("./key");
const client = require("models/client");
const { promisify } = require("util");
const hgetall = promisify(client.hgetall).bind(client);
const debug = require("debug")("template:getViewByURLPattern");
const { match } = require("path-to-regexp");

/**
 * Get a view by matching its URL pattern.
 *
 * @param {string} templateID - The ID of the template.
 * @param {string} url - The URL to match.
 * @param {function} callback - Callback function (err, viewName, params).
 */
module.exports = async function getViewByURLPattern(templateID, url, callback) {
  debug("Looking up views for templateID:", templateID, "URL:", url);

  try {
    // Normalize the URL: remove query string, trailing slash, and convert to lowercase
    const normalizedUrl = normalizeUrl(url);

    // Fetch all views and their patterns for the given template ID
    const viewPatternStrings = await hgetall(key.urlPatterns(templateID));

    if (!viewPatternStrings) {
      debug("No views found for templateID:", templateID);
      return callback(new Error("No views found for the given template ID"), null);
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
      for (const rawPattern of urlPatterns) {
        const normalizedPattern = normalizeUrl(rawPattern);
        const matchPattern = match(normalizedPattern, { decode: decodeURIComponent });
        const matchResult = matchPattern(normalizedUrl);

        if (matchResult) {
          debug("Matched pattern:", rawPattern, "with URL:", url, "in view:", viewName);
          return callback(null, viewName, matchResult.params);
        }
      }
    }

    // No matching pattern found
    debug("No matching pattern found for URL:", url);
    return callback(new Error("No matching pattern found"), null);
  } catch (error) {
    debug("Error while matching URL:", error);
    return callback(error, null);
  }
};

/**
 * Normalize a URL by removing the query string, trailing slash, and converting to lowercase.
 *
 * @param {string} url - The URL to normalize.
 * @returns {string} - The normalized URL.
 */
function normalizeUrl(url) {
  return url.split("?")[0].replace(/\/+$/, "").toLowerCase();
}