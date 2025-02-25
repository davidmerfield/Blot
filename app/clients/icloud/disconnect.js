const Blog = require("models/blog");
const database = require("./database");

module.exports = async (blogID, callback) => {
  
    await database.delete(blogID);

    Blog.set(blogID, { client: "" }, async function (err) {
        callback();
    });
};