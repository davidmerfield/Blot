const key = require("./key");
const client = require("models/client");
const { promisify } = require("util");
const hgetall = promisify(client.hgetall).bind(client);
const debug = require("debug")("blot:template:getViewByURLPattern");
const { match } = require("path-to-regexp");
const { parse } = require("url");

/**
 * Get a view by matching its URL pattern.
 *
 * @param {string} templateID - The ID of the template.
 * @param {string} url - The URL to match.
 * @param {function} callback - Callback function (err, viewName, params, query).
 */
module.exports = async function getViewByURLPattern(templateID, url, callback) {
  debug("Looking up views for templateID:", templateID, "URL:", url);

  try {
    // Parse the URL into components (using Node.js `url` module)
    const { pathname, query } = parse(url, true); // `true` parses query string into an object
    const normalizedPathname = normalizePathname(pathname);

    debug("Normalized URL:", normalizedPathname);

    // Fetch all views and their patterns for the given template ID
    const viewPatternStrings = await hgetall(key.urlPatterns(templateID));

    if (!viewPatternStrings) {
      debug("No views found for templateID:", templateID);
      return callback(new Error("No views found for the given template ID"), null, null, query);
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
        const normalizedPattern = normalizePathname(rawPattern);
        const matchPattern = match(normalizedPattern, { decode: decodeURIComponent });
        const matchResult = matchPattern(normalizedPathname);

        if (matchResult) {
          debug(
            "Matched pattern:",
            rawPattern,
            "with normalized URL:",
            normalizedPathname,
            "in view:",
            viewName
          );
          return callback(null, viewName, matchResult.params, query);
        }
      }
    }

    // No matching pattern found
    debug("No matching pattern found for URL:", url);
    return callback(new Error("No matching pattern found: " + url + "\n" + views), null, null, null);
  } catch (error) {
    debug("Error while matching URL:", error);
    return callback(error, null, null, null);
  }
};

/**
 * Normalize a pathname by adding a leading slash, removing trailing slashes, and converting to lowercase.
 *
 * @param {string} pathname - The pathname to normalize.
 * @returns {string} - The normalized pathname.
 */
function normalizePathname(pathname) {
  // Ensure pathname is a string, add a leading slash if missing, remove trailing slashes, then lowercase
  return `/${pathname.replace(/^\/+/, "").replace(/\/+$/, "").toLowerCase()}`;
}