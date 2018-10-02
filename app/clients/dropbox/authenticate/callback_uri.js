module.exports = function callback_uri(req) {
  return req.protocol + "://" + req.get("host") + req.baseUrl;
};
