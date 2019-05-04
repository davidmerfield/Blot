var ensure = require("helper").ensure;
var setView = require("./setView");

module.exports = function setMultipleViews(name, views, callback) {
  ensure(name, "string")
    .and(views, "object")
    .and(callback, "function");

  var totalViews = 0,
    error;

  for (var i in views) {
    totalViews++;
    setView(name, views[i], onSet);
  }

  if (!totalViews) onFinish();

  function onSet(err) {
    error = err;
    if (!--totalViews) onFinish();
  }

  function onFinish() {
    callback(error);
  }
};
