const querystring = require("querystring");

// Because of our cookie security settings, external
// links (e.g. from email) deep into the dashboard
// do not work properly for logged-in users
// This will insert a redirect page that will allow us
// to extract a session if it actually exists
// We can remove this is we remove the samesite requirement
// from our dashboard session cookies
module.exports = function (err, req, res, next) {
  if (err && err.message !== "NOUSER") return next(err);

  const query = querystring.stringify({ ...req.query, redirected: true });
  const redirect =
    req.protocol + "://" + req.hostname + req.originalUrl + "?" + query;

  if (!req.query.redirected) {
    return res.send(html(redirect));
  }

  return next(err);
};

const html = (redirect) => `<html>
<head>
<meta http-equiv="refresh" content="0;URL='${redirect}'"/>
<script type="text/javascript">window.location='${redirect}'</script>
</head>
<body>
<noscript><p>Continue to <a href="${redirect}">${redirect}</a>.</p></noscript>
</body>
</html>`;
