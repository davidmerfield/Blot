const join = require("path").join;

const determinePathToFolder = async (drive, folderId) => {
  let { data } = await drive.files.get({
    fileId: folderId,
    fields: "name, parents",
  });

  const path = [data.name];

  while (data.parents && data.parents.length) {
    data = (
      await drive.files.get({
        fileId: data.parents[0],
        fields: "name, parents",
      })
    ).data;
    path.unshift(data.name);
  }

  console.log("/" + join(path.join("/")));
  return "/" + join(path.join("/"));
};

module.exports = determinePathToFolder;
