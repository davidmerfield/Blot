const fs = require("fs-extra");
const sharp = require("sharp");
const makeSlug = require("helper/makeSlug");
const cache_directory = __dirname + "/data/cache";

module.exports = async (folder, item) => {
  // remove any slashes from the slug
  const words = item.title.split(" ").map(w => w.replace(/\//g, ""));

  const wordsForSlug =
    words.length < 4
      ? words
      : ["at", "in", "on", "of", "a"].includes(words.at(3))
      ? words.slice(0, 3)
      : words.slice(0, 4);

  const slug = makeSlug(wordsForSlug.join(" "));

  let itemFolder = `${folder}/Posts/${slug}`;
  let suffix = 1;

  while (fs.existsSync(itemFolder)) {
    suffix++;
    itemFolder = `${folder}/Posts/${slug}-${suffix}`;
  }

  // create a folder for this item
  fs.emptyDirSync(itemFolder);

  // create a jpg preview
  const previewName = `_${wordsForSlug.join(" ")}.jpg`;
  const previewPath = `${itemFolder}/${previewName}`;

  console.log("Creating preview...");

  const modifiedFileName = fs
    .readdirSync(`${cache_directory}/${item.id}`)
    .find(i => i.startsWith("modified."));

  const masterFileName = fs
    .readdirSync(`${cache_directory}/${item.id}`)
    .find(i => i.startsWith("master."));

  const path = `${cache_directory}/${item.id}/${
    modifiedFileName || masterFileName
  }`;

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

![${item.title}](${previewName})

${item.summary}

Medium: ${item.medium}

Source: ${item.source}`
  );
};
