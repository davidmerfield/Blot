module.exports = function(server) {
  require("./view")(server);
  require("./settings")(server);
  require("./local-editing")(server);
};
