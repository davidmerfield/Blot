var request = require("request");
var PAGE_SIZE = 100;
var fs = require("fs-extra");

function url(slug, page) {
  return (
    "https://api.are.na/v2/channels/" +
    slug +
    "/contents?direction=desc&sort=position&per=" +
    PAGE_SIZE +
    "&channel_slug=" +
    slug +
    "&page=" +
    page
  );
}

if (require.main === module) {
  var slug = process.argv[2];
  var output_file = process.argv[3];

  if (!url) throw "No url";
  if (!output_file) throw "No output_file";

  main(slug, function(err, posts) {
    if (err) throw err;

    fs.outputJson(output_file, posts, { spaces: 2 }, function() {
      console.log("Done!");
      process.exit();
    });
  });
}

function main(slug, callback) {
  var page = 0;
  var posts = [];
  var new_posts;

  request(url(slug, page), function with_page(err, body, res) {
    new_posts = JSON.parse(res).contents;
    posts = posts.concat(new_posts);

    if (!new_posts.length) return callback(null, posts);

    page++;

    console.log("Found", posts.length, "posts...");

    request(url(slug, page), with_page);
  });
}

module.exports = main;
