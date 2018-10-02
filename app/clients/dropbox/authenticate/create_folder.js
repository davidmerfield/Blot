var mkdir = require("./mkdir");
var createClient = require("../util/createClient");

module.exports = function create_folder(req, res, next) {
  var new_account = req.new_account;
  var client = createClient(new_account.access_token);

  mkdir(client, "/" + req.blog.title, function(err, folder, folder_id) {
    if (err) return next(err);

    req.new_account.folder = folder;
    req.new_account.folder_id = folder_id;

    return next();
  });
};
