module.exports = function(req, callback) {
  return callback(null, req.blog.scriptURL);
};
