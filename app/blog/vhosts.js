var Blog = require("models/blog");
var config = require("config");

module.exports = function (req, res, next) {
  var identifier, handle, redirect, previewTemplate, err;
  var host = req.get("host");

  // We have a special case for Cloudflare
  // because some of their SSL settings insist on fetching
  // from the origin server (in this case Blot) over HTTP
  // which causes a redirect loop when we try to redirect
  // to HTTPS. This is a workaround.
  var fromCloudflare =
    Object.keys(req.headers || {})
      .map(key => key.trim().toLowerCase())
      .find(key => key.startsWith("cf-")) !== undefined;

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
    // strip port if present, this is required by test suite
    // and is a good idea in general
    const domain = host.indexOf(":") > -1 ? host.split(":")[0] : host;
    identifier = { domain };
  }

  Blog.get(identifier, function (err, blog) {
    if (err) return next(err);

    if (!blog || blog.isDisabled || blog.isUnpaid) {
      err = new Error("No blog");
      err.code = "ENOENT";
      return next(err);
    }

    previewTemplate = extractPreviewTemplate(host, blog.id);

    // Probably a www -> apex redirect
    if (identifier.domain && blog.domain !== identifier.domain)
      redirect = req.protocol + "://" + blog.domain + req.originalUrl;

    // Redirect old handle
    if (identifier.handle && blog.handle !== identifier.handle)
      redirect =
        req.protocol +
        "://" +
        blog.handle +
        "." +
        config.host +
        req.originalUrl;

    // Redirect Blot subdomain to custom domain we use
    // 302 temporary since the domain might break in future
    if (
      identifier.handle &&
      blog.domain &&
      blog.redirectSubdomain &&
      !previewTemplate
    )
      return res
        .status(302)
        .redirect(req.protocol + "://" + blog.domain + req.originalUrl);

    // Redirect HTTP to HTTPS. Preview subdomains are not currently
    // available over HTTPS but when they are, remove this.
    if (
      blog.forceSSL &&
      req.protocol === "http" &&
      !previewTemplate &&
      fromCloudflare === false
    )
      redirect = "https://" + host + req.originalUrl;

    // Should we be using 302 temporary for this?
    if (redirect) return res.status(301).redirect(redirect);

    // Retrieve the name of the template from the host
    // If the request came from a preview domain
    // e.g preview.original.david.blot.im
    if (previewTemplate) {
      // Necessary to allow the template editor to embed the page
      res.removeHeader("X-Frame-Options");

      req.preview = true;
      res.set("Cache-Control", "no-cache");

      // construct the template ID
      blog.template = previewTemplate;

      // don't use the deployed asset for preview subdomains
      blog.cssURL = Blog.url.css(blog.cacheID);
      blog.scriptURL = Blog.url.js(blog.cacheID);
    } else {
      req.preview = false;
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

function isSubdomain (host) {
  return (
    host.slice(-config.host.length) === config.host &&
    host.slice(0, -config.host.length).length > 1
  );
}

function extractHandle (host) {
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

function extractPreviewTemplate (host, blogID) {
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
      templateName = handle.slice("preview-of-".length).split("-on-").shift();
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

// for testing in tests/vhosts.js
module.exports.extractHandle = extractHandle;
module.exports.extractPreviewTemplate = extractPreviewTemplate;
module.exports.isSubdomain = isSubdomain;
