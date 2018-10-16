module.exports = {
  create: require("./create"),
  update: require("./update"),
  drop: require("./drop"),
  get: require("./get"),

  getView: require("./getView"),
  getViewByURL: require("./getViewByURL"),
  setView: require("./setView"),
  dropView: require("./dropView"),

  getPartials: require("./getPartials"),
  getAllViews: require("./getAllViews"),
  getTemplateList: require("./getTemplateList"),

  writeToFolder: require("./writeToFolder"),
  updateFromFolder: require("./updateFromFolder"),

  slug: require("./slug"),
  isOwner: require("./isOwner"),
  model: require("./model")
};
