const path = require("path");
const fs = require("fs-extra");

// Used to extract title text from Markdown title tags in note source files
const HASH_TITLE_REGEX = /\# (.*)/;
const DASH_TITLE_REGEX = /(.*)\n[=-]+\n/;

const extractName = (path, contents) => {
  const hashTitle = HASH_TITLE_REGEX.exec(contents);
  const dashTitle = DASH_TITLE_REGEX.exec(contents);

  if (hashTitle && hashTitle[1]) {
    return hashTitle[1];
  } else if (dashTitle && dashTitle[1]) {
    return dashTitle[1];
  } else {
    return withoutExtension(path.split("/").pop());
  }
};

const HASH_SUBTITLE_REGEX = /\# (.*)(\n*)\#\#(.*)/;
const DASH_SUBTITLE_REGEX = /(.*)\n[=]+\n(\n*)(.*)\n[-]+\n/;

const extractSubtitle = (contents) => {
  const hashSubtitle = HASH_SUBTITLE_REGEX.exec(contents);
  const dashSubtitle = DASH_SUBTITLE_REGEX.exec(contents);

  if (hashSubtitle && hashSubtitle[3]) {
    return hashSubtitle[3];
  } else if (dashSubtitle && dashSubtitle[3]) {
    return dashSubtitle[3];
  } else {
    return "";
  }
};

const removeLeadingDash = (name) => (name[0] === "-" ? name.slice(1) : name);

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
            const contents = fs.readFileSync(
              NOTES_DIRECTORY + "/" + section + "/" + article,
              "utf-8"
            );
            return {
              name: extractName(
                NOTES_DIRECTORY + "/" + section + "/" + article,
                contents
              ),
              subtitle: extractSubtitle(contents),
              id: withoutExtension(article),
              slug:
                "/about/notes/" +
                withoutExtension(section) +
                "/" +
                removeLeadingDash(withoutExtension(article)),
            };
          }),
        slug: "/about/notes/" + path.parse("/" + section).name,
      };
    });

module.exports = buildTOC;
