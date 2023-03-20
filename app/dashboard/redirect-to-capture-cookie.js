const config = require("config");
const { parse } = require("url");
const cookieName = "alreadyRedirected";

// Because of our cookie security settings, external
// links (e.g. from email) deep into the dashboard
// do not work properly for logged-in users
// This will insert a redirect page that will allow us
// to extract a session if it actually exists
module.exports = function (err, req, res, next) {
  if (err && err.message !== "NOUSER") return next(err);

  let referrer = config.host;

  try {
    const header = req.get("Referrer");
    referrer = header ? parse(header).hostname : "";
  } catch (e) {}

  const differentReferrer = referrer !== config.host;
  const cookieUnset = !req.cookies || !req.cookies[cookieName];
  const redirect = req.protocol + "://" + req.hostname + req.originalUrl;

  if (differentReferrer && cookieUnset) {
    res.cookie(cookieName, "true", {
      domain: config.host,
      path: "/",
      secure: true,
      httpOnly: true,
      maxAge: 1 * 60 * 1000, // 1 minute
      sameSite: "Strict",
    });

    return res.send(html(redirect));
  }

  if (req.cookies && req.cookies[cookieName]) {
    res.clearCookie(cookieName);
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
