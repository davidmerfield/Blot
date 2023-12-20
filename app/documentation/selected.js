var titleFromSlug = require("helper/titleFromSlug");

var TITLES = {
  "how": "How to use Blot",
  "terms": "Terms of use",
  "privacy": "Privacy policy",
  "sync": "Sync your folder",
  "configure": "Configure your site",
  "google-drive": "Google Drive",
  "markdown": "Text and Markdown",
  "word-documents": "Word Documents",
  "html": "HTML",
  "how-blot-works": "How Blot works",
  "ask": "Ask a question",
  "urls": "URL format",
  "hard-stop-start-ec2-instance": "How to stop and start an EC2 instance",
  "who": "Who uses Blot?",
  "developers": "Developer guide",
  "json-feed": "JSON feed",
  "posts-tagged": "A page with posts with a particular tag"
};

module.exports = function (req, res, next) {
  res.locals.breadcrumbs = require("url")
    .parse(req.url)
    .pathname.split("/")
    .filter(slug => slug !== "")
    .map(function (slug, i, arr) {
      return {
        label: TITLES[slug] || titleFromSlug(slug),
        url: "/" + arr.slice(0, i + 1).join("/"),
        last: i === arr.length - 1
      };
    });

  if (req.url === "/") {
    res.locals.breadcrumbs = [];
  }

  if (res.locals.breadcrumbs.length < 2) res.locals.hidebreadcrumbs = true;

  res.locals.base = "";
  res.locals.selected = {};
  var url = req.originalUrl;

  // Trim trailing slash from the URL before working out which
  // slugs to set as selected. This ensures that the following url
  // https://blot.im/how/ will set {{publishingIndex}} as selected
  if (url.length > 1 && url.slice(-1) === "/") url = url.slice(0, -1);

  var slugs = url.split("/");

  slugs.forEach(function (slug) {
    res.locals.selected[slug] = "selected";
  });

  res.locals.selected[slugs[slugs.length - 1] + "Index"] = "selected";

  // Handle index page of site.
  if (req.originalUrl === "/") res.locals.selected.index = "selected";

  let slug = slugs.pop() || "Blot";
  let title = TITLES[slug] || titleFromSlug(slug);
  res.locals.title = title;

  next();
};
