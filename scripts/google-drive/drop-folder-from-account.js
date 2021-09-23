const database = require("clients/google-drive/database");
const get = require("./get-blog");

get(function (err, user, blog) {
  if (err) throw err;
  database.setAccount(
    blog.id,
    { folderID: "", folderName: "", folderPath: "" },
    function (err) {
      if (err) throw err;
      console.log("Removed folder from Dropbox account!");
      process.exit();
    }
  );
});
