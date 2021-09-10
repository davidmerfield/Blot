// todo turn this into a github action? runs when changes made automatically?

const screenshot = require("helper/screenshot");
const async = require("async");
const config = require("config");
const VIEW_DIRECTORY =
  require("helper/rootDir") + "/app/brochure/views/templates";

const SCREENSHOTS = {
  blog: {
    handle: "bjorn",
    pages: ["/", "/search?q=fishing"],
  },
  magazine: {
    handle: "interviews",
    pages: ["/", "/archives"],
  },
  photobook: {
    handle: "bjorn",
    pages: ["/", "/archives"],
  },
  portfolio: {
    handle: "interviews",
    pages: ["/", "/ingrid-newkirk"],
  },
  reference: {
    handle: "ferox",
    pages: ["/", "/iems-l13-3"],
  },
};

async.eachOfSeries(
  SCREENSHOTS,
  function ({ handle, pages }, template, next) {
    const baseURL = `https://preview-of-${template}-on-${handle}.${config.host}`;
    async.eachSeries(
      pages,
      function (page, next) {
        const url = baseURL + page;
        const path = `${VIEW_DIRECTORY}/${template}/${pages.indexOf(page)}.png`;
        console.log(url);
        console.log(path);
        screenshot(url, path, next);
      },
      next
    );
  },
  function (err) {
    if (err) throw err;
    console.log("Done!");
    process.exit();
  }
);
