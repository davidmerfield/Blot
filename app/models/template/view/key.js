module.exports = {
  url: function(templateID, url) {
    return "template:" + templateID + ":url:" + url;
  },

  view: function(name, viewName) {
    return "template:" + name + ":view:" + viewName;
  },

  allViews: function(name) {
    return "template:" + name + ":all_views";
  }
};
