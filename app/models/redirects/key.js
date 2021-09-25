module.exports = {
  redirects: function (blogID) {
    return "blog:" + blogID + ":redirects";
  },
  redirect: function (blogID, from) {
    return "blog:" + blogID + ":redirect:" + from;
  },
};
