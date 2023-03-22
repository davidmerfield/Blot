const Express = require("express");
const documentation = new Express();
const root = require("helper/rootDir");
const { join } = require("path");
const VIEW_DIRECTORY = join(root, "/app/documentation/data/views");

// Without 'index: false' this will server the index.html files inside the
// views folder in lieu of using the render definied in ./routes below.
// Without 'redirect: false' this will redirect URLs to existent directories
// adding an undesirable trailing slash.

const toplevel = [
  "/favicon-180x180.png",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
  "/favicon.ico",
];

for (const path of toplevel) {
  documentation.get(path, (req, res) =>
    res.sendFile(join(VIEW_DIRECTORY, path), {
      lastModified: false, // do not send Last-Modified header
      maxAge: 86400000, // cache forever
      acceptRanges: false, // do not allow ranged requests
      immutable: true, // the file will not change
    })
  );
}

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
  Express.static(VIEW_DIRECTORY + "/css", {
    index: false,
    redirect: false,
    maxAge: 86400000,
  })
);

documentation.use(
  "/images",
  Express.static(VIEW_DIRECTORY + "/images", {
    index: false,
    redirect: false,
    maxAge: 86400000,
  })
);

documentation.use(
  "/js",
  Express.static(VIEW_DIRECTORY + "/js", {
    index: false,
    redirect: false,
    maxAge: 86400000,
  })
);

documentation.use(
  "/videos",
  Express.static(VIEW_DIRECTORY + "/videos", {
    index: false,
    redirect: false,
    maxAge: 86400000,
  })
);

module.exports = documentation;
