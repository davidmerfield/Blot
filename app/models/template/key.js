module.exports = {
  metadata: function(name) {
    return "template:" + name + ":info";
  },

  view: function(name, viewName) {
    return "template:" + name + ":view:" + viewName;
  },

  url: function(templateID, url) {
    return "template:" + templateID + ":url:" + url;
  },

  allViews: function(name) {
    return "template:" + name + ":all_views";
  },

  publicTemplates: "template:public_templates",

  blogTemplates: function(blogID) {
    return "template:owned_by:" + blogID;
  }
};
