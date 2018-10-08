module.exports = {
  create: require("./create"),
  update: require("./update"),
  getMetadata: require("./getMetadata"),
  setMetadata: require("./setMetadata"),

  getFullView: require("./getFullView"),
  getView: require("./getView"),
  getViewByURL: require("./getViewByURL"),
  setView: require("./setView"),
  dropView: require("./dropView"),
  getPartials: require("./getPartials"),
  getAllViews: require("./getAllViews"),
  getTemplateList: require("./getTemplateList"),

  drop: require("./drop"),

  parse: require("./parse"),
  readFromFolder: require("./readFromFolder"),
  writeToFolder: require("./writeToFolder"),
  updateFromFolder: require("./updateFromFolder"),
  slug: require("./slug"),

  makeID: require("./makeID"),
  isOwner: require("./isOwner"),
  siteOwner: "SITE",

  viewModel: require("./model").view,
  metadataModel: require("./model").metadata
};
