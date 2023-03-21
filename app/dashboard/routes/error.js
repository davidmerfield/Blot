const config = require("config");

module.exports = function (err, req, res, next) {
  // If the user is not logged in, we sent them to the documentation
  if (err.message === "NOUSER") {
    let from;
    try {
      let referrer = require("url").parse(req.get("Referrer"));
      if (referrer.host === config.host) from = referrer.path;
    } catch (e) {}

    return res.redirect(
      "/log-in?then=" + req.originalUrl + (from ? "&from=" + from : "")
    );
  }

  console.log(err);
  console.log(err.trace);
  console.log(err.stack);
  res.status(500);
  res.send(":( Error");
};
