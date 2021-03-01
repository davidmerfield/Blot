const path = require("path");
const fs = require("fs-extra");

// Used to extract title text from Markdown title tags in note source files
const HASH_TITLE_REGEX = /\# (.*)/;
const DASH_TITLE_REGEX = /(.*)\n[=-]+\n/;

const extractName = (filePath) => {
  const contents = fs.readFileSync(filePath, "utf-8");
  const hashTitle = HASH_TITLE_REGEX.exec(contents);
  const dashTitle = DASH_TITLE_REGEX.exec(contents);

  if (hashTitle && hashTitle[1]) {
    return hashTitle[1];
  } else if (dashTitle && dashTitle[1]) {
    return dashTitle[1];
  } else {
    return withoutExtension(filePath.split("/").pop());
  }
};

const withoutExtension = (name) => path.parse("/" + name).name;

const removeIgnorableItems = (name) =>
  name[0] !== "." && name[0] !== "_" && name !== "README";

const buildTOC = (NOTES_DIRECTORY) =>
  fs
    .readdirSync(NOTES_DIRECTORY)
    .filter(removeIgnorableItems)
    .map((section) => {
      return {
        name: section[0].toUpperCase() + section.slice(1),
        id: section,
        items: fs
          .readdirSync(NOTES_DIRECTORY + "/" + section)
          .filter(removeIgnorableItems)
          .map((article) => {
            return {
              name: extractName(
                NOTES_DIRECTORY + "/" + section + "/" + article
              ),
              id: withoutExtension(article),
              slug:
                "/about/notes/" +
                withoutExtension(section) +
                "/" +
                withoutExtension(article),
            };
          }),
        slug: "/about/notes/" + path.parse("/" + section).name,
      };
    });

module.exports = buildTOC;
