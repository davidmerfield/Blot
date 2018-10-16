module.exports = {
  create: require("./create"),
  update: require("./update"),
  drop: require("./drop"),
  get: require("./get"),
  list: require("./list"),

  view: require('./view'),

  // writeToFolder: require("./writeToFolder"),
  // updateFromFolder: require("./updateFromFolder"),

  slug: require("./util/slug"),
  isOwner: require("./isOwner"),
  model: require("./model")
};
