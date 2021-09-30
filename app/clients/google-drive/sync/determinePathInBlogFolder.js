const join = require("path").join;
const debug = require("debug")("blot:clients:google-drive:sync");

const determinePathInBlogFolder = async (drive, fileId, blogFolderID) => {
  debug("The file/folder", fileId, "path will be determined...");

  if (blogFolderID && fileId === blogFolderID) {
    debug("The file/folder", fileId, "refers to the blog folder");
    return { relativePath: "/" };
  }

  const parents = [];

  let data;
  let insideBlogFolder = false;

  const res = await drive.files.get({
    fileId,
    fields: "id, name, parents, md5Checksum, modifiedTime",
  });

  data = res.data;
  const { md5Checksum, modifiedTime } = res.data;
  while (data.parents && data.parents.length && !insideBlogFolder) {
    const res = await drive.files.get({
      fileId: data.parents[0],
      fields: "id, name, parents",
    });
    data = res.data;
    if (blogFolderID && data.id === blogFolderID) {
      insideBlogFolder = true;
    } else {
      parents.unshift({ name: data.name, id: data.id });
    }
  }

  if (insideBlogFolder || !blogFolderID) {
    const relativePath =
      "/" + join(parents.map((i) => i.name).join("/"), res.data.name);
    debug("The file/folder", fileId, "has relativePath", relativePath);
    return { relativePath, md5Checksum, modifiedTime };
  } else {
    debug("The file/folder", fileId, "is not in the blog folder");
    return {};
  }
};

module.exports = determinePathInBlogFolder;
