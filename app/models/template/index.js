module.exports = {
  create: require("./create"),
  update: require("./update"),
  drop: require("./drop"),
  get: require("./get"),
  list: require("./list"),
  view: require("./view"),
  read: require("./read"),
  write: require("./write"),

  slug: require("./util/slug"),
  model: require("./model"),
};
