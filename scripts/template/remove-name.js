var fixEachView = require("./fixEachView");

fixEachView(
  function(view, callback) {
    if (view.content.indexOf("{{{name}}}") > -1) {
      view.content = view.content.split("{{{name}}}").join("{{{title}}}");
    }

    if (view.content.indexOf("{{name}}") > -1) {
      view.content = view.content.split("{{name}}").join("{{{title}}}");
    }

    callback();
  },
  function(err) {
    if (err) throw err;
    console.log("Fixed all views!");
    process.exit();
  }
);
