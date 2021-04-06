var DropboxDatabase = require("clients/dropbox/database");
var ContentHasher = require("clients/dropbox/util/content-hasher");
var createClient = require("clients/dropbox/util/createClient");
var get = require("../get/blog");
var tempDir = require("helper/tempDir")();
var fs = require("fs-extra");
var colors = require("colors/safe");

async function main(blog, client, outputDir) {
  console.log(`Downloading ${blog.handle} to ${outputDir}`);

  fs.ensureDirSync(outputDir);

  let res = await client.filesListFolder({
    path: "",
    recursive: true,
    include_media_info: false,
    include_deleted: false,
    include_mounted_folders: false,
    include_non_downloadable_files: false,
    limit: 100,
  });

  let entries = res.entries;

  while (res.has_more) {
    res = await client.filesListFolderContinue({ cursor: res.cursor });
    entries = entries.concat(res.entries);
    console.log(`Fetched ${entries.length} entries so far`);
  }

  console.log(`Fetched ${entries.length} entries in total`);

  entries = entries.filter((entry) => entry[".tag"] === "file");

  let files = [];

  for (let i = 0; i < entries.length; i++) {
    let entry = entries[i];
    let localPath = outputDir + entry.path_display;
    if (
      !fs.existsSync(localPath) ||
      (await ContentHasher(localPath)) !== entry.content_hash
    ) {
      files.push(entry);
    }
  }

  console.log(`Found ${files.length} files to download`);

  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    let from = file.path_lower;
    let to = outputDir + file.path_display;
    console.log(
      `${i + 1}/${files.length} ${file.size} bytes ${colors.dim(outputDir)}${
        file.path_display
      }`
    );

    let contents;

    try {
      contents = (
        await client.filesDownload({
          path: from,
        })
      ).fileBinary;
      fs.outputFileSync(to, contents);
    } catch (e) {
      console.log(
        `${i + 1}/${files.length} ${file.size} bytes ${colors.dim(
          outputDir
        )}${colors.red(file.path_display)} Error:`
      );
      console.log(e);
    }
  }

  console.log(`Downloaded ${files.length} files`);
}

get(process.argv[2], function (err, user, blog) {
  if (err) throw err;

  DropboxDatabase.get(blog.id, async function (err, account) {
    if (err) throw err;

    var client = createClient(account.access_token);
    var outputDir = require("path").join(
      tempDir,
      "download_folder_" + process.argv[2]
    );

    try {
      await main(blog, client, outputDir);
    } catch (e) {
      console.log(e);
    }
    process.exit();
  });
});
