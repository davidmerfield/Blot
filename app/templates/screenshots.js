// todo turn this into a github action? runs when changes made automatically?
// const imageminify = require("helper/imageminify");

const screenshot = require("helper/screenshot");
const async = require("async");
const config = require("config");
const sharp = require("sharp");
const { dirname, basename, extname } = require("path");
const root = require("helper/rootDir");
const VIEW_DIRECTORY = root + "/app/views/images/templates";

const SCREENSHOTS = {
  blog: {
    handle: "david",
    pages: ["/lake", "/archives"]
  },
  magazine: {
    handle: "interviews",
    pages: ["/tagged/musicians", "/archives"]
  },
  photo: {
    handle: "william",
    pages: ["/", "/archives"]
  },
  portfolio: {
    handle: "bjorn",
    pages: ["/page/2", "/lake-smalsjn-dalarna-sweden-16632501564-o"]
  },
  reference: {
    handle: "frances",
    pages: [
      "/",
      "/marshfield-george-woodward-wickersham-house-cedarhurst-new-york-copy"
    ]
  }
};

async.eachOfSeries(
  SCREENSHOTS,
  function ({ handle, pages }, template, next) {
    const baseURL = `https://preview-of-${template}-on-${handle}.${config.host}`;
    async.eachSeries(
      pages,
      async function (page, next) {
        const url = baseURL + page;
        const dir = `${VIEW_DIRECTORY}/${template}`;

        const path = `${dir}/${pages.indexOf(page)}.png`;
        const mobilePath = `${dir}/${pages.indexOf(page)}.mobile.png`;
        const squarePath = `${dir}/${pages.indexOf(page)}.square.png`;

        console.log("Capturing screenshots:", url, path);
        await screenshot(url, path);
        console.log("Capturing screenshots:", url, mobilePath);
        await screenshot(url, mobilePath, { mobile: true });
        console.log("Capturing screenshots:", url, squarePath);
        await screenshot(url, squarePath, { width: 1060, height: 1060 });
        console.log("Done with", url);
        console.log();

        const resize = ({ path, label, width }) =>
          sharp(path)
            .resize({ width })
            .toFile(
              `${dirname(path)}/${basename(
                path,
                extname(path)
              )}-${label}${extname(path)}`
            );

        await Promise.all(
          [
            { path: path, label: "medium", width: 1120 },
            { path: squarePath, label: "small", width: 306 },
            { path: mobilePath, label: "medium", width: 560 }
          ].map(resize)
        );
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
