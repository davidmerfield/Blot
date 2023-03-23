module.exports = function authenticate(req, res, user) {
  
  res.cookie("signed_into_blot", 'true', {
    domain: "",
    path: "/",
    secure: true,
    httpOnly: false,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'Lax',
  });

  req.session.uid = user.uid;
  req.session.blogID = user.lastSession;
};
