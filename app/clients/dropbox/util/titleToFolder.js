module.exports = function titleToFolder(title) {
  let folder = title || "Untitled";

  folder = folder.split("/").join("");
  folder = folder.trim();

  return folder;
};
