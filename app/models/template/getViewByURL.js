const key = require("./key");
const client = require("models/client");
const { promisify } = require("util");
const hgetall = promisify(client.hgetall).bind(client);
const get = promisify(client.get).bind(client);
const debug = require("debug")("blot:template:getViewByURLPattern");
const { match } = require("path-to-regexp");
const { parse } = require("url");
const urlNormalizer = require("helper/urlNormalizer");

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

    if (viewPatternStrings) {
      // Parse the Redis hash object into an array of [viewName, urlPatterns]
      const views = Object.entries(viewPatternStrings).map(
        ([viewName, patterns]) => [
          viewName,
          JSON.parse(patterns), // Patterns are stored as JSON strings
        ]
      );

      // Sort views alphabetically by view name
      views.sort(([viewNameA], [viewNameB]) =>
        viewNameA.localeCompare(viewNameB)
      );

      // Iterate through views and match the URL
      for (const [viewName, urlPatterns] of views) {
        for (const rawPattern of urlPatterns) {
          const normalizedPattern = normalizePathname(rawPattern);
          const matchPattern = match(normalizedPattern, {
            decode: decodeURIComponent,
          });
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
      debug("No matching url pattern found for URL:", url);
    } else {
      debug("No URL patterns found for templateID:", templateID);
    }

    // Fall back to matching the URL directly
    const viewName = await get(key.url(templateID, urlNormalizer(url)));

    if (viewName) {
      debug("Found view by URL:", viewName);
      return callback(null, viewName, null, query);
    }

    debug("No view found for URL:", url);
    return callback(null, null, null, null);
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
