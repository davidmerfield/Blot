const config = require("config");

module.exports = function(req, res, next) {
  var redirect;
  var host = req.get("host");

  // Probably a www -> apex redirect
  if (req.identifier.domain && req.blog.domain !== req.identifier.domain)
    redirect = req.protocol + "://" + req.blog.domain + req.originalUrl;

  // Redirect old handle
  if (req.identifier.handle && req.blog.handle !== req.identifier.handle)
    redirect =
      req.protocol +
      "://" +
      req.blog.handle +
      "." +
      config.host +
      req.originalUrl;

  // Redirect Blot subdomain to custom domain we use
  // 302 temporary since the domain might break in future
  if (
    req.identifier.handle &&
    req.blog.domain &&
    req.blog.redirectSubdomain &&
    !req.preview
  )
    return res
      .status(302)
      .redirect(req.protocol + "://" + req.blog.domain + req.originalUrl);

  // Redirect HTTP to HTTPS. Preview subdomains are not currently
  // available over HTTPS but when they are, remove this.
  if (req.blog.forceSSL && req.protocol === "http" && !req.preview)
    redirect = "https://" + host + req.originalUrl;

  // Should we be using 302 temporary for this?
  if (redirect) return res.status(301).redirect(redirect);

  return next();
};
