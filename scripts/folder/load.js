var fs = require("fs-extra");
var helper = require("helper");
var join = require("path").join;
var blog_dir = join(helper.rootDir, "blogs");
var git_data_dir = join(helper.rootDir, "app", "clients", "git", "data");
var load_db = require("../db/load");
var dumps = join(__dirname, "data", "dumps");
var gitClientData = join(__dirname, "data", "git");
var config = require("config");
var access = require("../access");
var BLOG_ID = "1";
var DROPBOX_FOLDER_PATH = "/Users/David/Dropbox/Apps/Blot test";

if (require.main === module) {
  var identifier = process.argv[2];

  if (!identifier) return print_available();

  main(identifier, function(err) {
    if (err) throw err;

    access("dev", function() {
      process.exit();
    });
  });
}

function main(label, callback) {
  load_db(label, function(err) {
    if (err) return callback(err);

    fs.emptyDirSync(blog_dir);
    fs.ensureDirSync(join(dumps, label));
    fs.copySync(join(dumps, label), blog_dir);

    fs.emptyDirSync(git_data_dir);
    fs.ensureDirSync(join(gitClientData, label));
    fs.copySync(join(gitClientData, label), git_data_dir);

    fs.ensureDirSync(join(blog_dir, BLOG_ID));
    fs.emptyDirSync(config.cache_directory);
    fs.emptyDirSync(DROPBOX_FOLDER_PATH);
    fs.copySync(join(blog_dir, BLOG_ID), DROPBOX_FOLDER_PATH);

    callback();
  });
}

function load_dir(dir) {
  return fs.readdirSync(dir).filter(function(e) {
    return fs.statSync(dir + "/" + e).isDirectory();
  });
}

function print_available() {
  var all_dumps = load_dir(dumps);

  console.log("Please choose one of the available folders:");

  console.log();

  for (var i in all_dumps) {
    console.log("", all_dumps[i]);
  }

  console.log("");
}

// save the contents of the blogs folder to /dumps

// save the state of the database
