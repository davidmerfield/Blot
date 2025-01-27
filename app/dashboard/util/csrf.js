const csurf = require("csurf");

// For each GET request -> Appends a one-time CSRF-checking token
// for each POST request -> validates this token using csurf

module.exports = function (req, res, next) {
  csurf()(req, res, function (err) {
    res.locals.csrftoken = req.csrfToken();
    req.next();
  });
};
