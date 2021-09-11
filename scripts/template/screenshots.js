// todo turn this into a github action? runs when changes made automatically?

const screenshot = require("helper/screenshot");
const imageminify = require("helper/imageminify");
const async = require("async");
const config = require("config");
const sharp = require("sharp");
const { dirname, basename, extname } = require("path");
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
  photo: {
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
        const mediumPath = `${VIEW_DIRECTORY}/${template}/${pages.indexOf(
          page
        )}.medium.png`;
        const smallPath = `${VIEW_DIRECTORY}/${template}/${pages.indexOf(
          page
        )}.small.png`;
        console.log("screenshotting", url);
        screenshot(url, path, (err) => {
          if (err) return next(err);

          const resize = ({ label, width }) =>
            sharp(path)
              .resize({ width })
              .toFile(
                `${dirname(path)}/${basename(
                  path,
                  extname(path)
                )}-${label}${extname(path)}`
              );

          Promise.all(
            [
              { label: "medium", width: 1120 },
              { label: "small", width: 306 },
            ].map(resize)
          ).then(() => {
            console.log("complete");
            next();
          });

          // console.log("resizing", path);
          // sharp(path)
          //   .resize({ width: 1120 }) // 2x the width of the image when viewed
          //   .toFile(mediumPath)
          //   .resize({ width: 306 }) // 2x the width of the image when viewed
          //   .toFile(smallPath)
          //   .then(() => {
          //     console.log("minifying", smallPath);
          //     next();
          //     // imageminify(smallPath, (err) => {
          //     //   if (err) return next(err);
          //     //   console.log("minified", smallPath);
          //     //   next();
          //     // });
          //   });
        });
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
