module.exports = {
  metadata: function(name) {
    return "template:" + name + ":info";
  },
  
  publicTemplates: "template:public_templates",

  blogTemplates: function(blogID) {
    return "template:owned_by:" + blogID;
  }
};
