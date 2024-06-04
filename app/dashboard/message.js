const { join } = require("path");
const pathNormalizer = require("helper/pathNormalizer");
const normalize = (path) => pathNormalizer(path).toLowerCase();
const type = require("helper/type");

function middleware(req, res, next) {
  // Expose a valid message to the view
  if (req.session.message) {
    const currentURL = req.baseUrl ? join(req.baseUrl, req.path) : req.path;

    if (normalize(req.session.message.url) === normalize(currentURL)) {
      res.locals.message = req.session.message;
    } else {
      console.log(
        "skipping message with url",
        req.session.message.url,
        "and currentURL",
        currentURL,
        "message=",
        req.session.message
      );
    }

    if (req.session.message.error) {
      res.status(400);
    }

    delete req.session.message;
  }

  res.message = function (value, message) {
    let url = join(req.baseUrl || "", req.path);
    let text = "";
    let error = false;

    // res.message('/path', new Error('hey'));
    if (message instanceof Error) {
      url = value;
      text = message.message || "Error";
      error = true;
      // res.message('/path', 'Success!')
    } else if (typeof message === "string") {
      url = value;
      text = message;
      // res.message('Success!')
    } else if (message === undefined && typeof value === "string") {
      text = value;
      // res.message(new Error('X'))
    } else if (message === undefined && value instanceof Error) {
      text = message.message || "Error";
      error = true;
    }

    req.session.message = {
      text,
      error,
      url,
    };

    res.redirect(url);
  };

  next();
}

function errorHandler(err, req, res, next) {
  if (!req.body) {
    return next(err);
  }

  var redirect = req.body.redirect || req.path;
  var message = "Error";

  // this should not be an object but I made
  // some bad decisions in the past. eventually
  // fix blog.set...
  if (err.message) {
    message = err.message;
  }

  if (type(err, "object"))
    for (var i in err) if (type(err[i], "string")) message = err[i];

  console.log('redirecting here...', redirect, message);
  res.message(redirect, new Error(message));
}

module.exports = { middleware, errorHandler };
