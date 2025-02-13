const Entries = require("models/entries");

/**
 * Handles rendering of the page with entries and pagination.
 */
module.exports = function (req, res, next) {
  const blog = req.blog;

  // Parse and validate page number (user input)
  const pageNo = parsePageNumber(req.params.page_number);

  // Parse and validate page size (user input via template)
  const pageSize = parsePageSize(req.template?.locals?.page_size);

  // Fetch entries and render the view
  req.log("Loading entries for page", pageNo, "with page size", pageSize);
  Entries.getPage(blog.id, pageNo, pageSize, (entries, pagination) => {
    pagination.current = pageNo;

    res.locals.entries = entries;
    res.locals.pagination = pagination;

    req.log("Rendering entries");
    res.renderView("entries.html", next);
  });
}

/**
 * Utility function to validate and parse the page number.
 * Falls back to 1 if the input is invalid or undefined.
 *
 * @param {string|undefined} pageNumber - The page number from user input.
 * @returns {number} - A valid page number (default: 1).
 */
function parsePageNumber(pageNumber) {
  const parsedPageNumber = parseInt(pageNumber, 10);

  // Ensure the page number is a positive integer; default to 1 if invalid
  if (!isNaN(parsedPageNumber) && parsedPageNumber > 0) {
    return parsedPageNumber;
  }

  return 1; // Default page number
}

/**
 * Utility function to validate and parse the page size.
 * Falls back to a default value if the input is invalid or undefined.
 *
 * @param {string|number|undefined} templatePageSize - Page size from the template (user input).
 * @returns {number} - A valid page size (default: 5).
 */
function parsePageSize(templatePageSize) {
  const defaultPageSize = 5;

  // Attempt to parse and validate template page size (user input)
  const parsedTemplatePageSize = parseInt(templatePageSize, 10);
  if (!isNaN(parsedTemplatePageSize) && parsedTemplatePageSize > 0 && parsedTemplatePageSize <= 100) {
    return parsedTemplatePageSize;
  }

  return defaultPageSize; // Default page size
}
