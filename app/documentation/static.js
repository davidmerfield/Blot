const Express = require("express");
const documentation = new Express();

const VIEW_DIRECTORY = __dirname + "/../views";

// Without 'index: false' this will server the index.html files inside the
// views folder in lieu of using the render definied in ./routes below.
// Without 'redirect: false' this will redirect URLs to existent directories
// adding an undesirable trailing slash.
documentation.use(
  "/fonts",
  Express.static(VIEW_DIRECTORY + "/fonts", {
    index: false,
    redirect: false,
    maxAge: 86400000,
  })
);

documentation.use(
  "/css",
  Express.static(VIEW_DIRECTORY + "/css", { index: false, redirect: false })
);

documentation.use(
  "/images",
  Express.static(VIEW_DIRECTORY + "/images", { index: false, redirect: false })
);

documentation.use(
  "/js",
  Express.static(VIEW_DIRECTORY + "/js", { index: false, redirect: false })
);

documentation.use(
  "/videos",
  Express.static(VIEW_DIRECTORY + "/videos", { index: false, redirect: false })
);

module.exports = documentation;
