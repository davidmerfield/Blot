const config = require("config");
const Blog = require("blog");
const isSubdomain = require("./isSubdomain");

module.exports = function(req, res, next) {
  var identifier, handle, err;
  var host = req.get("host");

  // Not sure why this happens but it do
  if (!host) {
    err = new Error("No blog");
    err.code = "ENOENT";
    return next(err);
  }

  // Cache the original host for use in templates
  // this should be req.locals.originalHost
  req.originalHost = host;

  // We don't want to serve a blog in place of
  // the main blot site so leave now.
  if (host === config.host) return next();

  // Redirect www subdomain of main blot site to
  // the apex domain on which it is served.
  if (host === "www." + config.host) {
    return res.redirect(req.protocol + "://" + config.host + req.originalUrl);
  }

  handle = extractHandle(host);

  if (handle) {
    identifier = { handle: handle };
  } else {
    identifier = { domain: host };
  }

  req.identifier = identifier;

  Blog.get(identifier, function(err, blog) {
    if (err) return next(err);

    if (!blog || blog.isDisabled || blog.isUnpaid) {
      err = new Error("No blog");
      err.code = "ENOENT";
      return next(err);
    }

    // Load in pretty and shit...
    // this must follow preview
    // since cssURL and scriptURL
    // for subdomains.
    blog = Blog.extend(blog);

    blog.locals = blog.locals || {};

    // Store the original request's url so templates {{blogURL}}
    blog.locals.blogURL = req.protocol + "://" + req.originalHost;
    blog.locals.siteURL = "https://" + config.host;

    // Store the blog's info so routes can access it
    req.blog = blog;
    return next();
  });
};

function extractHandle(host) {
  if (!isSubdomain(host, config.host)) return false;

  let handle = host
    .slice(0, -config.host.length - 1)
    .split(".")
    .pop();

  // Follows the new convention for preview subdomains, e.g.
  // preview-of-$template-on-$handle.$host e.g.
  // preview-of-diary-on-news.blot.im
  if (handle.indexOf("-") > -1) handle = handle.split("-").pop();

  return handle;
}
