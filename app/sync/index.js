module.exports = (blogID, callback) => {
  process.send({ chat: "blogID wants to sync " + blogID });
  callback();
};
