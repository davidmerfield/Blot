const Blog = require("blog");
const config = require("config");
const isSubdomain = require("./isSubdomain");

module.exports = function(req, res, next) {
  var host = req.get("host");
  var previewTemplate = extractPreviewTemplate(host, req.blog.id);

  // Retrieve the name of the template from the host
  // If the request came from a preview domain
  // e.g preview.original.david.blot.im
  if (previewTemplate) {
    // Necessary to allow the template editor to embed the page
    res.removeHeader("X-Frame-Options");

    req.preview = true;
    res.set("Cache-Control", "no-cache");

    // construct the template ID
    req.blog.template = previewTemplate;

    // don't use the deployed asset for preview subdomains
    req.blog.cssURL = Blog.url.css(req.blog.cacheID);
    req.blog.scriptURL = Blog.url.js(req.blog.cacheID);
  } else {
    req.preview = false;
  }

  next();
};

function extractPreviewTemplate(host, blogID) {
  if (!isSubdomain(host, config.host)) return false;

  var subdomains = host.slice(0, -config.host.length - 1).split(".");
  var handle = subdomains.pop();
  var prefix = subdomains.shift();

  // Follows the new convention for preview subdomains, e.g.
  // preview-of-$template-on-$handle.$host e.g.
  // preview-of-diary-on-news.blot.im
  if (handle.indexOf("-") > -1 && handle.indexOf("preview-of-") === 0) {
    let owner;
    let templateName;

    if (handle.indexOf("preview-of-my-") === 0) {
      owner = blogID;
      templateName = handle
        .slice("preview-of-my-".length)
        .split("-on-")
        .shift();
    } else {
      templateName = handle
        .slice("preview-of-".length)
        .split("-on-")
        .shift();
      owner = "SITE";
    }

    return `${owner}:${templateName}`;
  }

  if (!subdomains || !subdomains.length || prefix !== "preview") return false;

  var name = subdomains.pop();
  var isBlots = !subdomains.pop();

  if (host === handle + "." + config.host) return false;

  var owner = isBlots ? "SITE" : blogID;

  return owner + ":" + name;
}
