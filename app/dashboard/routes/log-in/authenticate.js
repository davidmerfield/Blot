module.exports = function authenticate(req, user) {
  req.session.uid = user.uid;
  req.session.blogID = user.lastSession;
};
