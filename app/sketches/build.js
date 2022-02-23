module.exports = async function ({ data: { blogID, path } }) {
  console.log("building", blogID, path);
  return "Done!";
};
