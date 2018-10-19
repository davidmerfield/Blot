module.exports = {
  create: require("./create"),
  update: require("./update"),
  drop: require("./drop"),
  get: require("./get"),
  list: require("./list"),

  view: require("./view"),
  slug: require("./util/slug"),
  isOwner: require("./isOwner"),
  model: require("./model"),

  read: require("./read"),
  write: require("./write")
};
