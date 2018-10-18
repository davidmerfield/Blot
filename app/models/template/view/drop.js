var client = require("client");
var key = require("./key");

module.exports = function drop(templateID, viewID, callback) {
  var multi = client.multi();

  multi.del(key.view(templateID, viewID));
  multi.srem(key.allViews(templateID), viewID);

  multi.exec(callback);
};
