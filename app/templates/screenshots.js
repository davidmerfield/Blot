// todo turn this into a github action? runs when changes made automatically?
// const imageminify = require("helper/imageminify");

const screenshot = require("helper/screenshot");
const config = require("config");
const sharp = require("sharp");
const { dirname, basename, extname } = require("path");
const root = require("helper/rootDir");
const fs = require("fs-extra");
const TEMPLATES_DIRECTORY = root + "/app/templates/latest";
const FOLDERS_DIRECTORY = root + "/app/templates/folders";
const IMAGE_DIRECTORY = root + "/app/views/images/examples";

const templateOptions = {
  blog: {
    handle: "david"
  },
  magazine: {
    handle: "interviews"
  },
  photo: {
    handle: "william"
  },
  portfolio: {
    handle: "bjorn"
  },
  reference: {
    handle: "frances"
  }
};

const foldersOptions = {};

const templates = fs
  .readdirSync(TEMPLATES_DIRECTORY)
  .filter(i => !i.startsWith(".") && !i.endsWith(".md"))
  .map(i => {
    const handle = templateOptions[i] ? templateOptions[i].handle : "david";
    const template = i;
    const pages =
      templateOptions[i] && templateOptions[i].pages
        ? templateOptions[i].pages
        : ["/"];

    return pages.map((page, index) => {
      return {
        url: `${config.protocol}preview-of-${template}-on-${handle}.${config.host}${page}`,
        destination: `${IMAGE_DIRECTORY}/${template}/${index}`
      };
    });
  });

const folders = fs
  .readdirSync(FOLDERS_DIRECTORY)
  .filter(i => !i.startsWith(".") && !i.endsWith(".md") && !i.endsWith(".js"))
  .map(folder => {
    const pages =
      foldersOptions[folder] && foldersOptions[folder].pages
        ? foldersOptions[folder].pages
        : ["/"];
    return pages.map((page, index) => {
      return {
        url: `${config.protocol}${folder}.${config.host}${page}`,
        destination: `${IMAGE_DIRECTORY}/${folder}/${index}`
      };
    });
  });

const screenshots = templates.concat(folders).flat();

const main = async () => {
  console.log("Emptying image directory", IMAGE_DIRECTORY);
  await fs.emptyDir(IMAGE_DIRECTORY);

  console.log("Taking screenshots");
  for (const screenshot of screenshots) {
    try {
      // if the screenshot takes longer than 15 seconds, it's probably not going to work
      // so we should just skip it
      await Promise.race([
        takeScreenshot(screenshot),
        new Promise((resolve, reject) => {
          setTimeout(() => reject("Timeout"), 15000);
        })
      ]);
    } catch (error) {
      console.error(error);
    }
  }
};

const takeScreenshot = async ({ url, destination }) => {
  await fs.ensureDir(dirname(destination));

  const path = `${destination}.png`;

  console.log(`Taking screenshot of ${url} to ${path}`);
  await screenshot(url, path, { width: 1060, height: 1060 });

  const mobilePath = `${destination}.mobile.png`;
  console.log(`Taking mobile screenshot of ${url} to ${mobilePath}`);
  await screenshot(url, mobilePath, { mobile: true });

  const resize = ({ path, label, width }) =>
    sharp(path)
      .resize({ width })
      .toFile(
        `${dirname(path)}/${basename(path, extname(path))}-${label}${extname(
          path
        )}`
      );

  await Promise.all(
    [
      { path, label: "small", width: 96 },
      { path: mobilePath, label: "medium", width: 560 }
    ].map(resize)
  );
};

module.exports = main;

if (require.main === module) {
  main()
    .then(() => {
      console.log("Done!");
      process.exit();
    })
    .catch(console.error);
}
