const fs = require("fs-extra");
const sharp = require("sharp");
const makeSlug = require("helper/makeSlug");
const cache_directory = __dirname + "/data/cache";

module.exports = async (folder, item) => {
  const slug = makeSlug(item.title.split(" ").slice(0, 4).join(" "));
  const itemFolder = `${folder}/Posts/${slug}`;

  // create a folder for this item
  fs.emptyDirSync(itemFolder);

  // create a jpg preview
  const previewPath = `${itemFolder}/image.jpg`;
  console.log("Creating preview...");

  const modifiedFileName = fs
    .readdirSync(`${cache_directory}/${item.id}`)
    .find(i => i.startsWith("modified."));

  const masterFileName = fs
    .readdirSync(`${cache_directory}/${item.id}`)
    .find(i => i.startsWith("master."));

  const path = `${itemFolder}/${modifiedFileName || masterFileName}`;

  // ensure the input image is no larger than 2500px in any dimension
  await sharp(path)
    .resize(2500, 2500, {
      fit: "inside",
      withoutEnlargement: true
    })
    .toFile(previewPath);

  fs.outputFileSync(
    `${itemFolder}/item.txt`,
    `Title: ${item.title}
Date: ${item.date}
Tags: ${item.tags.join(", ")}
Source: ${item.source}
Collection: ${item.collection}
Medium: ${item.medium}

![${item.title}](image.jpg)

${item.summary}`
  );
};
