module.exports = {
  blogTemplates: function(blogID) {
    return "template:owned_by:" + blogID;
  },

  metadata: function(templateID) {
    return "template:" + templateID + ":info";
  },

  publicTemplates: "template:public_templates"
};
